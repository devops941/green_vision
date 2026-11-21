# GreenVision – Phased Development Execution Roadmap
## Target Scope: Madurai District, Tamil Nadu, India Only

---

## Phase 1: Architecture, Project Structure & Foundation (COMPLETED)
- [x] Project environment inspection and directory analysis.
- [x] Comprehensive architectural design (Frontend, Backend, GIS Engine, Database).
- [x] Complete production folder structure creation.
- [x] Backend dependencies setup (`requirements.txt`).
- [x] Configuration management (`config.py`, `.env.example`).
- [x] SQLite database schema modeling (`models/database.py`).
- [x] Pydantic validation schemas (`models/schemas.py`).
- [x] Official Madurai District boundary polygon (`madurai_boundary.geojson`).
- [x] Backend entry point (`main.py`, `run.py`) with operational health endpoint.
- [x] Frontend scaffold with clean green-and-white environmental UI theme.
- [x] Master documentation (`README.md`, `ARCHITECTURE.md`, `SATELLITE_DATA_PLAN.md`).

---

## Phase 2: GIS Validation & Satellite Ingestion Module (COMPLETED)
- [x] Implemented `backend/app/services/gis_validator.py`:
  - Dual-engine GeoTIFF inspection (Rasterio & Tifffile).
  - Authentic multi-spectral band detection (Sentinel-2 B04/B08, Landsat B4/B5).
  - Spatial bounding box intersection against Madurai District (`[77.68°E, 9.53°N, 78.52°E, 10.35°N]`).
  - Strict rejection of ordinary unreferenced RGB photographs.
  - Mathematical Transverse Mercator UTM Zone 44N to WGS84 coordinate projection.
- [x] Implemented Satellite API endpoints (`backend/app/api/routes/satellite.py`):
  - `POST /api/satellite/validate-headers`: Pre-flight inspection.
  - `POST /api/satellite/upload`: Authentic Red/NIR dual-band upload & indexing.
  - `GET /api/satellite/images`: Query all registered scenes.
  - `GET /api/satellite/images/{id}`: Full scene metadata inspector.
  - `DELETE /api/satellite/images/{id}`: Delete scene and purge raw files.
- [x] Built React Ingestion UI:
  - `frontend/src/components/ingestion/BandUploadForm.jsx`: Drag-and-drop dual-band uploader with validation triggers.
  - `frontend/src/components/ingestion/MetadataViewer.jsx`: Pre-flight diagnostic badge viewer.
  - `frontend/src/pages/UploadPage.jsx`: Ingestion page with registered scenes table & detail modal.
- [x] Created and verified automated tests (`backend/tests/test_gis_validator.py`).

---

## Phase 3: Preprocessing & District Boundary Masking (COMPLETED)
- [x] Implemented `backend/app/services/preprocessor.py`:
  - Reprojection to UTM Zone 44N (`EPSG:32644`).
  - Spatial cropping along Madurai District bounding coordinates (`[77.68°E, 9.53°N, 78.52°E, 10.35°N]`).
  - Exact polygon masking using official `madurai_boundary.geojson` via OpenCV & Shapely rasterization.
  - Multi-spectral grid alignment and bilinear resolution harmonization.
  - Masking out-of-district pixels to nodata (0).
  - Saving clipped GeoTIFFs to `backend/data/processed/scene_<id>/`.
- [x] Implemented Preprocessing API endpoints (`backend/app/api/routes/preprocessing.py`):
  - `POST /api/preprocessing/process/{image_id}`: Trigger boundary masking and grid alignment.
  - `GET /api/preprocessing/status/{image_id}`: Query processing status, pixel counts, and paths.
- [x] Updated SQLite database schema (`SatelliteImage` table):
  - Columns: `is_preprocessed`, `processed_red_path`, `processed_nir_path`, `valid_pixels_count`, `clipped_pixels_count`, `processed_at`.
- [x] Updated Frontend UI (`frontend/src/pages/UploadPage.jsx`):
  - Added "Preprocess" action with loading indicator and progress feedback.
  - Status badges ("Clipped & Masked" vs "Raw").
  - Detail inspector displaying clipped file paths and valid Madurai pixel counts.
- [x] Created and verified automated tests (`backend/tests/test_preprocessor.py`).

---

## Phase 4: Authentic NDVI Calculation & Vegetation Classification (COMPLETED)
- [x] Implemented `backend/app/services/ndvi_service.py`:
  - Float32 vectorized scientific band arithmetic: `NDVI = (NIR - RED) / (NIR + RED)`.
  - Zero-division handling and nodata exclusion for pixels outside Madurai District.
  - Value bounds enforcement `[-1.0, 1.0]`.
  - Statistical analysis: Mean NDVI, Min NDVI, Max NDVI, Standard Deviation.
  - Exported single-band 32-bit float GeoTIFFs to `backend/data/ndvi_outputs/NDVI_float32_<id>.tif`.
