# Madurai District Boundaries Directory

This directory stores the official administrative geospatial boundaries for **Madurai District, Tamil Nadu, India**.

### Files:
- `madurai_boundary.geojson`: Administrative boundary polygon for Madurai district in standard WGS84 (`EPSG:4326`) format.

### Spatial Attributes:
- **State**: Tamil Nadu
- **District**: Madurai
- **Target Projection**: UTM Zone 44N (`EPSG:32644`)
- **Bounding Box**:
  - Min Longitude: 77.68° E
  - Min Latitude: 9.53° N
  - Max Longitude: 78.52° E
  - Max Latitude: 10.35° N
- **Usage**: Used in `backend/app/services/preprocessor.py` for spatial clipping, masking, and bounding box validation of satellite imagery. No data outside this boundary is analyzed.
