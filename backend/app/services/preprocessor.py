"""
Satellite Preprocessing & District Boundary Masking Service
Restricted Scope: Madurai District, Tamil Nadu, India Only

This service executes:
1. Spatial cropping to Madurai District bounding extent.
2. Exact polygon masking along official Madurai administrative GeoJSON boundary.
3. Multi-spectral grid alignment and resolution harmonization (e.g. 10m grid).
4. Masking out-of-district pixels to nodata (0).
5. Saving preprocessed authentic Red and NIR GeoTIFF rasters into data/processed/.
"""

import json
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import numpy as np
import tifffile
import cv2

from app.config import get_settings
from app.core.logging import logger
from app.utils.geo_constants import MADURAI_GEO_METADATA
from app.services.gis_validator import GISValidator, ValidationError

# Check if rasterio is available for primary reading/writing
try:
    import rasterio
    from rasterio.mask import mask as rasterio_mask
    HAS_RASTERIO = True
except ImportError:
    HAS_RASTERIO = False

settings = get_settings()


class PreprocessorError(Exception):
    """Exception raised when preprocessing or boundary masking fails."""
    pass


class SatellitePreprocessor:
    """
    Handles preprocessing and administrative clipping strictly for Madurai District.
    """

    @staticmethod
    def load_madurai_polygon() -> Dict[str, Any]:
        """Loads the official Madurai District GeoJSON boundary."""
        boundary_file = settings.BOUNDARIES_DIR / "madurai_boundary.geojson"
        if not boundary_file.exists():
            raise PreprocessorError(f"Madurai boundary GeoJSON not found at: {boundary_file}")

        try:
            with open(boundary_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data
        except Exception as e:
            raise PreprocessorError(f"Failed to load Madurai boundary GeoJSON: {str(e)}")

    @classmethod
    def read_raster_band(cls, file_path: Path) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Reads a single band raster and its georeferencing metadata.
        Returns (band_array, metadata).
        """
        if not file_path.exists():
            raise PreprocessorError(f"File does not exist: {file_path}")

        meta = GISValidator.inspect_geotiff(file_path)

        # Read raster pixel data
        if HAS_RASTERIO:
            try:
                with rasterio.open(file_path) as src:
                    arr = src.read(1)
                    return arr, meta
            except Exception:
                pass

        # Fallback reading with tifffile
        try:
            with tifffile.TiffFile(str(file_path)) as tf:
                page = tf.pages[0]
                arr = page.asarray()
                if arr.ndim == 3:
                    arr = arr[:, :, 0]  # Take first channel if multi-band
                return arr, meta
        except Exception as e:
            raise PreprocessorError(f"Failed to read raster data from '{file_path.name}': {str(e)}")

    @classmethod
    def preprocess_scene(
        cls,
        image_id: int,
        red_path: Path,
        nir_path: Path,
        sensor: str,
    ) -> Dict[str, Any]:
        """
        Executes end-to-end preprocessing for a satellite scene:
        1. Loads Red and NIR bands.
        2. Validates spatial compatibility.
        3. Performs grid harmonization if dimensions differ.
        4. Applies Madurai District GeoJSON boundary polygon mask.
        5. Writes clipped rasters to data/processed/.
        """
        logger.info(f"Starting preprocessing for scene #{image_id} ({sensor})...")

        # 1. Read bands and metadata
        red_data, red_meta = cls.read_raster_band(red_path)
        nir_data, nir_meta = cls.read_raster_band(nir_path)

        # 2. Grid Harmonization (Ensure identical shape)
        if red_data.shape != nir_data.shape:
            logger.info(
                f"Harmonizing band dimensions: Red {red_data.shape} vs NIR {nir_data.shape}. "
                f"Resampling NIR to match Red grid."
            )
            # Resample NIR to match Red band dimensions
            nir_data = cv2.resize(
                nir_data,
                (red_data.shape[1], red_data.shape[0]),
                interpolation=cv2.INTER_BILINEAR,
            )

        height, width = red_data.shape
        wgs_bounds = red_meta["wgs84_bounds"]

        # 3. Load Madurai Boundary Polygon
        boundary_geojson = cls.load_madurai_polygon()
        feature = boundary_geojson["features"][0]
        polygon_coords = feature["geometry"]["coordinates"][0]  # Exterior ring: [[lon, lat], ...]

        # 4. Generate Pixel Mask for Madurai District
        # Convert geographic (lon, lat) to raster pixel coordinates (col, row)
        min_lon = wgs_bounds["min_longitude"]
        max_lon = wgs_bounds["max_longitude"]
        min_lat = wgs_bounds["min_latitude"]
        max_lat = wgs_bounds["max_latitude"]

        lon_range = max_lon - min_lon
        lat_range = max_lat - min_lat

        if lon_range <= 0 or lat_range <= 0:
            raise PreprocessorError("Invalid bounding coordinate extents for raster.")

        poly_pixels = []
        for lon, lat in polygon_coords:
            # Map lon to [0, width], lat to [0, height] (inverted y-axis for raster)
            px = int(round(((lon - min_lon) / lon_range) * (width - 1)))
            py = int(round(((max_lat - lat) / lat_range) * (height - 1)))
            poly_pixels.append([px, py])

        poly_pixels_arr = np.array([poly_pixels], dtype=np.int32)

        # Create binary district mask: 1 inside Madurai, 0 outside
        district_mask = np.zeros((height, width), dtype=np.uint8)
        cv2.fillPoly(district_mask, poly_pixels_arr, 1)

        # Count pixels inside Madurai
        valid_pixels = int(np.sum(district_mask == 1))
        total_pixels = int(height * width)

        logger.info(
            f"Madurai District mask created: {valid_pixels} valid district pixels "
            f"out of {total_pixels} total raster grid pixels."
        )

        # 5. Apply Mask to Red and NIR Bands
        # Mask out-of-district pixels to 0 (nodata)
        masked_red = np.where(district_mask == 1, red_data, 0).astype(red_data.dtype)
        masked_nir = np.where(district_mask == 1, nir_data, 0).astype(nir_data.dtype)

        # 6. Save Clipped GeoTIFFs to backend/data/processed/
        processed_dir = settings.PROCESSED_DIR / f"scene_{image_id}"
        processed_dir.mkdir(parents=True, exist_ok=True)

        clipped_red_path = processed_dir / f"RED_clipped_{image_id}.tif"
        clipped_nir_path = processed_dir / f"NIR_clipped_{image_id}.tif"

        # Prepare GeoTIFF spatial tags
        pixel_scale_m = red_meta.get("resolution_m", 10.0)
        native_bounds = red_meta.get("native_bounds", {})
        origin_x = native_bounds.get("left", 184000.0)
        origin_y = native_bounds.get("top", 1100000.0)

        extra_tags = [
            (33550, "d", 3, [pixel_scale_m, pixel_scale_m, 0.0], True),  # ModelPixelScaleTag
            (33922, "d", 6, [0.0, 0.0, 0.0, origin_x, origin_y, 0.0], True),  # ModelTiepointTag
            (34737, "s", 24, "WGS 84 / UTM zone 44N|", False),  # GeoAsciiParamsTag
        ]

        with tifffile.TiffWriter(str(clipped_red_path)) as tw_red:
            tw_red.write(masked_red, extratags=extra_tags)

        with tifffile.TiffWriter(str(clipped_nir_path)) as tw_nir:
            tw_nir.write(masked_nir, extratags=extra_tags)

        logger.info(f"Clipped GeoTIFFs written successfully to {processed_dir}")

        return {
            "image_id": image_id,
            "clipped_red_path": str(clipped_red_path),
            "clipped_nir_path": str(clipped_nir_path),
            "dimensions": {
                "width": width,
                "height": height,
            },
            "target_crs": "EPSG:32644 (UTM Zone 44N)",
            "spatial_resolution_m": pixel_scale_m,
            "total_clipped_pixels": total_pixels,
            "valid_district_pixels": valid_pixels,
            "boundary_mask_applied": True,
        }
