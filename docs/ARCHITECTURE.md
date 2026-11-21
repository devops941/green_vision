# GreenVision – System Architecture Blueprint
## Satellite-Based Urban Vegetation Intelligence & Green-Cover Analysis
**Geographical Scope:** Madurai District, Tamil Nadu, India Only

---

## 1. Executive Summary & Architectural Goals
**GreenVision** is a specialized GIS analytics web application engineered to calculate, monitor, classify, and compare urban vegetation and green-cover percentage exclusively for **Madurai District, Tamil Nadu, India**.

The application adheres strictly to scientific remote sensing standards:
- All vegetation indices are derived exclusively from authentic **Red** and **Near-Infrared (NIR)** bands from calibrated spaceborne sensors (Copernicus Sentinel-2 Level-2A and USGS Landsat 8/9 Level-2).
- Synthetic, random, or hardcoded raster calculations are categorically prohibited.
- Analysis boundaries are clipped strictly to the administrative polygon of Madurai District.

---

## 2. High-Level System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                              PRESENTATION LAYER                                   |
|                        React.js Single Page Application                           |
|  +-------------------+  +--------------------+  +-------------------------------+ |
|  | Dashboard / Stats |  | Madurai District   |  | Leaflet Geospatial Map Viewer | |
|  | (Summary Cards)   |  | Overview & Taluks  |  | (RGB, NIR, NDVI Raster Tiles) | |
|  +-------------------+  +--------------------+  +-------------------------------+ |
|  +-------------------+  +--------------------+  +-------------------------------+ |
|  | Satellite Band    |  | NDVI Analytics &   |  | Temporal Change Matrix        | |
|  | Multi-Upload UI   |  | Histograms (Chart) |  | & PDF Report Generator        | |
|  +-------------------+  +--------------------+  +-------------------------------+ |
+------------------------------------------^----------------------------------------+
                                           | HTTP / REST API (JSON & Static Rasters)
+------------------------------------------v----------------------------------------+
|                                API GATEWAY LAYER                                  |
|                             FastAPI (Python 3.12)                                 |
|  +------------------+  +-------------------+  +-------------------+               |
|  | Health & System  |  | Madurai Boundary  |  | Ingestion/Upload  |               |
|  | Route            |  | Route             |  | Route             |               |
|  +------------------+  +-------------------+  +-------------------+               |
|  +------------------+  +-------------------+  +-------------------+               |
|  | Preprocessing    |  | NDVI Calculation  |  | Temporal Change   |               |
|  | Route            |  | & Density Route   |  | & PDF Route       |               |
|  +------------------+  +-------------------+  +-------------------+               |
+------------------------------------------^----------------------------------------+
                                           |
+------------------------------------------v----------------------------------------+
|                            CORE GIS PROCESSING ENGINE                             |
|  +------------------------------------------------------------------------------+ |
|  | GIS Band Validator (Authentic sensor verification, CRS, Madurai bbox check)   | |
|  +------------------------------------------------------------------------------+ |
|  | Preprocessor & Clip (Rasterio windowed read, reprojection to EPSG:32644,     | |
|  | mask strictly with Madurai boundary polygon)                                  | |
|  +------------------------------------------------------------------------------+ |
|  | NDVI Scientific Engine (Vectorized 32-bit float: (NIR - RED) / (NIR + RED))   | |
|  +------------------------------------------------------------------------------+ |
|  | Vegetation Classifier & Zonal Area Calculator (NumPy categorical bins, ha)   | |
|  +------------------------------------------------------------------------------+ |
|  | Temporal Change Matrix Engine (Bi-temporal pixel diff & transition classes)   | |
|  +------------------------------------------------------------------------------+ |
|  | Cartographic & Color Ramp Generator (Matplotlib / OpenCV / Pillow colormaps) | |
|  +------------------------------------------------------------------------------+ |
|  | PDF Document Builder (ReportLab high-resolution geospatial charts & tables)   | |
+------------------------------------------^----------------------------------------+
                                           |
+------------------------------------------v----------------------------------------+
|                              DATA PERSISTENCE LAYER                               |
|  +--------------------+  +------------------------------------------------------+ |
|  | SQLite Database    |  | File System GeoTIFF Store                            | |
|  | - SatelliteImages  |  | - /data/boundaries/ (Madurai GeoJSON)                | |
|  | - NdviAnalyses     |  | - /data/raw/ (Authentic Red & NIR GeoTIFFs)          | |
|  | - Comparisons      |  | - /data/processed/ (Clipped & Resampled Rasters)      | |
|  | - ReportMetadata   |  | - /data/ndvi_outputs/ (Float32 GeoTIFFs & PNG Tiles) | |
|  |                    |  | - /data/reports/ (PDF analytical reports)            | |
|  +--------------------+  +------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## 3. Detailed Component Decomposition

