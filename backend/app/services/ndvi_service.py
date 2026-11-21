"""
Authentic NDVI Calculation Service for GreenVision
Restricted Scope: Madurai District, Tamil Nadu, India Only

Calculates Normalized Difference Vegetation Index (NDVI) strictly using authentic
calibrated Red and Near-Infrared (NIR) spectral satellite bands:
    NDVI = (NIR - RED) / (NIR + RED)
"""

from pathlib import Path
from typing import Dict, Any, Tuple
import numpy as np
import tifffile

from app.config import get_settings
from app.core.logging import logger
from app.services.gis_validator import GISValidator

settings = get_settings()


class NdviServiceError(Exception):
    """Exception raised when NDVI computation fails."""
    pass


class NdviService:
    """Computes vectorized NDVI from authentic satellite bands with nodata protection."""

    @classmethod
    def read_band_array(cls, file_path: Path) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Reads a single preprocessed band raster."""
        if not file_path.exists():
            raise NdviServiceError(f"Raster band does not exist: {file_path}")

        meta = GISValidator.inspect_geotiff(file_path)
        with tifffile.TiffFile(str(file_path)) as tf:
            arr = tf.pages[0].asarray()
            if arr.ndim == 3:
                arr = arr[:, :, 0]
            return arr.astype(np.float32), meta

    @classmethod
    def compute_ndvi(
        cls,
        image_id: int,
        red_path: Path,
        nir_path: Path,
    ) -> Dict[str, Any]:
        """
        Calculates NDVI array from preprocessed Red and NIR bands:
        - Filters out-of-district nodata pixels (0).
        - Computes float32 NDVI = (NIR - RED) / (NIR + RED).
        - Handles zero-division and invalid numbers.
        - Computes statistical summary (mean, min, max, std).
        - Writes single-band float32 GeoTIFF to backend/data/ndvi_outputs/.
        """
        logger.info(f"Computing authentic NDVI for scene #{image_id}...")

        red_arr, red_meta = cls.read_band_array(red_path)
        nir_arr, nir_meta = cls.read_band_array(nir_path)

        if red_arr.shape != nir_arr.shape:
            raise NdviServiceError(
                f"Dimension mismatch between Red {red_arr.shape} and NIR {nir_arr.shape}."
            )

        height, width = red_arr.shape

        # Identify valid pixels inside Madurai District where signal is present
        # Non-district pixels were masked to 0 in Phase 3
        valid_mask = (red_arr > 0) | (nir_arr > 0)
        denom = nir_arr + red_arr

        # Prevent division by zero
        with np.errstate(divide="ignore", invalid="ignore"):
            ndvi_raw = (nir_arr - red_arr) / denom
            # Only keep values where valid_mask is True and denom > 0
            ndvi = np.where(valid_mask & (denom > 0), ndvi_raw, np.nan)
            # Scientifically NDVI is strictly bounded in [-1.0, 1.0]
            ndvi = np.clip(ndvi, -1.0, 1.0)

        # Extract valid values for statistical analysis
        valid_values = ndvi[~np.isnan(ndvi)]
        if len(valid_values) == 0:
            raise NdviServiceError("No valid vegetative or reflectance pixels found within Madurai boundary.")

        mean_ndvi = float(np.mean(valid_values))
        min_ndvi = float(np.min(valid_values))
        max_ndvi = float(np.max(valid_values))
        std_ndvi = float(np.std(valid_values))

        logger.info(
            f"Scene #{image_id} NDVI Computed: "
            f"Mean={mean_ndvi:.4f}, Min={min_ndvi:.4f}, Max={max_ndvi:.4f}, Std={std_ndvi:.4f} "
            f"across {len(valid_values)} valid pixels."
        )

        # Save Float32 GeoTIFF to backend/data/ndvi_outputs/
        output_filename = f"NDVI_float32_{image_id}.tif"
        output_path = settings.NDVI_OUTPUT_DIR / output_filename

        pixel_scale_m = red_meta.get("resolution_m", 10.0)
        native_bounds = red_meta.get("native_bounds", {})
        origin_x = native_bounds.get("left", 184000.0)
        origin_y = native_bounds.get("top", 1100000.0)

        extra_tags = [
            (33550, "d", 3, [pixel_scale_m, pixel_scale_m, 0.0], True),
            (33922, "d", 6, [0.0, 0.0, 0.0, origin_x, origin_y, 0.0], True),
            (34737, "s", 24, "WGS 84 / UTM zone 44N|", False),
        ]

        # In GeoTIFF, replace NaN with nodata value -9999.0 for standard GIS software compatibility
        output_arr = np.where(np.isnan(ndvi), -9999.0, ndvi).astype(np.float32)

        with tifffile.TiffWriter(str(output_path)) as tw:
            tw.write(output_arr, extratags=extra_tags)

        logger.info(f"NDVI Float32 GeoTIFF saved to {output_path}")

        return {
            "ndvi_array": ndvi,
            "ndvi_raster_path": str(output_path),
            "ndvi_filename": output_filename,
            "mean_ndvi": round(mean_ndvi, 4),
            "min_ndvi": round(min_ndvi, 4),
            "max_ndvi": round(max_ndvi, 4),
            "std_ndvi": round(std_ndvi, 4),
            "valid_pixel_count": int(len(valid_values)),
            "resolution_m": pixel_scale_m,
            "dimensions": {"width": width, "height": height},
        }
