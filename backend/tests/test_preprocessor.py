import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import unittest
import numpy as np
import tifffile
from fastapi import UploadFile

from app.services.preprocessor import SatellitePreprocessor
from app.services.gis_validator import GISValidator
from app.core.database import SessionLocal, Base, engine
from app.api.routes.satellite import upload_satellite_image, delete_satellite_image
from app.api.routes.preprocessing import preprocess_satellite_image, get_preprocessing_status
from tests.test_gis_validator import create_mock_geotiff_buffer

Base.metadata.create_all(bind=engine)


class TestPreprocessor(unittest.TestCase):
    def test_load_madurai_polygon(self):
        """Tests that the official Madurai administrative boundary loads properly."""
        geojson = SatellitePreprocessor.load_madurai_polygon()
        self.assertEqual(geojson["type"], "FeatureCollection")
        self.assertGreater(len(geojson["features"]), 0)
        coords = geojson["features"][0]["geometry"]["coordinates"][0]
        self.assertGreaterEqual(len(coords), 4)

    def test_preprocess_scene_with_masking(self):
        """Tests cropping, district polygon masking, and saving to data/processed."""
        import tempfile
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            red_path = tmp_path / "B04.tif"
            nir_path = tmp_path / "B08.tif"

            # Create GeoTIFF buffers inside Madurai bounds
            red_buf = create_mock_geotiff_buffer(width=60, height=60, origin_x=184000.0, origin_y=1100000.0)
            nir_buf = create_mock_geotiff_buffer(width=60, height=60, origin_x=184000.0, origin_y=1100000.0)

            red_path.write_bytes(red_buf.getvalue())
            nir_path.write_bytes(nir_buf.getvalue())

            result = SatellitePreprocessor.preprocess_scene(
                image_id=999,
                red_path=red_path,
                nir_path=nir_path,
                sensor="SENTINEL_2",
            )

            self.assertEqual(result["image_id"], 999)
            self.assertTrue(result["boundary_mask_applied"])
            self.assertGreater(result["valid_district_pixels"], 0)
            self.assertEqual(result["dimensions"]["width"], 60)
            self.assertEqual(result["dimensions"]["height"], 60)

            # Check that files exist on disk
            self.assertTrue(Path(result["clipped_red_path"]).exists())
            self.assertTrue(Path(result["clipped_nir_path"]).exists())

            # Verify that pixel values are read from output GeoTIFF
            with tifffile.TiffFile(result["clipped_red_path"]) as tf:
                arr = tf.pages[0].asarray()
                self.assertEqual(arr.shape, (60, 60))

    def test_preprocessing_api_lifecycle(self):
        """Tests end-to-end database integration with preprocessing endpoints."""
        db = SessionLocal()
        try:
            red_buf = create_mock_geotiff_buffer(origin_x=184000.0, origin_y=1100000.0)
            nir_buf = create_mock_geotiff_buffer(origin_x=184000.0, origin_y=1100000.0)

            red_upload = UploadFile(filename="PRE_B04.tif", file=red_buf)
            nir_upload = UploadFile(filename="PRE_B08.tif", file=nir_buf)

            # 1. Ingest image
            img = upload_satellite_image(
                title="Scene for Preprocessing Test",
                sensor="SENTINEL_2",
                acquisition_date="2024-02-01T10:00:00Z",
                year=2024,
                month=2,
                notes="Preprocessing Test",
                red_band=red_upload,
                nir_band=nir_upload,
                db=db,
            )
            self.assertFalse(img.is_preprocessed)

            # 2. Trigger preprocessing
            res = preprocess_satellite_image(image_id=img.id, db=db)
            self.assertTrue(res.is_preprocessed)
            self.assertIsNotNone(res.clipped_red_path)
            self.assertIsNotNone(res.clipped_nir_path)
            self.assertGreater(res.valid_district_pixels, 0)

            # 3. Check status
            status = get_preprocessing_status(image_id=img.id, db=db)
            self.assertTrue(status["is_preprocessed"])
            self.assertIsNotNone(status["processed_at"])

            # 4. Clean up
            delete_satellite_image(image_id=img.id, db=db)
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
