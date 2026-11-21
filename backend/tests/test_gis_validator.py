import io
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import unittest
import numpy as np
import tifffile
from fastapi import UploadFile

from app.main import app
from app.services.gis_validator import GISValidator, ValidationError
from app.utils.geo_constants import MADURAI_GEO_METADATA
from app.core.database import SessionLocal, Base, engine
from app.api.routes.satellite import (
    validate_satellite_headers,
    upload_satellite_image,
    list_satellite_images,
    get_satellite_image,
    delete_satellite_image,
)

Base.metadata.create_all(bind=engine)


def create_mock_geotiff_buffer(
    width: int = 50,
    height: int = 50,
    dtype: np.dtype = np.uint16,
    origin_x: float = 184000.0,  # Madurai UTM 44N Center (~184145m)
    origin_y: float = 1100000.0, # (~1098511m)
    pixel_scale: float = 10.0,
    include_geotags: bool = True,
) -> io.BytesIO:
    """Helper creating an in-memory authentic GeoTIFF buffer."""
    buf = io.BytesIO()
    data = (np.random.RandomState(42).rand(height, width) * 4000).astype(dtype)

    extra_tags = []
    if include_geotags:
        extra_tags.append((33550, "d", 3, [pixel_scale, pixel_scale, 0.0], True))
        extra_tags.append((33922, "d", 6, [0.0, 0.0, 0.0, origin_x, origin_y, 0.0], True))
        extra_tags.append((34737, "s", 24, "WGS 84 / UTM zone 44N|", False))

    with tifffile.TiffWriter(buf) as tw:
        tw.write(data, extratags=extra_tags if include_geotags else None)

    buf.seek(0)
    return buf


class TestGISValidator(unittest.TestCase):
    def test_validator_rejects_unreferenced_image(self):
        """Verifies that non-georeferenced images (like standard RGB photos) are strictly rejected."""
        import tempfile
        with tempfile.TemporaryDirectory() as tmp_dir:
            unreferenced_path = Path(tmp_dir) / "camera_rgb.tif"
            buf = create_mock_geotiff_buffer(include_geotags=False)
            unreferenced_path.write_bytes(buf.getvalue())

            rejected = False
            try:
                GISValidator.inspect_geotiff(unreferenced_path)
            except ValidationError as e:
                rejected = True
                self.assertTrue(
                    "does not contain GeoTIFF spatial tags" in str(e) or "lacks spatial georeferencing" in str(e)
                )

            self.assertTrue(rejected, "Expected unreferenced image to be rejected")

    def test_validator_detects_madurai_intersection(self):
        """Verifies that bands located within Madurai District bounds are accepted."""
        import tempfile
        with tempfile.TemporaryDirectory() as tmp_dir:
            red_path = Path(tmp_dir) / "B04_Madurai.tif"
            nir_path = Path(tmp_dir) / "B08_Madurai.tif"

            red_buf = create_mock_geotiff_buffer(origin_x=184000.0, origin_y=1100000.0, pixel_scale=10.0)
            nir_buf = create_mock_geotiff_buffer(origin_x=184000.0, origin_y=1100000.0, pixel_scale=10.0)

            red_path.write_bytes(red_buf.getvalue())
            nir_path.write_bytes(nir_buf.getvalue())

            result = GISValidator.validate_satellite_pair(red_path, nir_path, sensor="SENTINEL_2")
            self.assertTrue(result["is_valid"])
            self.assertTrue(result["madurai_intersection"]["intersects"])
            self.assertEqual(result["sensor_id"], "SENTINEL_2")
            self.assertTrue(result["dimension_match"])

    def test_validator_rejects_outside_madurai(self):
        """Verifies that images located outside Madurai District (e.g. in Delhi/Himalayas) are rejected."""
        import tempfile
        with tempfile.TemporaryDirectory() as tmp_dir:
            red_path = Path(tmp_dir) / "B04_Outside.tif"
            nir_path = Path(tmp_dir) / "B08_Outside.tif"

            red_buf = create_mock_geotiff_buffer(origin_x=184000.0, origin_y=3000000.0, pixel_scale=10.0)
            nir_buf = create_mock_geotiff_buffer(origin_x=184000.0, origin_y=3000000.0, pixel_scale=10.0)

            red_path.write_bytes(red_buf.getvalue())
            nir_path.write_bytes(nir_buf.getvalue())

            rejected = False
            try:
                GISValidator.validate_satellite_pair(red_path, nir_path, sensor="SENTINEL_2")
            except ValidationError as e:
                rejected = True
                self.assertIn("does not intersect Madurai District", str(e))

            self.assertTrue(rejected, "Expected out-of-bounds imagery to be rejected")

    def test_satellite_api_lifecycle(self):
        """Tests validate_headers, upload, list, get details, and delete controller lifecycle."""
        db = SessionLocal()
        try:
            red_buf = create_mock_geotiff_buffer(origin_x=184000.0, origin_y=1100000.0)
            nir_buf = create_mock_geotiff_buffer(origin_x=184000.0, origin_y=1100000.0)

            red_upload = UploadFile(filename="T44QND_20240115_B04.tif", file=red_buf)
            nir_upload = UploadFile(filename="T44QND_20240115_B08.tif", file=nir_buf)

            # 1. Validate Headers
            val_res = validate_satellite_headers(
                sensor="SENTINEL_2",
                red_band=red_upload,
                nir_band=nir_upload,
            )
            self.assertEqual(val_res["status"], "success")
            self.assertTrue(val_res["details"]["madurai_intersection"]["intersects"])

            # 2. Upload
            red_buf.seek(0)
            nir_buf.seek(0)
            red_upload2 = UploadFile(filename="T44QND_20240115_B04.tif", file=red_buf)
            nir_upload2 = UploadFile(filename="T44QND_20240115_B08.tif", file=nir_buf)

            uploaded = upload_satellite_image(
                title="Madurai Sentinel-2 2024 Scene",
                sensor="SENTINEL_2",
                acquisition_date="2024-01-15T10:00:00Z",
                year=2024,
                month=1,
                notes="Copernicus Level-2A Tile 44QND",
                red_band=red_upload2,
                nir_band=nir_upload2,
                db=db,
            )
            self.assertIsNotNone(uploaded.id)
            self.assertTrue(uploaded.is_madurai_district)

            # 3. List
            images = list_satellite_images(db=db)
            self.assertTrue(any(img.id == uploaded.id for img in images))

            # 4. Get by ID
            fetched = get_satellite_image(image_id=uploaded.id, db=db)
            self.assertEqual(fetched.id, uploaded.id)

            # 5. Delete
            delete_satellite_image(image_id=uploaded.id, db=db)
            remaining = list_satellite_images(db=db)
            self.assertFalse(any(img.id == uploaded.id for img in remaining))
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
