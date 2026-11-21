import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import unittest
from app.api.routes.health import get_system_status
from app.api.routes.madurai import get_madurai_overview, get_madurai_boundary_geojson


class TestHealthAndMaduraiRoutes(unittest.TestCase):
    def test_health_endpoint(self):
        data = get_system_status()
        self.assertEqual(data.status, "operational")
        self.assertIn("Madurai District", data.target_scope)
        self.assertTrue(data.data_directories["boundaries"])

    def test_madurai_overview_endpoint(self):
        data = get_madurai_overview()
        self.assertEqual(data.district, "Madurai")
        self.assertEqual(data.state, "Tamil Nadu")
        self.assertGreaterEqual(len(data.taluks), 7)
        self.assertEqual(data.utm_crs, "EPSG:32644")

    def test_madurai_boundary_geojson(self):
        geojson = get_madurai_boundary_geojson()
        self.assertEqual(geojson["type"], "FeatureCollection")
        self.assertEqual(len(geojson["features"]), 1)
        feature = geojson["features"][0]
        self.assertEqual(feature["properties"]["DISTRICT"], "Madurai")


if __name__ == "__main__":
    unittest.main()
