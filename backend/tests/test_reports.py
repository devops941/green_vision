import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import unittest
from datetime import datetime, timezone
import io
import numpy as np
from fastapi import UploadFile

from app.config import get_settings
from app.services.report_service import ReportService
from app.core.database import SessionLocal, Base, engine
from app.api.routes.satellite import upload_satellite_image, delete_satellite_image
from app.api.routes.ndvi import calculate_ndvi_for_scene
from app.api.routes.reports import (
    generate_ndvi_report,
    list_reports,
    download_report,
    delete_report,
)
from tests.test_comparison import make_geotiff_buf

settings = get_settings()
Base.metadata.create_all(bind=engine)


class TestReportService(unittest.TestCase):
    def test_pdf_report_compilation(self):
        """Verifies programmatic PDF generation produces valid PDF bytes."""
        analysis_mock = {
            "id": 99,
            "mean_ndvi": 0.452,
            "min_ndvi": -0.120,
            "max_ndvi": 0.880,
            "std_ndvi": 0.180,
            "total_analyzed_area_sq_km": 3710.0,
            "green_cover_sq_km": 1250.0,
            "non_vegetation_sq_km": 2460.0,
            "green_cover_percentage": 33.69,
            "classification_breakdown": [
                {"class_id": 0, "name": "Water Bodies", "area_sq_km": 150.0, "percentage": 4.04, "color_hex": "#0077be"},
                {"class_id": 1, "name": "Built-up & Barren", "area_sq_km": 2310.0, "percentage": 62.26, "color_hex": "#d73027"},
                {"class_id": 2, "name": "Sparse Vegetation", "area_sq_km": 450.0, "percentage": 12.13, "color_hex": "#fee08b"},
                {"class_id": 3, "name": "Moderate Vegetation", "area_sq_km": 500.0, "percentage": 13.48, "color_hex": "#a6d96a"},
                {"class_id": 4, "name": "Dense Vegetation", "area_sq_km": 300.0, "percentage": 8.09, "color_hex": "#1a9850"},
            ],
            "colorized_png_path": None,
            "histogram_path": None,
        }

        scene_mock = {
            "id": 1,
            "title": "Madurai Sentinel-2 Multi-Spectral Scene",
            "sensor": "SENTINEL_2",
            "acquisition_date": "2024-03-15T10:00:00Z",
            "year": 2024,
            "spatial_resolution_m": 10.0,
            "cloud_cover_percentage": 1.2,
        }

        test_pdf_name = "test_unit_assessment_report.pdf"
        res = ReportService.generate_ndvi_assessment_report(
            analysis_id=99,
            analysis_dict=analysis_mock,
            scene_dict=scene_mock,
            output_filename=test_pdf_name,
        )

        pdf_path = settings.REPORTS_DIR / test_pdf_name
        self.assertTrue(pdf_path.exists())
        self.assertGreater(pdf_path.stat().st_size, 1000)

        # Check valid PDF magic header
        with open(pdf_path, "rb") as f:
            header = f.read(5)
            self.assertEqual(header, b"%PDF-")

        # Cleanup test file
        if pdf_path.exists():
            pdf_path.unlink()

    def test_report_api_flow(self):
        """Tests end-to-end report generation endpoint, listing, downloading, and deletion."""
        db = SessionLocal()
        created_image_id = None
        pdf_filename = None
        try:
            # 1. Ingest Scene
            red_arr = np.full((30, 30), 600, dtype=np.uint16)
            nir_arr = np.full((30, 30), 2400, dtype=np.uint16)
            red_buf = make_geotiff_buf(red_arr)
            nir_buf = make_geotiff_buf(nir_arr)

            img = upload_satellite_image(
                title="Scene for Report Test",
                sensor="SENTINEL_2",
                acquisition_date="2024-03-20T10:00:00Z",
                year=2024,
                month=3,
                notes="Report generation test scene",
                red_band=UploadFile(filename="b4_rep.tif", file=red_buf),
                nir_band=UploadFile(filename="b8_rep.tif", file=nir_buf),
                db=db,
            )
            created_image_id = img.id

            # 2. Calculate NDVI
            ndvi_res = calculate_ndvi_for_scene(img.id, db)

            # 3. Generate Report
            rep_info = generate_ndvi_report(ndvi_res.id, db)
            pdf_filename = rep_info.filename

            self.assertIsNotNone(rep_info.report_id)
            self.assertIn("GV-MDU-NDVI-", rep_info.report_id)
            self.assertTrue(Path(rep_info.file_path).exists())
            self.assertGreater(rep_info.file_size_kb, 0.0)

            # 4. List Reports
            reports = list_reports()
            self.assertTrue(any(r.filename == pdf_filename for r in reports))

            # 5. Download Report
            dl_response = download_report(pdf_filename)
            self.assertEqual(dl_response.media_type, "application/pdf")

        finally:
            # 6. Delete Report
            if pdf_filename:
                try:
                    delete_report(pdf_filename)
                except Exception:
                    pass

            if created_image_id:
                try:
                    delete_satellite_image(created_image_id, db)
                except Exception:
                    pass
            db.close()


if __name__ == "__main__":
    unittest.main()
