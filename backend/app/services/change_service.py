"""
Temporal Change Analysis & Multi-Year Vegetation Comparison Service
Restricted Scope: Madurai District, Tamil Nadu, India Only

This service executes:
1. Pixel-by-pixel delta matrix computation between two observation years:
       ΔNDVI = NDVI_T2 - NDVI_T1
2. Categorical transition classification:
   - Severe Loss (Δ < -0.20)
   - Moderate Loss (-0.20 <= Δ < -0.05)
   - Stable / No Significant Change (-0.05 <= Δ <= +0.05)
   - Moderate Gain (+0.05 < Δ <= +0.20)
   - Significant Gain (Δ > +0.20)
3. Exact area quantification for vegetation gain, loss, and stable zones.
4. Difference GeoTIFF export and high-resolution change detection PNG map generation.
"""

from pathlib import Path
from typing import Dict, Any, Tuple
import numpy as np
import tifffile
from PIL import Image
import cv2

from app.config import get_settings
from app.core.logging import logger

settings = get_settings()


class ChangeServiceError(Exception):
    """Exception raised during temporal change detection."""
    pass


CHANGE_CATEGORIES = [
    {
        "id": 0,
        "name": "Severe Degradation / Loss",
        "min_delta": -2.0,
        "max_delta": -0.20,
        "color_hex": "#b71c1c",  # Deep Crimson
        "color_rgb": (183, 28, 28),
        "desc": "Clear-cutting, rapid urban encroachment, severe canopy loss"
    },
    {
        "id": 1,
        "name": "Moderate Vegetation Loss",
        "min_delta": -0.20,
        "max_delta": -0.05,
        "color_hex": "#ef5350",  # Coral Red
        "color_rgb": (239, 83, 80),
        "desc": "Crop harvesting, dry-season stress, partial canopy thinning"
    },
    {
        "id": 2,
        "name": "Stable / No Significant Change",
        "min_delta": -0.05,
        "max_delta": 0.05,
        "color_hex": "#cfd8dc",  # Slate Neutral Gray
        "color_rgb": (207, 216, 220),
        "desc": "Persistent built-up infrastructure, rocky terrain, or unchanged canopy"
    },
    {
        "id": 3,
        "name": "Moderate Vegetation Gain",
        "min_delta": 0.05,
        "max_delta": 0.20,
        "color_hex": "#81c784",  # Leaf Green
        "color_rgb": (129, 199, 132),
        "desc": "Crop growth, seasonal greening, young plantation canopy"
    },
    {
        "id": 4,
        "name": "Significant Vegetation Gain",
        "min_delta": 0.20,
        "max_delta": 2.0,
        "color_hex": "#1b5e20",  # Deep Forest Green
        "color_rgb": (27, 94, 32),
        "desc": "Afforestation, extensive urban tree planting, vigorous irrigated canopy"
    }
]