### 3.1. Frontend Presentation Layer (React.js)
- **Framework & Build**: React 18 with modern component architecture and React Router v6.
- **Styling Architecture**: Environmental Green & Clean White palette (`#1B5E20`, `#2E7D32`, `#E8F5E9`, `#FFFFFF`, `#F8FAFC`).
- **Geospatial Map Visualization**:
  - Leaflet.js with React-Leaflet integration.
  - Madurai District boundary GeoJSON vector layer rendered automatically.
  - Multi-layer raster toggle: True-Color reference, Near-Infrared reflectance, Colorized NDVI overlay, and Difference / Change detection overlay.
- **Data Visualizations**:
  - Chart.js & React-Chartjs-2 for NDVI distribution histogram curves, vegetative class pie/doughnut breakdowns, and annual green-cover trend lines.
- **File Ingestion UI**:
  - Drag-and-drop dual-band ingestion form (requiring both Red and NIR bands for authentic computation).
  - Pre-flight metadata viewer displaying sensor type, acquisition year, bit depth, coordinate reference system, and validation status.

### 3.2. API Service Layer (FastAPI)
- **High Performance**: Asynchronous Python API powered by Starlette and Uvicorn.
- **Strict Data Validation**: Pydantic schemas validating all incoming requests, payload boundaries, and upload file signatures.
- **CORS & Static File Serving**: Configured to serve dynamic NDVI preview images, histograms, and PDF reports directly to the web client.

### 3.3. Core GIS Processing Engine
- **Rasterio & GDAL**:
  - Reading multi-spectral GeoTIFFs (`.tif`, `.jp2`).
  - Coordinate Reference System (CRS) validation and automated reprojection to the local projected coordinate system: **WGS 84 / UTM Zone 44N (`EPSG:32644`)**, which minimizes distortion across Madurai District.
  - Polygon masking using `rasterio.mask.mask` with the official Madurai administrative GeoJSON boundary.
- **NumPy Computation**:
  - Scientific NDVI formula:
    $$\text{NDVI} = \frac{\rho_{\text{NIR}} - \rho_{\text{RED}}}{\rho_{\text{NIR}} + \rho_{\text{RED}}}$$
  - Masked arrays (`numpy.ma`) applied to prevent division by zero and eliminate nodata / invalid atmospheric pixels.
  - Fast categorical classification into 5 standardized environmental classes:
    1. **Water Body** ($\text{NDVI} < 0.0$)
    2. **Built-up / Barren Land** ($0.0 \le \text{NDVI} < 0.2$)
    3. **Sparse / Shrub Vegetation** ($0.2 \le \text{NDVI} < 0.4$)
    4. **Moderate Vegetation** ($0.4 \le \text{NDVI} < 0.6$)
    5. **Dense / Vigorous Canopy** ($0.6 \le \text{NDVI} \le 1.0$)
- **Area Calculation**:
  - Exact metric calculations derived from pixel spatial resolution ($10\text{ m} \times 10\text{ m} = 100\text{ m}^2$ per pixel for Sentinel-2, or $30\text{ m} \times 30\text{ m} = 900\text{ m}^2$ for Landsat).
  - Aggregated into square kilometers ($\text{km}^2$) and hectares ($\text{ha}$) alongside district percentage.
- **Temporal Change Detection Engine**:
  - Pixel-by-pixel delta matrix between Year $T_1$ and Year $T_2$:
    $$\Delta\text{NDVI} = \text{NDVI}_{T_2} - \text{NDVI}_{T_1}$$
  - Change classification: Significant Degradation ($\Delta\text{NDVI} < -0.15$), Moderate Loss ($-0.15 \le \Delta < -0.05$), Stable ($-0.05 \le \Delta \le +0.05$), Moderate Greening ($+0.05 < \Delta \le +0.15$), High Vegetation Growth ($\Delta > +0.15$).

### 3.4. Persistence Layer (SQLite & GeoTIFF Storage)
- **Relational Metadata (SQLite via SQLAlchemy)**:
  - `satellite_images`: Stores sensor, acquisition date, CRS, spatial resolution, and band file paths.
  - `ndvi_analyses`: Stores calculated mean, standard deviation, green-cover percentage, and categorical breakdown.
  - `temporal_comparisons`: Stores multi-year comparison jobs, vegetation gain/loss statistics, and transition matrices.
- **Rasters & Artifacts**:
  - Dedicated storage folders separating raw inputs, preprocessed intermediate GeoTIFFs, NDVI products, and final analytical PDF documents.

---

## 4. Geospatial Parameters for Madurai District

| Parameter | Specification |
| :--- | :--- |
| **Target District** | Madurai |
| **State / Country** | Tamil Nadu, India |
| **Geographic Bounding Box** | Min: `[77.68°E, 9.53°N]`, Max: `[78.52°E, 10.35°N]` |
| **Geographic CRS** | WGS 84 (`EPSG:4326`) |
| **Projected CRS** | WGS 84 / UTM Zone 44N (`EPSG:32644`) |
| **Approximate District Area** | 3,741 $\text{km}^2$ |
| **Covered Taluks** | Madurai North, Madurai South, Melur, Thirumangalam, Usilampatti, Vadipatti, Peraiyur, Kalligudi, Tirupparankundram |
| **Primary Sentinel-2 MGRS Tile** | `44QND` (covers Madurai City & central district) |
| **Primary Landsat Path/Row** | Path: `143`, Row: `053` |
