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

## Phase 4: Authentic NDVI Calculation & Vegetation Classification
- [ ] Implement `backend/app/services/ndvi_service.py`:
  - Float32 vectorized band arithmetic: `NDVI = (NIR - RED) / (NIR + RED)`.
  - Division by zero and NaN handling.
  - Statistical analysis (mean, min, max, standard deviation).
- [ ] Implement `backend/app/services/classification_service.py`:
  - Categorical binning: Water, Built-up/Barren, Sparse Veg, Moderate Veg, Dense Veg.
  - Exact square kilometer and hectare calculations for each category.
  - Green-cover percentage computation across Madurai District.
- [ ] Render colorized visual PNGs using standardized GIS environmental color ramps.
- [ ] Generate NDVI frequency distribution histograms using Matplotlib.

---

## Phase 5: Interactive Web GIS Dashboard & Map Viewer
- [ ] Integrate Leaflet.js / React-Leaflet with Madurai bounding coordinates.
- [ ] Render Madurai District GeoJSON vector boundary overlay.
- [ ] Dynamic raster layer switcher (True Color, NIR, Colorized NDVI).
- [ ] Interactive NDVI value inspector on hover / click.
- [ ] Chart.js integration for vegetation distribution pie charts and NDVI histogram graphs.

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
