# GreenVision – Satellite-Based Urban Vegetation Intelligence & Green-Cover Analysis
### Restricted Geographical Scope: Madurai District, Tamil Nadu, India Only

---

## 1. Project Overview
**GreenVision** is a web-based geospatial intelligence platform built to monitor, quantify, and analyze urban vegetation dynamics across **Madurai District, Tamil Nadu**.

Using satellite remote sensing, GreenVision calculates the **Normalized Difference Vegetation Index (NDVI)** from authentic Near-Infrared (NIR) and Red spectral bands. It classifies land surface into distinct vegetative densities, calculates exact green-cover percentages and hectare metrics, and evaluates multi-year environmental changes.

---

## 2. Key Scientific & Architectural Principles
- **Geographic Restriction**: All analysis is strictly confined to the official administrative boundary of **Madurai District** (`77.68°E - 78.52°E`, `9.53°N - 10.35°N`).
- **Authentic Spectral Bands**: NDVI is computed exclusively from calibrated Level-2 surface reflectance products (Copernicus Sentinel-2 Band 8 & Band 4, or USGS Landsat 8/9 Band 5 & Band 4).
- **No RGB Approximations**: Standard 3-channel RGB imagery cannot measure chlorophyll absorption and is strictly rejected.
- **Zero Synthetic Data**: No random values, mock rasters, or hardcoded figures are permitted in the calculation engine.

---

## 3. Technology Stack

### Backend & GIS Engine
- **Language**: Python 3.12+
- **Framework**: FastAPI (Asynchronous REST API)
- **GIS & Rasters**: `rasterio`, `gdal`, `shapely`, `geopandas`
- **Data & Numerical Processing**: `numpy`, `pandas`, `scipy`
- **Image Processing & Visualization**: `opencv-python-headless`, `matplotlib`, `pillow`
- **Reporting**: `reportlab`
- **Database**: SQLite with `SQLAlchemy` ORM

### Frontend
- **Framework**: React.js (v18+)
- **Styling**: Bootstrap 5, Custom CSS Theme (`theme.css`)
- **Icons**: Lucide React
- **Geospatial Mapping**: Leaflet & React-Leaflet
- **Data Visualization**: Chart.js & React-Chartjs-2
- **HTTP Client**: Axios

---

## 4. Project Directory Structure

```
Green_Vision/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── health.py            # System status & environment health
│   │   │       └── madurai.py           # Madurai district metadata & GeoJSON boundary
│   │   ├── core/
│   │   │   ├── database.py              # SQLite connection & session management
│   │   │   └── logging.py               # Application logging setup
│   │   ├── models/
│   │   │   ├── database.py              # SQLAlchemy database tables
│   │   │   └── schemas.py               # Pydantic validation schemas
│   │   ├── services/                    # GIS services (validator, NDVI, classifier, etc.)
│   │   ├── utils/
│   │   │   └── geo_constants.py         # Madurai BBox, UTM Zone 44N CRS, NDVI thresholds
│   │   ├── config.py                    # Application settings (Pydantic Settings)
│   │   └── main.py                      # FastAPI application instance & routing
│   ├── data/
│   │   ├── boundaries/                  # Official Madurai district GeoJSON boundary
│   │   ├── raw/                         # Ingested authentic Red & NIR GeoTIFFs
│   │   ├── processed/                   # Reprojected & boundary-clipped rasters
│   │   ├── ndvi_outputs/                # Computed NDVI rasters & colorized PNG maps
│   │   └── reports/                     # Generated PDF analytical reports
│   ├── tests/
│   │   └── test_health.py               # Automated API tests
│   ├── .env.example                     # Backend environment configuration template
│   ├── requirements.txt                 # Backend Python dependencies
│   └── run.py                           # Backend development runner
├── frontend/
│   ├── public/
│   │   └── index.html                   # HTML template with Leaflet styles
│   ├── src/
│   │   ├── assets/
│   │   │   └── styles/
│   │   │       ├── theme.css            # Environmental Green & White theme tokens
│   │   │       └── main.css             # Dashboard layout & responsive styling
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Header.jsx           # Top navigation bar
│   │   │   │   ├── Sidebar.jsx          # Professional sidebar navigation
│   │   │   │   └── StatCard.jsx         # Summary KPI cards
│   │   │   ├── dashboard/               # Dashboard widgets
│   │   │   ├── map/                     # Leaflet map components
│   │   │   ├── ingestion/               # Satellite upload components
│   │   │   ├── ndvi/                    # NDVI visualization components
│   │   │   └── comparison/              # Year-wise comparison components
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx        # Primary executive dashboard
│   │   │   └── MaduraiOverviewPage.jsx  # Madurai administrative overview
│   │   ├── services/
│   │   │   └── api.js                   # Axios HTTP service client
│   │   ├── App.jsx                      # Main routing & application layout
│   │   └── index.jsx                    # React entry point
│   ├── package.json                     # Frontend dependencies
│   └── .env.example                     # Frontend environment configuration template
├── docs/
│   ├── ARCHITECTURE.md                  # Comprehensive technical architecture
│   ├── SATELLITE_DATA_PLAN.md           # Satellite acquisition strategy for Madurai
│   └── ROADMAP.md                       # Phased development execution roadmap
├── .gitignore                           # Git ignore for GIS data, dependencies, caches
└── README.md                            # Master project documentation
```