class ChangeService:
    """Computes bi-temporal delta rasters and vegetation transitions for Madurai District."""

    @classmethod
    def read_float32_raster(cls, file_path: Path) -> np.ndarray:
        """Reads a single Float32 NDVI GeoTIFF array."""
        if not file_path.exists():
            raise ChangeServiceError(f"NDVI raster file missing: {file_path}")

        with tifffile.TiffFile(str(file_path)) as tf:
            arr = tf.pages[0].asarray().astype(np.float32)
            if arr.ndim == 3:
                arr = arr[:, :, 0]
            # Replace GIS nodata (-9999.0) with NaN
            arr = np.where(arr <= -9000.0, np.nan, arr)
            return arr

    @classmethod
    def compare_ndvi_rasters(
        cls,
        baseline_id: int,
        target_id: int,
        baseline_raster_path: Path,
        target_raster_path: Path,
        baseline_year: int,
        target_year: int,
        baseline_green_pct: float,
        target_green_pct: float,
        baseline_green_sq_km: float,
        target_green_sq_km: float,
        resolution_m: float = 10.0,
    ) -> Dict[str, Any]:
        """
        Executes bi-temporal pixel diff and transition analysis.
        """
        logger.info(
            f"Comparing Madurai District NDVI: {baseline_year} (Analysis #{baseline_id}) "
            f"vs {target_year} (Analysis #{target_id})..."
        )

        b_arr = cls.read_float32_raster(baseline_raster_path)
        t_arr = cls.read_float32_raster(target_raster_path)

        # Dimension alignment
        if b_arr.shape != t_arr.shape:
            logger.info(f"Harmonizing temporal grids: {b_arr.shape} vs {t_arr.shape}")
            t_arr = cv2.resize(t_arr, (b_arr.shape[1], b_arr.shape[0]), interpolation=cv2.INTER_BILINEAR)

        height, width = b_arr.shape

        # Valid pixel mask where both rasters contain valid data
        valid_mask = (~np.isnan(b_arr)) & (~np.isnan(t_arr))
        total_valid = int(np.sum(valid_mask))

        if total_valid == 0:
            raise ChangeServiceError("No overlapping valid pixels found between baseline and target scenes.")

        # Compute Pixel-by-pixel Delta: ΔNDVI = T2 - T1
        delta_arr = np.where(valid_mask, t_arr - b_arr, np.nan)

        # Metric conversions
        pixel_area_sq_m = resolution_m * resolution_m
        sq_km_per_pixel = pixel_area_sq_m / 1_000_000.0

        # Change breakdown
        categories_breakdown = []
        rgb_diff = np.full((height, width, 4), [248, 250, 252, 0], dtype=np.uint8)

        gain_pixels = 0
        loss_pixels = 0
        stable_pixels = 0

        for cat in CHANGE_CATEGORIES:
            cid = cat["id"]
            min_d = cat["min_delta"]
            max_d = cat["max_delta"]

            if cid == 4:
                cat_mask = valid_mask & (delta_arr >= min_d) & (delta_arr <= max_d)
            else:
                cat_mask = valid_mask & (delta_arr >= min_d) & (delta_arr < max_d)

            px_count = int(np.sum(cat_mask))
            cat_sq_km = round(px_count * sq_km_per_pixel, 4)
            cat_pct = round((px_count / total_valid) * 100.0, 2)
            cat_ha = round(cat_sq_km * 100.0, 2)

            if cid in [0, 1]:
                loss_pixels += px_count
            elif cid in [3, 4]:
                gain_pixels += px_count
            else:
                stable_pixels += px_count

            rgb = cat["color_rgb"]
            rgb_diff[cat_mask] = [rgb[0], rgb[1], rgb[2], 255]

            categories_breakdown.append({
                "id": cid,
                "name": cat["name"],
                "min_delta": min_d,
                "max_delta": max_d,
                "pixel_count": px_count,
                "area_sq_km": cat_sq_km,
                "area_hectares": cat_ha,
                "percentage": cat_pct,
                "color_hex": cat["color_hex"],
                "description": cat["desc"],
            })

        gain_sq_km = round(gain_pixels * sq_km_per_pixel, 4)
        loss_sq_km = round(loss_pixels * sq_km_per_pixel, 4)
        stable_sq_km = round(stable_pixels * sq_km_per_pixel, 4)

        green_delta_sq_km = round(target_green_sq_km - baseline_green_sq_km, 4)
        green_delta_pct = round(target_green_pct - baseline_green_pct, 2)

        # 1. Save Difference GeoTIFF
        diff_raster_filename = f"diff_raster_{baseline_id}_to_{target_id}.tif"
        diff_raster_path = settings.NDVI_OUTPUT_DIR / diff_raster_filename

        output_diff = np.where(np.isnan(delta_arr), -9999.0, delta_arr).astype(np.float32)
        with tifffile.TiffWriter(str(diff_raster_path)) as tw:
            tw.write(output_diff)

        # 2. Save Colorized Change Detection PNG
        diff_map_filename = f"diff_map_{baseline_id}_to_{target_id}.png"
        diff_map_path = settings.NDVI_OUTPUT_DIR / diff_map_filename
        diff_img = Image.fromarray(rgb_diff, mode="RGBA")
        diff_img.save(diff_map_path, "PNG", optimize=True)

        logger.info(
            f"Temporal comparison complete: Gain = {gain_sq_km} sq km, Loss = {loss_sq_km} sq km, "
            f"Net Delta = {green_delta_pct}%"
        )

        return {
            "title": f"Madurai District Vegetation Change: {baseline_year} vs {target_year}",
            "baseline_year": baseline_year,
            "target_year": target_year,
            "green_cover_delta_sq_km": green_delta_sq_km,
            "green_cover_delta_percentage": green_delta_pct,
            "vegetation_gain_sq_km": gain_sq_km,
            "vegetation_loss_sq_km": loss_sq_km,
            "vegetation_stable_sq_km": stable_sq_km,
            "difference_raster_path": str(diff_raster_path),
            "difference_map_png_path": str(diff_map_path),
            "difference_map_url": f"/static/ndvi/{diff_map_filename}",
            "transition_matrix": {
                "categories": categories_breakdown,
                "total_compared_pixels": total_valid,
                "total_compared_area_sq_km": round(total_valid * sq_km_per_pixel, 4),
            },
        }
