import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import io
import unittest
import numpy as np
import tifffile
from fastapi import UploadFile

from app.services.change_service import ChangeService, CHANGE_CATEGORIES
from app.core.database import SessionLocal, Base, engine
from app.api.routes.satellite import upload_satellite_image, delete_satellite_image
from app.api.routes.ndvi import calculate_ndvi_for_scene
from app.api.routes.comparison import compare_scenes, list_comparisons, get_comparison
from app.models.schemas import ComparisonCreateRequest

Base.metadata.create_all(bind=engine)


def make_geotiff_buf(arr: np.ndarray, origin_x: float = 184000.0, origin_y: float = 1100000.0, pixel_scale: float = 10.0) -> io.BytesIO:
    buf = io.BytesIO()
    extra_tags = [
        (33550, "d", 3, [pixel_scale, pixel_scale, 0.0], True),
        (33922, "d", 6, [0.0, 0.0, 0.0, origin_x, origin_y, 0.0], True),
        (34737, "s", 24, "WGS 84 / UTM zone 44N|", False),
    ]
    with tifffile.TiffWriter(buf) as tw:
        tw.write(arr.astype(np.uint16), extratags=extra_tags)
    buf.seek(0)
    return buf


class TestComparisonService(unittest.TestCase):
    def test_change_detection_math(self):
        """Verifies pixel delta computation, classification bins, and area calculation."""
        import tempfile
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            b_path = tmp_path / "baseline_ndvi.tif"
            t_path = tmp_path / "target_ndvi.tif"

            # 5 pixels covering the 5 change classes:
            # P0: T1 = 0.60, T2 = 0.10 -> Δ = -0.50 (Severe Loss < -0.20)
            # P1: T1 = 0.40, T2 = 0.30 -> Δ = -0.10 (Moderate Loss -0.20 <= Δ < -0.05)
            # P2: T1 = 0.15, T2 = 0.16 -> Δ = +0.01 (Stable -0.05 <= Δ <= 0.05)
            # P3: T1 = 0.20, T2 = 0.32 -> Δ = +0.12 (Moderate Gain 0.05 < Δ <= 0.20)
            # P4: T1 = 0.10, T2 = 0.45 -> Δ = +0.35 (Significant Gain Δ > 0.20)
            b_arr = np.array([[0.60, 0.40, 0.15, 0.20, 0.10]], dtype=np.float32)
            t_arr = np.array([[0.10, 0.30, 0.16, 0.32, 0.45]], dtype=np.float32)

            with tifffile.TiffWriter(str(b_path)) as tw:
                tw.write(b_arr)
            with tifffile.TiffWriter(str(t_path)) as tw:
                tw.write(t_arr)

            res = ChangeService.compare_ndvi_rasters(
                baseline_id=1,
                target_id=2,
                baseline_raster_path=b_path,
                target_raster_path=t_path,
                baseline_year=2020,
                target_year=2024,
                baseline_green_pct=40.0,
                target_green_pct=60.0,
                baseline_green_sq_km=4.0,
                target_green_sq_km=6.0,
                resolution_m=10.0,
            )

            cats = res["transition_matrix"]["categories"]
            # Check 1 pixel per category
            for cat in cats:
                self.assertEqual(cat["pixel_count"], 1)

            self.assertEqual(res["baseline_year"], 2020)
            self.assertEqual(res["target_year"], 2024)
            self.assertAlmostEqual(res["green_cover_delta_percentage"], 20.0, places=2)
            self.assertAlmostEqual(res["green_cover_delta_sq_km"], 2.0, places=2)

            # Gain: 2 pixels (Moderate + Significant), Loss: 2 pixels, Stable: 1 pixel
            # Each pixel = 100 m^2 = 0.0001 km^2
            self.assertAlmostEqual(res["vegetation_gain_sq_km"], 0.0002, places=5)
            self.assertAlmostEqual(res["vegetation_loss_sq_km"], 0.0002, places=5)
            self.assertAlmostEqual(res["vegetation_stable_sq_km"], 0.0001, places=5)

            # Files generated
            self.assertTrue(Path(res["difference_raster_path"]).exists())
            self.assertTrue(Path(res["difference_map_png_path"]).exists())

    def test_temporal_comparison_api_flow(self):
        """Tests complete end-to-end multi-year comparison endpoint."""
        db = SessionLocal()
        created_image_ids = []
        try:
            # 1. Ingest Baseline (2020) - Dry/Built-up (NDVI = 0.0)
            red_2020_arr = np.full((40, 40), 1000, dtype=np.uint16)
            nir_2020_arr = np.full((40, 40), 1000, dtype=np.uint16)
            red_2020 = make_geotiff_buf(red_2020_arr)
            nir_2020 = make_geotiff_buf(nir_2020_arr)
            img1 = upload_satellite_image(
                title="Madurai Scene 2020",
                sensor="SENTINEL_2",
                acquisition_date="2020-03-15T10:00:00Z",
                year=2020,
                month=3,
                notes="Baseline dry season",
                red_band=UploadFile(filename="b4_2020.tif", file=red_2020),
                nir_band=UploadFile(filename="b8_2020.tif", file=nir_2020),
                db=db,
            )
            created_image_ids.append(img1.id)

            # 2. Ingest Target (2024) - Dense Vegetation (NIR=2500, RED=500 -> NDVI=0.667)
            red_2024_arr = np.full((40, 40), 500, dtype=np.uint16)
            nir_2024_arr = np.full((40, 40), 2500, dtype=np.uint16)
            red_2024 = make_geotiff_buf(red_2024_arr)
            nir_2024 = make_geotiff_buf(nir_2024_arr)
            img2 = upload_satellite_image(
                title="Madurai Scene 2024",
                sensor="SENTINEL_2",
                acquisition_date="2024-03-18T10:00:00Z",
                year=2024,
                month=3,
                notes="Target post-monsoon greening",
                red_band=UploadFile(filename="b4_2024.tif", file=red_2024),
                nir_band=UploadFile(filename="b8_2024.tif", file=nir_2024),
                db=db,
            )
            created_image_ids.append(img2.id)

            # 3. Calculate NDVI for both scenes
            ndvi1 = calculate_ndvi_for_scene(img1.id, db)
            ndvi2 = calculate_ndvi_for_scene(img2.id, db)
            self.assertIsNotNone(ndvi1.id)
            self.assertIsNotNone(ndvi2.id)

            # 4. Run Temporal Comparison
            req = ComparisonCreateRequest(
                baseline_analysis_id=ndvi1.id,
                target_analysis_id=ndvi2.id,
                title="Madurai 2020 vs 2024 Change Analysis",
            )
            comp_res = compare_scenes(req, db)
            self.assertEqual(comp_res.baseline_year, 2020)
            self.assertEqual(comp_res.target_year, 2024)
            self.assertGreater(comp_res.green_cover_delta_percentage, 0.0)
            self.assertGreater(comp_res.vegetation_gain_sq_km, 0.0)
            self.assertIsNotNone(comp_res.difference_map_url)

            # 5. List comparisons
            comp_list = list_comparisons(db)
            self.assertTrue(any(c.id == comp_res.id for c in comp_list))

            # 6. Retrieve single comparison
            single_comp = get_comparison(comp_res.id, db)
            self.assertEqual(single_comp.id, comp_res.id)
            self.assertEqual(single_comp.baseline_analysis_id, ndvi1.id)
            self.assertEqual(single_comp.target_analysis_id, ndvi2.id)

        finally:
            for iid in created_image_ids:
                try:
                    delete_satellite_image(iid, db)
                except Exception:
                    pass
            db.close()


if __name__ == "__main__":
    unittest.main()