- [x] Implemented `backend/app/services/classification_service.py`:
  - 5-tier environmental classification: Water (< 0.0), Built-up (0.0-0.2), Sparse Veg (0.2-0.4), Moderate Veg (0.4-0.6), Dense Veg (0.6-1.0).
  - Exact metric calculations: square kilometers (`sq km`), hectares (`ha`), and green-cover percentage across Madurai.
  - Exported classified integer GeoTIFFs (`NDVI_classified_<id>.tif`).
  - Rendered high-resolution colorized PNG visualizations (`NDVI_colorized_<id>.png`).
  - Generated scientific pixel frequency distribution histogram curves with Matplotlib (`NDVI_histogram_<id>.png`).
- [x] Implemented NDVI REST API endpoints (`backend/app/api/routes/ndvi.py`):
  - `POST /api/ndvi/calculate/{image_id}`: Authentic NDVI calculation and classification execution.
  - `GET /api/ndvi/analyses`: List all computed analyses for Madurai.
  - `GET /api/ndvi/analyses/{analysis_id}`: Query analysis by ID.
  - `GET /api/ndvi/analyses/image/{image_id}`: Query analysis by parent scene ID.
- [x] Built React NDVI Analytics Interface:
  - `frontend/src/components/ndvi/NdviControls.jsx`: Scene picker, environmental class scale bar, execution trigger.
  - `frontend/src/components/ndvi/NdviHistogram.jsx`: Matplotlib frequency distribution curve viewer.
  - `frontend/src/pages/NdviAnalysisPage.jsx`: Full analytics hub with 4 KPI cards, colorized raster map preview, 5-class progress bars & area breakdown table.
- [x] Created and verified automated tests (`backend/tests/test_ndvi.py`).

---

## Phase 5: Interactive Web GIS Dashboard & Map Viewer (COMPLETED)
- [x] Implemented Leaflet & React-Leaflet GIS Map Viewer (`frontend/src/components/map/MaduraiMapViewer.jsx`):
  - Fixed centered coordinates for Madurai District (`[9.9252°N, 78.1198°E]`).
  - Base layer switcher: Satellite (Esri Imagery), Street (OpenStreetMap), Clean (CartoDB Light).
  - Official Madurai District administrative vector boundary overlay from GeoJSON.
  - Colorized NDVI raster image overlay with interactive opacity slider (0% to 100%).
  - One-click "Reset View" button to return to Madurai District bounds.
- [x] Implemented Backend Pixel Probe API (`GET /api/ndvi/probe/{image_id}?lat={lat}&lon={lon}`):
  - Samples exact Float32 NDVI values and vegetation categories directly from the GeoTIFF raster at clicked coordinates.
  - Handles nodata and boundary exclusions.
- [x] Interactive On-Map Click Probe:
  - Users can click anywhere on the Madurai map to place a green pin displaying exact sampled NDVI value and class badge.
- [x] Chart.js Visual Components:
  - `frontend/src/components/dashboard/VegetationDoughnutChart.jsx`: 5-tier distribution donut with center green-cover percentage.
  - `frontend/src/components/dashboard/VegetationBarChart.jsx`: Horizontal hectare area distribution bars.
- [x] Complete Executive Dashboard (`frontend/src/pages/DashboardPage.jsx`):
  - Real-time KPI stat cards, embedded interactive GIS map, Chart.js visual charts, and scene quick-selector.

---

## Phase 6: Temporal Change Analysis & Year-wise Comparison
- [ ] Implement `backend/app/services/change_service.py`:
  - Dual-year baseline vs target comparison (e.g. 2018 vs 2024).
  - Pixel difference matrix: `ΔNDVI = NDVI_T2 - NDVI_T1`.
  - Vegetation gain vs loss classification.
- [ ] Frontend Year-wise Comparison page with split-screen slider / diff map.
- [ ] Transition statistics table and trend charts.

---

## Phase 7: Professional PDF Report Generation & Export
- [ ] Implement `backend/app/services/report_service.py` using ReportLab:
  - Official Madurai District Urban Green-Cover Assessment Report.
  - Embedded high-res NDVI maps, classification breakdowns, and delta tables.
  - Automated PDF download endpoint.
- [ ] End-to-end testing, performance verification, and final deployment guide.
