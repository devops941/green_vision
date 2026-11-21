# Authentic Satellite Data Acquisition Plan for Madurai District
## GreenVision Remote Sensing Strategy

---

## 1. Strict Data Authenticity Guidelines
GreenVision enforces rigorous remote sensing principles:
- **No RGB Approximations**: Visible green bands from standard photographs cannot calculate authentic NDVI. Green leaf chlorophyll absorbs red light (~660 nm) and strongly reflects near-infrared radiation (~840-860 nm).
- **Surface Reflectance (Level-2)**: Data must be atmospherically corrected Bottom-Of-Atmosphere (BOA) surface reflectance to ensure comparability across different years.
- **Geographic Clipping**: Satellite scenes must intersect Madurai District coordinates (`77.68°E - 78.52°E`, `9.53°N - 10.35°N`).

---

## 2. Primary Authentic Satellite Sources

### 2.1. Copernicus Sentinel-2 (European Space Agency)
Sentinel-2 MultiSpectral Instrument (MSI) is the primary sensor for GreenVision due to its high spatial resolution (10 meters) and frequent 5-day revisit cycle.

- **Required Bands**:
  - **Band 4 (Red)**: Central wavelength $665\text{ nm}$, spatial resolution $10\text{ m}$.
  - **Band 8 (NIR - Broad)**: Central wavelength $842\text{ nm}$, spatial resolution $10\text{ m}$.
  - *(Optional)* Band 2 (Blue, 490 nm) & Band 3 (Green, 560 nm) for true-color RGB backdrop composites.
- **Product Level**: **Level-2A (L2A)** – Bottom-Of-Atmosphere (BOA) surface reflectance.
- **MGRS Tile for Madurai**: Tile **`44QND`** directly covers Madurai city and surrounding taluks. Adjacent tiles include `44PND` (southern portion) and `44QNC` (eastern portion).
- **Access Repositories**:
  - Copernicus Data Space Ecosystem (CDSE): `dataspace.copernicus.eu`
  - AWS Open Data Registry (`sentinel-cogs` / `s3://sentinel-cogs`)
  - Element84 Earth Search STAC API

### 2.2. USGS Landsat 8 & 9 (NASA / USGS)
Used for multi-year historical trend comparisons dating back over a decade.

- **Required Bands**:
  - **Band 4 (Red)**: Central wavelength $655\text{ nm}$, spatial resolution $30\text{ m}$.
  - **Band 5 (NIR)**: Central wavelength $865\text{ nm}$, spatial resolution $30\text{ m}$.
- **Product Level**: **Collection 2 Level-2 Surface Reflectance (L2SP)**.
- **Worldwide Reference System (WRS-2)**:
  - **Path: 143, Row: 053** (Centers directly over Madurai District, Tamil Nadu).
- **Access Repositories**:
  - USGS EarthExplorer (`earthexplorer.usgs.gov`)
  - Microsoft Planetary Computer STAC
  - AWS Open Data Landsat Collection 2

---

## 3. Recommended Acquisition Strategy & Temporal Windows

To ensure accurate multi-year vegetation comparison without seasonal rainfall artifacts:
1. **Seasonal Window Consistency**:
   - Compare images acquired in the **same seasonal window** each year (e.g., Post-Monsoon: November–January, or Peak Dry Season: March–May).
   - This isolates real urban canopy changes from seasonal crop harvest cycles.
2. **Cloud Cover Constraint**:
   - Filter scenes with $< 10\%$ total cloud cover over Madurai District.
   - Utilize Scene Classification Layer (SCL) in Sentinel-2 to automatically mask cloud and cirrus pixels.

---

## 4. Ingestion Workflow in GreenVision

1. **User / Automated Ingestion**:
   - The user uploads Band 4 (`*B04*.tif`) and Band 8 (`*B08*.tif`) for Sentinel-2, or Band 4 and Band 5 for Landsat.
2. **Validation Hook**:
   - `GISValidator` inspects the GeoTIFF headers:
     - Confirms bit depth (UInt16 or Float32).
     - Confirms coordinate reference system and bounds.
     - Confirms non-empty spatial intersection with Madurai District boundary polygon.
3. **Boundary Clipping**:
   - Rasterio extracts and crops the raster window exactly to the Madurai District GeoJSON outline.
4. **Standardized Storage**:
   - Processed bands are indexed in SQLite with acquisition timestamp, sensor tag, and spatial extent.
