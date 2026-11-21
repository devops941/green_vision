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

## Phase 2: GIS Validation & Satellite Ingestion Module (Awaiting Approval)
- [ ] Implement `backend/app/services/gis_validator.py`:
  - Authentic multi-spectral band detection (Sentinel-2 B04/B08, Landsat B4/B5).
  - Validation of CRS, spatial bounds against Madurai Bounding Box.
  - Rejection mechanism for ordinary non-georeferenced RGB images.
- [ ] Implement upload endpoint `POST /api/satellite/upload` supporting dual-band GeoTIFF ingestion.
- [ ] Build React Ingestion UI with drag-and-drop band upload, pre-flight validation status, and metadata card.

---

## Phase 3: Preprocessing & District Boundary Masking
- [ ] Implement `backend/app/services/preprocessor.py`:
  - Reprojection to UTM Zone 44N (`EPSG:32644`).
  - Spatial clipping strictly along Madurai District GeoJSON boundary.
  - Resolution harmonization (10m grid).
  - Cloud masking using Sentinel-2 SCL / Landsat QA bands.
- [ ] Save clipped GeoTIFFs into `backend/data/processed/`.

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
