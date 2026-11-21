"""
Vegetation Classification & Green Cover Analytics Service
Restricted Scope: Madurai District, Tamil Nadu, India Only

This service executes:
1. Standardized 5-class vegetation classification based on NDVI scientific thresholds.
2. Exact spatial area calculations in square kilometers (sq km) and hectares (ha).
3. Total green-cover percentage across Madurai District.
4. Generates classified categorical GeoTIFF rasters.
5. Renders high-resolution cartographic colorized PNGs.
6. Generates statistical frequency distribution histogram graphs with Matplotlib.
"""

from pathlib import Path
from typing import Dict, Any, List
import numpy as np
import tifffile
from PIL import Image
import matplotlib
matplotlib.use("Agg")  # Headless backend for web server
import matplotlib.pyplot as plt

from app.config import get_settings
from app.core.logging import logger
from app.utils.geo_constants import NDVI_CLASSIFICATION

settings = get_settings()


class ClassificationService:
    """Classifies NDVI rasters and computes authentic green-cover area metrics."""

    @classmethod
    def classify_and_quantify(
        cls,
        image_id: int,
        ndvi_array: np.ndarray,
        resolution_m: float = 10.0,
    ) -> Dict[str, Any]:
        """
        Performs 5-category vegetation classification, metric area calculations,
        colorized PNG export, and histogram curve generation.
        """
        logger.info(f"Classifying vegetation for scene #{image_id}...")

        height, width = ndvi_array.shape
        valid_mask = ~np.isnan(ndvi_array)
        total_valid_pixels = int(np.sum(valid_mask))

        if total_valid_pixels == 0:
            raise ValueError("NDVI array contains no valid pixels for classification.")

        # Metric Area per pixel
        pixel_area_sq_m = resolution_m * resolution_m
        sq_km_per_pixel = pixel_area_sq_m / 1_000_000.0

        total_area_sq_km = round(total_valid_pixels * sq_km_per_pixel, 4)

        # Create Classified Integer Raster (0 to 4, 255 for nodata)
        classified_arr = np.full((height, width), 255, dtype=np.uint8)

        classification_breakdown: List[Dict[str, Any]] = []
        vegetated_pixels = 0
        non_veg_pixels = 0

        # RGB buffer for colorized PNG
        rgb_image = np.full((height, width, 4), [248, 250, 252, 0], dtype=np.uint8)  # RGBA transparent

        # Class 0: Water Body (NDVI < 0.0)
        # Class 1: Built-up / Barren Land (0.0 <= NDVI < 0.2)
        # Class 2: Sparse Veg (0.2 <= NDVI < 0.4)
        # Class 3: Moderate Veg (0.4 <= NDVI < 0.6)
        # Class 4: Dense Veg (0.6 <= NDVI <= 1.0)
        hex_colors = {
            0: (13, 71, 161),    # Water: Deep Blue #0D47A1
            1: (189, 189, 189),  # Built-up: Gray #BDBDBD
            2: (255, 245, 157),  # Sparse: Pale Yellow-Green #FFF59D
            3: (102, 187, 106),  # Moderate: Vibrant Light Green #66BB6A
            4: (27, 94, 32),     # Dense: Dark Forest Green #1B5E20
        }

        for class_def in NDVI_CLASSIFICATION:
            cid = class_def["class_id"]
            min_v = class_def["min_ndvi"]
            max_v = class_def["max_ndvi"]

            if cid == 4:
                # Include upper boundary 1.0
                class_mask = valid_mask & (ndvi_array >= min_v) & (ndvi_array <= max_v)
            else:
                class_mask = valid_mask & (ndvi_array >= min_v) & (ndvi_array < max_v)

            classified_arr[class_mask] = cid

            px_count = int(np.sum(class_mask))
            class_sq_km = round(px_count * sq_km_per_pixel, 4)
            class_pct = round((px_count / total_valid_pixels) * 100.0, 2)
            class_ha = round(class_sq_km * 100.0, 2)

            if cid >= 2:
                vegetated_pixels += px_count
            else:
                non_veg_pixels += px_count

            rgb = hex_colors[cid]
            rgb_image[class_mask] = [rgb[0], rgb[1], rgb[2], 255]

            classification_breakdown.append({
                "class_id": cid,
                "name": class_def["name"],
                "min_ndvi": min_v,
                "max_ndvi": max_v,
                "pixel_count": px_count,
                "area_sq_km": class_sq_km,
                "area_hectares": class_ha,
                "percentage": class_pct,
                "color_hex": class_def["color_hex"],
                "description": class_def["description"],
            })

        green_cover_sq_km = round(vegetated_pixels * sq_km_per_pixel, 4)
        non_veg_sq_km = round(non_veg_pixels * sq_km_per_pixel, 4)
        green_cover_percentage = round((vegetated_pixels / total_valid_pixels) * 100.0, 2)

        # 1. Save Classified Integer GeoTIFF
        classified_filename = f"NDVI_classified_{image_id}.tif"
        classified_path = settings.NDVI_OUTPUT_DIR / classified_filename
        with tifffile.TiffWriter(str(classified_path)) as tw:
            tw.write(classified_arr)

        # 2. Save Colorized High-Resolution PNG
        colorized_filename = f"NDVI_colorized_{image_id}.png"
        colorized_path = settings.NDVI_OUTPUT_DIR / colorized_filename
        img = Image.fromarray(rgb_image, mode="RGBA")
        img.save(colorized_path, "PNG", optimize=True)

        # 3. Generate Scientific NDVI Frequency Histogram Plot
        histogram_filename = f"NDVI_histogram_{image_id}.png"
        histogram_path = settings.NDVI_OUTPUT_DIR / histogram_filename
        cls._generate_histogram_plot(
            ndvi_values=ndvi_array[valid_mask],
            output_path=histogram_path,
            image_id=image_id,
            green_cover_pct=green_cover_percentage,
        )

        logger.info(
            f"Scene #{image_id} Classification Complete: "
            f"Green Cover = {green_cover_percentage}% ({green_cover_sq_km} sq km) "
            f"Non-Veg = {round(100.0 - green_cover_percentage, 2)}% ({non_veg_sq_km} sq km)"
        )

        return {
            "total_analyzed_area_sq_km": total_area_sq_km,
            "green_cover_sq_km": green_cover_sq_km,
            "non_vegetation_sq_km": non_veg_sq_km,
            "green_cover_percentage": green_cover_percentage,
            "classification_breakdown": classification_breakdown,
            "classified_raster_path": str(classified_path),
            "classified_filename": classified_filename,
            "colorized_png_path": str(colorized_path),
            "colorized_png_url": f"/static/ndvi/{colorized_filename}",
            "histogram_path": str(histogram_path),
            "histogram_url": f"/static/ndvi/{histogram_filename}",
        }

    @staticmethod
    def _generate_histogram_plot(
        ndvi_values: np.ndarray,
        output_path: Path,
        image_id: int,
        green_cover_pct: float,
    ):
        """Generates an annotated NDVI frequency curve using Matplotlib."""
        fig, ax = plt.subplots(figsize=(8, 4.5), dpi=150)

        # Shaded background zones for NDVI classes
        ax.axvspan(-0.2, 0.0, color="#E3F2FD", alpha=0.6, label="Water Body (< 0.0)")
        ax.axvspan(0.0, 0.2, color="#F5F5F5", alpha=0.8, label="Built-up / Barren (0.0-0.2)")
        ax.axvspan(0.2, 0.4, color="#FFFDE7", alpha=0.8, label="Sparse Veg (0.2-0.4)")
        ax.axvspan(0.4, 0.6, color="#E8F8F5", alpha=0.8, label="Moderate Veg (0.4-0.6)")
        ax.axvspan(0.6, 1.0, color="#E8F5E9", alpha=0.8, label="Dense Veg (0.6-1.0)")

        # Histogram Curve
        counts, bins, _ = ax.hist(
            ndvi_values,
            bins=50,
            range=(-0.2, 1.0),
            color="#2E7D32",
            edgecolor="#1B5E20",
            alpha=0.85,
            density=True,
        )

        mean_val = float(np.mean(ndvi_values))
        ax.axvline(mean_val, color="#D32F2F", linestyle="--", linewidth=1.8, label=f"Mean NDVI: {mean_val:.3f}")
        ax.axvline(0.2, color="#FB8C00", linestyle=":", linewidth=1.5, label="Vegetation Threshold (0.2)")

        ax.set_title(
            f"Madurai District – NDVI Pixel Frequency Distribution (Scene #{image_id})\n"
            f"Total Green-Cover: {green_cover_pct:.1f}%",
            fontsize=11,
            fontweight="bold",
            color="#0F291E",
            pad=10,
        )
        ax.set_xlabel("Normalized Difference Vegetation Index (NDVI)", fontsize=9, fontweight="semibold")
        ax.set_ylabel("Pixel Probability Density", fontsize=9, fontweight="semibold")
        ax.set_xlim(-0.25, 1.0)
        ax.grid(True, linestyle=":", alpha=0.5)
        ax.legend(loc="upper right", fontsize=7.5, framealpha=0.9)

        plt.tight_layout()
        plt.savefig(output_path, format="png")
        plt.close(fig)