---

## 5. Directory & File Purpose Breakdown

| Folder / File | Purpose & Responsibility |
| :--- | :--- |
| `backend/app/main.py` | FastAPI application factory, lifespan management, CORS, and route registration. |
| `backend/app/config.py` | Pydantic Settings class managing environment variables, paths, and Madurai defaults. |
| `backend/app/core/database.py` | SQLite database connection factory using SQLAlchemy. |
| `backend/app/core/logging.py` | Standardized application logger with timestamp and level formatting. |
| `backend/app/models/database.py` | Database tables: `SatelliteImage`, `NdviAnalysis`, `TemporalComparison`. |
| `backend/app/models/schemas.py` | Pydantic serialization models for API responses and request validation. |
| `backend/app/utils/geo_constants.py` | Madurai bounding box (`[77.68, 9.53, 78.52, 10.35]`), UTM 44N (`EPSG:32644`), Taluks, NDVI categories. |
| `backend/data/boundaries/` | Holds `madurai_boundary.geojson` used as spatial mask for satellite clipping. |
| `backend/data/raw/` | Holds authentic raw multi-spectral satellite GeoTIFFs (Band 4 & Band 8). |
| `backend/data/processed/` | Holds reprojected and boundary-clipped intermediate rasters. |
| `backend/data/ndvi_outputs/` | Holds calculated 32-bit float NDVI GeoTIFFs and colorized map PNGs. |
| `backend/data/reports/` | Holds generated analytical PDF reports. |
| `frontend/src/assets/styles/theme.css` | White & green environmental color tokens (`--gv-primary`, `--gv-bg-main`, etc.). |
| `frontend/src/components/common/` | Reusable UI components (Header, Sidebar, StatCard). |
| `frontend/src/pages/` | Routed pages for Dashboard, Madurai Overview, Ingestion, Analysis, and Reports. |
| `docs/ARCHITECTURE.md` | Complete architectural specification and system flow diagram. |
| `docs/SATELLITE_DATA_PLAN.md` | Authentic Copernicus Sentinel-2 and USGS Landsat acquisition guide for Madurai. |
| `docs/ROADMAP.md` | Execution stages from Phase 1 through Phase 7. |

---

## 6. Execution & Verification Instructions

### Backend Execution & Testing
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Run backend test suite (All 6 modules):
   ```bash
   python -m unittest discover -s tests
   ```
3. Run the FastAPI development server:
   ```bash
   python run.py
   ```
   The backend will start at `http://127.0.0.1:8000`:
   - Interactive Swagger API docs: `http://127.0.0.1:8000/docs`
   - Operational Health: `http://127.0.0.1:8000/api/health`
   - Madurai District Overview: `http://127.0.0.1:8000/api/madurai/overview`
   - Madurai Official Boundary: `http://127.0.0.1:8000/api/madurai/boundary`
   - Satellite Ingestion: `POST /api/satellite/upload`
   - Boundary Masking: `POST /api/preprocessing/process/{id}`
   - Authentic NDVI Calculation: `POST /api/ndvi/calculate/{id}`
   - Click-to-Probe NDVI Pixel: `GET /api/ndvi/probe/{id}?lat={lat}&lon={lon}`
   - Multi-Year Change Detection: `POST /api/comparison/compare`
   - Official PDF Report Generation: `POST /api/reports/generate/{id}`
   - PDF Download: `GET /api/reports/download/{filename}`

### Frontend Launch
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Launch the React development server:
   ```bash
   npm start
   ```
   The application dashboard will open at `http://localhost:3000`.

---

## 7. Development Roadmap & Completed Modules

All 7 core architectural modules have been designed, implemented, and verified:
- [x] **Phase 1: Architecture, Project Structure & Foundation**
- [x] **Phase 2: GIS Validation & Satellite Ingestion Module**
- [x] **Phase 3: Preprocessing & District Boundary Masking**
- [x] **Phase 4: Authentic NDVI Calculation & 5-Tier Classification**
- [x] **Phase 5: Interactive Web GIS Dashboard & Map Viewer**
- [x] **Phase 6: Multi-Year Temporal Change Analysis & Transition Matrix**
- [x] **Phase 7: Professional PDF Report Generation & Export**
