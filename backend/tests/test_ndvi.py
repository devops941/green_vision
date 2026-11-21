import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import unittest
import numpy as np
import tifffile
from fastapi import UploadFile

from app.services.ndvi_service import NdviService
from app.services.classification_service import ClassificationService
from app.core.database import SessionLocal, Base, engine
from app.api.routes.satellite import upload_satellite_image, delete_satellite_image
from app.api.routes.ndvi import calculate_ndvi_for_scene, get_ndvi_analysis, get_ndvi_analysis_by_image
from tests.test_gis_validator import create_mock_geotiff_buffer

Base.metadata.create_all(bind=engine)


class TestNdviAndClassification(unittest.TestCase):
    def test_ndvi_math_and_statistics(self):
        """Verifies authentic vectorized NDVI calculation and boundary conditions."""
        import tempfile
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            red_path = tmp_path / "RED.tif"
            nir_path = tmp_path / "NIR.tif"

            # Create deterministic arrays
            # Pixel (0,0): Water (NIR < RED) -> (200 - 800) / (1000) = -0.6
            # Pixel (0,1): Built-up -> (1100 - 1000) / 2100 ~ 0.047
            # Pixel (1,0): Sparse Veg -> (1500 - 1000) / 2500 = 0.20
            # Pixel (1,1): Dense Veg -> (3500 - 500) / 4000 = 0.75
            red_arr = np.array([[800, 1000], [1000, 500]], dtype=np.uint16)
            nir_arr = np.array([[200, 1100], [1500, 3500]], dtype=np.uint16)

            extra_tags = [
                (33550, "d", 3, [10.0, 10.0, 0.0], True),
                (33922, "d", 6, [0.0, 0.0, 0.0, 184000.0, 1100000.0, 0.0], True),
                (34737, "s", 24, "WGS 84 / UTM zone 44N|", False),
            ]

            with tifffile.TiffWriter(str(red_path)) as tw:
                tw.write(red_arr, extratags=extra_tags)
            with tifffile.TiffWriter(str(nir_path)) as tw:
                tw.write(nir_arr, extratags=extra_tags)

            result = NdviService.compute_ndvi(image_id=101, red_path=red_path, nir_path=nir_path)

            ndvi = result["ndvi_array"]
            self.assertAlmostEqual(ndvi[0, 0], -0.6, places=2)
            self.assertAlmostEqual(ndvi[0, 1], 0.0476, places=2)
            self.assertAlmostEqual(ndvi[1, 0], 0.20, places=2)
            self.assertAlmostEqual(ndvi[1, 1], 0.75, places=2)

            self.assertEqual(result["valid_pixel_count"], 4)
            self.assertTrue(Path(result["ndvi_raster_path"]).exists())

    def test_vegetation_classification_and_area(self):
        """Verifies 5-category vegetation classification, area metrics, and plot outputs."""
        # 4 pixels at 10m resolution (10m x 10m = 100 sq m per pixel)
        # Total area = 400 sq m = 0.0004 sq km = 0.04 ha
        ndvi_arr = np.array([
            [-0.5, 0.1],  # Water (Class 0), Built-up (Class 1)
            [0.3, 0.7],   # Sparse (Class 2), Dense (Class 4)
        ], dtype=np.float32)

        res = ClassificationService.classify_and_quantify(image_id=202, ndvi_array=ndvi_arr, resolution_m=10.0)

        # 2 out of 4 pixels are vegetated (NDVI >= 0.2)
        self.assertEqual(res["green_cover_percentage"], 50.0)
        self.assertAlmostEqual(res["total_analyzed_area_sq_km"], 0.0004, places=4)
        self.assertAlmostEqual(res["green_cover_sq_km"], 0.0002, places=4)
        self.assertAlmostEqual(res["non_vegetation_sq_km"], 0.0002, places=4)

        # Verify output files generated
        self.assertTrue(Path(res["classified_raster_path"]).exists())
        self.assertTrue(Path(res["colorized_png_path"]).exists())
        self.assertTrue(Path(res["histogram_path"]).exists())

        # Verify 5 breakdown categories
        breakdown = res["classification_breakdown"]
        self.assertEqual(len(breakdown), 5)

        # Check Water Class
        water_cls = next(c for c in breakdown if c["class_id"] == 0)
        self.assertEqual(water_cls["pixel_count"], 1)
        self.assertEqual(water_cls["percentage"], 25.0)

        # Check Dense Class
        dense_cls = next(c for c in breakdown if c["class_id"] == 4)
        self.assertEqual(dense_cls["pixel_count"], 1)
        self.assertEqual(dense_cls["percentage"], 25.0)

    def test_ndvi_api_lifecycle(self):
        """Tests full API flow: upload scene -> calculate NDVI -> query analysis."""
        db = SessionLocal()
        try:
            red_buf = create_mock_geotiff_buffer(width=40, height=40, origin_x=184000.0, origin_y=1100000.0)
            nir_buf = create_mock_geotiff_buffer(width=40, height=40, origin_x=184000.0, origin_y=1100000.0)

            red_upload = UploadFile(filename="NDVI_B04.tif", file=red_buf)
            nir_upload = UploadFile(filename="NDVI_B08.tif", file=nir_buf)

            # 1. Ingest Scene
            img = upload_satellite_image(
                title="Scene for NDVI API Test",
                sensor="SENTINEL_2",
                acquisition_date="2024-03-01T10:00:00Z",
                year=2024,
                month=3,
                notes="Testing NDVI Calculation API",
                red_band=red_upload,
                nir_band=nir_upload,
                db=db,
            )

            # 2. Trigger NDVI Calculation
            analysis_resp = calculate_ndvi_for_scene(image_id=img.id, db=db)
            self.assertIsNotNone(analysis_resp.id)
            self.assertIsNotNone(analysis_resp.green_cover_percentage)
            self.assertIsNotNone(analysis_resp.mean_ndvi)
            self.assertTrue(analysis_resp.colorized_png_url.startswith("/static/ndvi/"))
            self.assertTrue(analysis_resp.histogram_url.startswith("/static/ndvi/"))

            # 3. Query Analysis by ID
            by_id = get_ndvi_analysis(analysis_id=analysis_resp.id, db=db)
            self.assertEqual(by_id.id, analysis_resp.id)

            # 4. Query Analysis by Image ID
            by_image = get_ndvi_analysis_by_image(image_id=img.id, db=db)
            self.assertEqual(by_image.id, analysis_resp.id)

            # 5. Clean up
            delete_satellite_image(image_id=img.id, db=db)
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
