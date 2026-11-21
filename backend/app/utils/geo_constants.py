"""
Geospatial Constants for Madurai District, Tamil Nadu, India.
Restricted geographical scope: Madurai District only.
"""

# Madurai District Geospatial Bounds (WGS84 EPSG:4326)
MADURAI_GEO_METADATA = {
    "district": "Madurai",
    "state": "Tamil Nadu",
    "country": "India",
    "center": {
        "latitude": 9.9252,
        "longitude": 78.1198
    },
    "bbox_wgs84": {
        "min_longitude": 77.68,
        "min_latitude": 9.53,
        "max_longitude": 78.52,
        "max_latitude": 10.35,
    },
    "utm_crs": "EPSG:32644",  # WGS 84 / UTM Zone 44N
    "geographic_crs": "EPSG:4326",
    "area_sq_km": 3741.0,
    "taluks": [
        "Madurai North",
        "Madurai South",
        "Melur",
        "Thirumangalam",
        "Usilampatti",
        "Vadipatti",
        "Peraiyur",
        "Kalligudi",
        "Tirupparankundram"
    ]
}

# Supported authentic satellite platforms and their corresponding RED & NIR bands
SUPPORTED_SENSORS = {
    "SENTINEL_2": {
        "name": "Copernicus Sentinel-2 (MSI)",
        "red_band": "B04",
        "nir_band": "B08",
        "red_wavelength_nm": 665,
        "nir_wavelength_nm": 842,
        "spatial_resolution_m": 10,
        "level": "Level-2A (Surface Reflectance / BOA)"
    },
    "LANDSAT_8_9": {
        "name": "USGS Landsat 8/9 (OLI/TIRS)",
        "red_band": "B4",
        "nir_band": "B5",
        "red_wavelength_nm": 655,
        "nir_wavelength_nm": 865,
        "spatial_resolution_m": 30,
        "level": "Collection 2 Level-2 (Surface Reflectance)"
    }
}

# Standard Scientific NDVI Classification Thresholds for Urban and Semi-Arid Environments
NDVI_CLASSIFICATION = [
    {
        "class_id": 0,
        "name": "Water Body",
        "min_ndvi": -1.0,
        "max_ndvi": 0.0,
        "color_hex": "#0D47A1",  # Deep Blue
        "description": "Rivers, tanks, reservoirs, wetlands"
    },
    {
        "class_id": 1,
        "name": "Built-up / Barren Land",
        "min_ndvi": 0.0,
        "max_ndvi": 0.2,
        "color_hex": "#BDBDBD",  # Concrete Gray / Sand
        "description": "Urban concrete, roads, bare soil, rock"
    },
    {
        "class_id": 2,
        "name": "Sparse / Shrub Vegetation",
        "min_ndvi": 0.2,
        "max_ndvi": 0.4,
        "color_hex": "#FFF59D",  # Pale Yellow-Green
        "description": "Dry grassland, scrub, open canopy shrubs"
    },
    {
        "class_id": 3,
        "name": "Moderate Vegetation",
        "min_ndvi": 0.4,
        "max_ndvi": 0.6,
        "color_hex": "#66BB6A",  # Light Green
        "description": "Agricultural crops, urban parks, mixed foliage"
    },
    {
        "class_id": 4,
        "name": "Dense / Vigorous Vegetation",
        "min_ndvi": 0.6,
        "max_ndvi": 1.0,
        "color_hex": "#1B5E20",  # Dark Forest Green
        "description": "Dense forest, irrigated orchards, thick tree canopy"
    }
]
