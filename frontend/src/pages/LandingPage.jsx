import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Satellite,
  Compass,
  Sprout,
  GitCompare,
  FileText,
  ShieldCheck,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Layers,
  Activity,
  Globe,
  Sliders,
  Sparkles,
  BarChart3,
  Trees,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState('ingestion');

  return (
    <div className="animate-fade-in pb-5">
      {/* ============================================================== */}
      {/* 1. HERO SECTION                                                */}
      {/* ============================================================== */}
      <section
        className="hero-telemetry-banner text-white p-4 p-md-5 mb-5 position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #061c12 0%, #0c3321 40%, #064e3b 100%)',
          borderRadius: '20px',
          boxShadow: '0 20px 40px -15px rgba(6, 78, 59, 0.5)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
        }}
      >
        <div className="position-relative" style={{ zIndex: 2 }}>
          {/* Top Status Capsule */}
          <div className="d-inline-flex align-items-center gap-2 mb-3 px-3 py-1.5 rounded-pill bg-black bg-opacity-30 border border-success border-opacity-40 shadow-sm">
            <span className="radar-beacon" />
            <span className="badge bg-success bg-opacity-25 text-success rounded-pill px-2 py-0.5 font-monospace" style={{ fontSize: '0.72rem', letterSpacing: '0.8px' }}>
              LEVEL-2A SATELLITE ENGINE
            </span>
            <span className="text-white-50 small">•</span>
            <span className="text-white small fw-semibold">Madurai District, Tamil Nadu, India</span>
          </div>

          {/* Main Headline */}
          <h1 className="display-5 fw-extrabold text-white mb-3" style={{ letterSpacing: '-0.8px', lineHeight: 1.15 }}>
            Precision Satellite Intelligence for <br />
            <span style={{ color: '#34d399', textShadow: '0 0 24px rgba(52, 211, 153, 0.4)' }}>
              Madurai Urban Canopy & Green-Cover
            </span>
          </h1>

          {/* Subtitle */}
          <p className="lead text-white-50 mb-4" style={{ maxWidth: '780px', fontSize: '1.05rem', lineHeight: 1.6 }}>
            GreenVision™ is an authentic Earth observation GIS platform built to monitor, quantify, and analyze
            vegetative health and urban green-cover across <strong>Madurai District (3,741 km²)</strong> using
            Copernicus Sentinel-2 & USGS Landsat multi-spectral Near-Infrared (NIR) and Red surface reflectance.
          </p>

          {/* Action CTAs */}
          <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
            <NavLink
              to="/dashboard"
              className="btn btn-success d-flex align-items-center gap-2 px-4 py-2.5 rounded-pill shadow-lg hover-lift"
              style={{
                backgroundColor: '#10b981',
                borderColor: '#10b981',
                fontWeight: 700,
                fontSize: '0.95rem',
              }}
            >
              <span>Launch Live GIS Dashboard</span>
              <ArrowRight size={18} />
            </NavLink>

            <NavLink
              to="/compare"
              className="btn btn-outline-light d-flex align-items-center gap-2 px-4 py-2.5 rounded-pill shadow-sm hover-lift"
              style={{
                backdropFilter: 'blur(8px)',
                borderColor: 'rgba(255,255,255,0.3)',
                fontWeight: 600,
                fontSize: '0.95rem',
              }}
            >
              <GitCompare size={18} className="text-success" />
              <span>Multi-Year Change (2020 vs 2024)</span>
            </NavLink>

            <NavLink
              to="/reports"
              className="btn btn-light text-dark d-flex align-items-center gap-2 px-4 py-2.5 rounded-pill shadow hover-lift"
              style={{ fontWeight: 600, fontSize: '0.95rem' }}
            >
              <FileText size={18} className="text-success" />
              <span>Executive PDF Reports</span>
            </NavLink>
          </div>

          {/* Key Assurance Badges */}
          <div className="pt-3 border-top border-white border-opacity-10 d-flex flex-wrap align-items-center gap-3 gap-md-4 text-white-50 small">
            <div className="d-flex align-items-center gap-1.5">
              <CheckCircle2 size={16} className="text-success" />
              <span>Strict Madurai Boundary Fence</span>
            </div>
            <div className="d-flex align-items-center gap-1.5">
              <CheckCircle2 size={16} className="text-success" />
              <span>Authentic Multi-Spectral Bands (B04 & B08)</span>
            </div>
            <div className="d-flex align-items-center gap-1.5">
              <CheckCircle2 size={16} className="text-success" />
              <span>Zero RGB Approximations</span>
            </div>
            <div className="d-flex align-items-center gap-1.5">
              <CheckCircle2 size={16} className="text-success" />
              <span>EPSG:32644 (UTM Zone 44N)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. LIVE TELEMETRY SNAPSHOT CARDS                               */}
      {/* ============================================================== */}
      <section className="mb-5">
        <div className="row g-3">
          <div className="col-6 col-lg-3">
            <div className="stat-card-pro p-3 p-md-4 hover-lift">
              <div>
                <div className="stat-label">Geospatial Scope</div>
                <div className="stat-value text-success mt-1">3,741</div>
                <div className="small text-muted mt-1">km² District Area</div>
              </div>
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(5, 150, 105, 0.05) 100%)',
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Compass size={24} />
              </div>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="stat-card-pro p-3 p-md-4 hover-lift">
              <div>
                <div className="stat-label">Grid Resolution</div>
                <div className="stat-value text-primary mt-1">10m</div>
                <div className="small text-muted mt-1">Ground Sampling Distance</div>
              </div>
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.16) 0%, rgba(56, 189, 248, 0.05) 100%)',
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Layers size={24} />
              </div>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="stat-card-pro p-3 p-md-4 hover-lift">
              <div>
                <div className="stat-label">Vegetation Classes</div>
                <div className="stat-value mt-1" style={{ color: '#047857' }}>5-Tier</div>
                <div className="small text-muted mt-1">Ecological Density Tiers</div>
              </div>
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(4, 120, 87, 0.16) 0%, rgba(5, 150, 105, 0.05) 100%)',
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  color: '#047857',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sprout size={24} />
              </div>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="stat-card-pro p-3 p-md-4 hover-lift">
              <div>
                <div className="stat-label">Temporal Audits</div>
                <div className="stat-value text-warning mt-1">2020–24</div>
                <div className="small text-muted mt-1">Decadal Change Horizon</div>
              </div>
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(251, 191, 36, 0.05) 100%)',
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GitCompare size={24} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. CORE SCIENTIFIC CAPABILITIES                                */}
      {/* ============================================================== */}
      <section className="mb-5">
        <div className="text-center mb-4">
          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 font-monospace small mb-2">
            SCIENTIFIC GIS CAPABILITIES
          </span>
          <h2 className="fw-bold text-dark" style={{ letterSpacing: '-0.5px' }}>
            Engineered for Authentic Earth Observation
          </h2>
          <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
            Built in strict compliance with remote sensing physics, utilizing authentic multi-spectral
            reflectance to measure actual photosynthetic activity.
          </p>
        </div>

        <div className="row g-4">
          {/* Card 1 */}
          <div className="col-md-6 col-lg-4">
            <div className="card-pro h-100 p-4 hover-lift">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="rounded-3 p-2.5 bg-success bg-opacity-10 text-success">
                  <Satellite size={22} />
                </div>
                <h5 className="fw-bold mb-0">Multi-Spectral Ingestion</h5>
              </div>
              <p className="text-muted small leading-relaxed mb-3">
                Ingests authentic Level-2A surface reflectance GeoTIFFs. Detects Near-Infrared (Sentinel-2 B08,
                Landsat B5) and Red (Sentinel-2 B04, Landsat B4) with strict rejection of uncalibrated RGB photos.
              </p>
              <div className="d-flex align-items-center gap-2 text-success small fw-semibold">
                <span>Dual-Engine Ingestion</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="col-md-6 col-lg-4">
            <div className="card-pro h-100 p-4 hover-lift">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="rounded-3 p-2.5 bg-primary bg-opacity-10 text-primary">
                  <MapPin size={22} />
                </div>
                <h5 className="fw-bold mb-0">District Polygon Masking</h5>
              </div>
              <p className="text-muted small leading-relaxed mb-3">
                Reprojects grids to Madurai UTM Zone 44N (<code>EPSG:32644</code>) and applies precise vector
                polygon masking via official GeoJSON boundaries, eliminating boundary errors and nodata pixels.
              </p>
              <div className="d-flex align-items-center gap-2 text-primary small fw-semibold">
                <span>Automated Preprocessing</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="col-md-6 col-lg-4">
            <div className="card-pro h-100 p-4 hover-lift">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="rounded-3 p-2.5 bg-success bg-opacity-10 text-success">
                  <Sprout size={22} />
                </div>
                <h5 className="fw-bold mb-0">Vectorized NDVI Math</h5>
              </div>
              <p className="text-muted small leading-relaxed mb-3">
                Calculates $(NIR - RED)/(NIR + RED)$ in high-precision Float32 NumPy arrays. Produces authentic
                Float32 GeoTIFFs, standard deviations, and Matplotlib frequency distribution histogram curves.
              </p>
              <div className="d-flex align-items-center gap-2 text-success small fw-semibold">
                <span>Zero Data Loss</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="col-md-6 col-lg-4">
            <div className="card-pro h-100 p-4 hover-lift">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="rounded-3 p-2.5 bg-warning bg-opacity-10 text-warning">
                  <Layers size={22} />
                </div>
                <h5 className="fw-bold mb-0">5-Tier Classification</h5>
              </div>
              <p className="text-muted small leading-relaxed mb-3">
                Classifies terrain into 5 scientific intervals: Water (&lt;0.0), Built-up/Bare (0.0-0.2), Sparse (0.2-0.4),
                Moderate (0.4-0.6), and Dense Canopy (0.6-1.0), with metric square kilometer and hectare quantifications.
              </p>
              <div className="d-flex align-items-center gap-2 text-warning small fw-semibold">
                <span>Urban Hectare Metrics</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Card 5 */}
          <div className="col-md-6 col-lg-4">
            <div className="card-pro h-100 p-4 hover-lift">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="rounded-3 p-2.5 bg-info bg-opacity-10 text-info">
                  <GitCompare size={22} />
                </div>
                <h5 className="fw-bold mb-0">Temporal Change Detection</h5>
              </div>
              <p className="text-muted small leading-relaxed mb-3">
                Executes bi-temporal pixel diffing ($\Delta\text{NDVI} = T_2 - T_1$) between observation dates. Quantifies
                net green-cover shift %, vegetation gain $\text{km}^2$, vegetation loss $\text{km}^2$, and generates spatial difference maps.
              </p>
              <div className="d-flex align-items-center gap-2 text-info small fw-semibold">
                <span>Multi-Year Audits</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>

          {/* Card 6 */}
          <div className="col-md-6 col-lg-4">
            <div className="card-pro h-100 p-4 hover-lift">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="rounded-3 p-2.5 bg-danger bg-opacity-10 text-danger">
                  <FileText size={22} />
                </div>
                <h5 className="fw-bold mb-0">Publication-Grade PDF Reports</h5>
              </div>
              <p className="text-muted small leading-relaxed mb-3">
                Generates multi-page executive assessment PDFs via ReportLab with dynamic "Page X of Y", embedded high-res
                colorized maps, transition tables, and environmental governance recommendations for Madurai Corporation.
              </p>
              <div className="d-flex align-items-center gap-2 text-danger small fw-semibold">
                <span>One-Click Export</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. INTERACTIVE CAPABILITY WORKSPACE SHOWCASE                   */}
      {/* ============================================================== */}
      <section className="card-pro p-4 p-md-5 mb-5 shadow-sm">
        <div className="row align-items-center g-4">
          <div className="col-lg-5">
            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 font-monospace small mb-2">
              INTERACTIVE PIPELINE
            </span>
            <h3 className="fw-bold text-dark mb-3">
              Explore the 4-Stage Remote Sensing Architecture
            </h3>
            <p className="text-muted small mb-4">
              Select a pipeline stage to inspect the processing methodology and scientific outputs:
            </p>

            <div className="d-flex flex-column gap-2">
              <button
                className={`btn text-start p-3 rounded-3 d-flex align-items-center justify-content-between transition-all ${
                  activeTab === 'ingestion' ? 'btn-success text-white' : 'btn-light'
                }`}
                onClick={() => setActiveTab('ingestion')}
              >
                <div className="d-flex align-items-center gap-2.5">
                  <Satellite size={18} />
                  <span className="fw-bold small">1. Satellite Ingestion & Validation</span>
                </div>
                <ChevronRight size={16} />
              </button>

              <button
                className={`btn text-start p-3 rounded-3 d-flex align-items-center justify-content-between transition-all ${
                  activeTab === 'masking' ? 'btn-success text-white' : 'btn-light'
                }`}
                onClick={() => setActiveTab('masking')}
              >
                <div className="d-flex align-items-center gap-2.5">
                  <MapPin size={18} />
                  <span className="fw-bold small">2. Madurai Boundary Masking</span>
                </div>
                <ChevronRight size={16} />
              </button>

              <button
                className={`btn text-start p-3 rounded-3 d-flex align-items-center justify-content-between transition-all ${
                  activeTab === 'ndvi' ? 'btn-success text-white' : 'btn-light'
                }`}
                onClick={() => setActiveTab('ndvi')}
              >
                <div className="d-flex align-items-center gap-2.5">
                  <Sprout size={18} />
                  <span className="fw-bold small">3. NDVI Calculation & 5-Tier Classes</span>
                </div>
                <ChevronRight size={16} />
              </button>

              <button
                className={`btn text-start p-3 rounded-3 d-flex align-items-center justify-content-between transition-all ${
                  activeTab === 'change' ? 'btn-success text-white' : 'btn-light'
                }`}
                onClick={() => setActiveTab('change')}
              >
                <div className="d-flex align-items-center gap-2.5">
                  <GitCompare size={18} />
                  <span className="fw-bold small">4. Multi-Year Change & PDF Reports</span>
                </div>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Right Preview Card */}
          <div className="col-lg-7">
            <div className="p-4 rounded-3 border bg-light h-100 shadow-inner">
              {activeTab === 'ingestion' && (
                <div className="animate-fade-in">
                  <div className="d-flex align-items-center gap-2 text-success fw-bold mb-2">
                    <Satellite size={20} />
                    <span>Stage 1: Multi-Spectral Ingestion & GIS Validation</span>
                  </div>
                  <h5 className="fw-bold text-dark">Pre-Flight GeoTIFF Metadata Inspection</h5>
                  <p className="text-muted small leading-relaxed">
                    Uploads authentic Red (B04) and Near-Infrared (B08) rasters. GreenVision inspects
                    coordinate reference tags, spatial bounds, and sensor metadata. Ordinary RGB camera
                    photos are strictly rejected by the GIS validator before rasterization begins.
                  </p>
                  <div className="p-3 bg-white rounded border small font-monospace mb-3">
                    <div className="text-success fw-bold">✓ Sensor: Sentinel-2 MSI (Level-2A BOA)</div>
                    <div className="text-success fw-bold">✓ Projected CRS: EPSG:32644 (UTM Zone 44N)</div>
                    <div className="text-success fw-bold">✓ Spatial Intersect: Madurai District Bounds Verified</div>
                  </div>
                  <NavLink to="/upload" className="btn btn-sm btn-success rounded-pill px-3">
                    Open Ingestion Hub →
                  </NavLink>
                </div>
              )}

              {activeTab === 'masking' && (
                <div className="animate-fade-in">
                  <div className="d-flex align-items-center gap-2 text-primary fw-bold mb-2">
                    <MapPin size={20} />
                    <span>Stage 2: Official District Boundary Masking</span>
                  </div>
                  <h5 className="fw-bold text-dark">Exact Polygon Rasterization via OpenCV</h5>
                  <p className="text-muted small leading-relaxed">
                    Applies the official <code>madurai_boundary.geojson</code> administrative boundary to clip
                    both spectral bands. Outside district pixels are converted to nodata (0), ensuring zero
                    metric contamination from neighboring districts (Dindigul, Theni, Sivaganga, Virudhunagar).
                  </p>
                  <div className="p-3 bg-white rounded border small font-monospace mb-3">
                    <div>• District Area: ~3,741 sq km</div>
                    <div>• Bounding Box: Lon [77.68°E, 78.52°E], Lat [9.53°N, 10.35°N]</div>
                    <div>• Output: Bilinear Aligned Clipped GeoTIFFs</div>
                  </div>
                  <NavLink to="/madurai" className="btn btn-sm btn-primary rounded-pill px-3">
                    View District Boundary →
                  </NavLink>
                </div>
              )}

              {activeTab === 'ndvi' && (
                <div className="animate-fade-in">
                  <div className="d-flex align-items-center gap-2 text-success fw-bold mb-2">
                    <Sprout size={20} />
                    <span>Stage 3: Authentic NDVI & 5-Tier Classification</span>
                  </div>
                  <h5 className="fw-bold text-dark">Vectorized Float32 Surface Reflectance Math</h5>
                  <p className="text-muted small leading-relaxed">
                    Computes $(NIR - RED)/(NIR + RED)$ pixel-by-pixel. Categorizes the district into 5 ecological tiers:
                    Water Bodies, Built-up/Bare Soil, Sparse Vegetation, Moderate Canopy, and Dense Forest.
                    Generates colorized PNG maps and Matplotlib frequency curves.
                  </p>
                  <div className="p-3 bg-white rounded border small mb-3">
                    <div className="d-flex justify-content-between py-1 border-bottom">
                      <span className="small fw-semibold">Class 4: Dense Forest / Vigorous Crops</span>
                      <span className="badge bg-success">NDVI 0.60 – 1.00</span>
                    </div>
                    <div className="d-flex justify-content-between py-1 border-bottom">
                      <span className="small fw-semibold">Class 3: Moderate Vegetation Canopy</span>
                      <span className="badge bg-success-subtle text-success border">NDVI 0.40 – 0.60</span>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span className="small fw-semibold">Class 1: Built-up Urban Fabric</span>
                      <span className="badge bg-secondary-subtle text-secondary border">NDVI 0.00 – 0.20</span>
                    </div>
                  </div>
                  <NavLink to="/ndvi" className="btn btn-sm btn-success rounded-pill px-3">
                    Inspect NDVI Analytics →
                  </NavLink>
                </div>
              )}

              {activeTab === 'change' && (
                <div className="animate-fade-in">
                  <div className="d-flex align-items-center gap-2 text-warning fw-bold mb-2">
                    <GitCompare size={20} />
                    <span>Stage 4: Multi-Year Temporal Change & PDF Reports</span>
                  </div>
                  <h5 className="fw-bold text-dark">Bi-Temporal Transition Matrix & Export</h5>
                  <p className="text-muted small leading-relaxed">
                    Evaluates multi-year shifts ($\Delta\text{NDVI} = T_2 - T_1$) between dry season (2020) and post-monsoon (2024).
                    Maps canopy degradation, afforestation gains, and compiles official publication-quality assessment PDFs via ReportLab.
                  </p>
                  <div className="p-3 bg-white rounded border small mb-3">
                    <div className="text-danger fw-bold">Severe/Moderate Loss: Canopy thinning & urban clearing</div>
                    <div className="text-secondary fw-bold">Stable Zone: Persistent urban fabric & rock terrain</div>
                    <div className="text-success fw-bold">Vegetation Gain: Reforestation & seasonal greening</div>
                  </div>
                  <div className="d-flex gap-2">
                    <NavLink to="/compare" className="btn btn-sm btn-warning text-dark rounded-pill px-3 fw-semibold">
                      Run Change Detection →
                    </NavLink>
                    <NavLink to="/reports" className="btn btn-sm btn-outline-secondary rounded-pill px-3">
                      View PDF Reports →
                    </NavLink>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. MADURAI DISTRICT TALUKS SHOWCASE                            */}
      {/* ============================================================== */}
      <section className="card-pro p-4 p-md-5 mb-5 shadow-sm">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
          <div>
            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 font-monospace small mb-2">
              ADMINISTRATIVE DIVISIONS
            </span>
            <h3 className="fw-bold text-dark mb-0">Covered Madurai District Taluks</h3>
          </div>
          <NavLink to="/madurai" className="btn btn-sm btn-outline-success rounded-pill px-3 d-flex align-items-center gap-1">
            <span>Explore Full Geo Profile</span>
            <ArrowRight size={14} />
          </NavLink>
        </div>

        <div className="row g-3">
          {[
            { name: 'Madurai North', role: 'Vaigai River Basin & Urban Core', type: 'Urban Core' },
            { name: 'Madurai South', role: 'Historic Center & Heritage Zone', type: 'Urban Core' },
            { name: 'Melur', role: 'Agricultural Tracts & Granite Formations', type: 'Peri-Urban' },
            { name: 'Thirumangalam', role: 'Commercial & Agro Corridor', type: 'Agricultural' },
            { name: 'Usilampatti', role: 'Western Semi-Arid Foothills', type: 'Foothills' },
            { name: 'Vadipatti', role: 'Sirumalai Foothill Orchards', type: 'Horticulture' },
            { name: 'Peraiyur', role: 'Southern Rainfed Agricultural Plains', type: 'Agricultural' },
          ].map((t) => (
            <div key={t.name} className="col-md-4 col-sm-6">
              <div className="p-3 border rounded-3 bg-light hover-lift h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold text-dark">{t.name} Taluk</span>
                    <span className="badge bg-success-subtle text-success border" style={{ fontSize: '0.68rem' }}>
                      {t.type}
                    </span>
                  </div>
                  <p className="text-muted small mb-0">{t.role}</p>
                </div>
                <div className="mt-2 pt-2 border-top border-secondary border-opacity-10 d-flex align-items-center gap-1 text-success small font-monospace" style={{ fontSize: '0.72rem' }}>
                  <CheckCircle2 size={12} />
                  <span>Boundary Monitored</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. READY TO LAUNCH CALL TO ACTION BANNER                       */}
      {/* ============================================================== */}
      <section
        className="p-4 p-md-5 text-center text-white rounded-4 shadow-lg position-relative overflow-hidden mb-4"
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
          border: '1px solid rgba(52, 211, 153, 0.4)',
        }}
      >
        <div className="position-relative" style={{ zIndex: 2 }}>
          <Sparkles size={36} className="text-warning mb-3 mx-auto float-icon" />
          <h2 className="display-6 fw-bold mb-2">Ready to Explore Madurai's Urban Green Cover?</h2>
          <p className="text-white-50 mx-auto mb-4" style={{ maxWidth: '600px' }}>
            Access the live interactive GIS map, probe pixel-level NDVI values, inspect decadal vegetation
            shifts, and download official environmental assessment reports.
          </p>
          <div className="d-flex justify-content-center flex-wrap gap-3">
            <NavLink
              to="/dashboard"
              className="btn btn-light text-success fw-bold px-4 py-2.5 rounded-pill shadow-lg hover-lift"
              style={{ fontSize: '1rem' }}
            >
              Launch Live Dashboard Now
            </NavLink>
            <NavLink
              to="/reports"
              className="btn btn-outline-light px-4 py-2.5 rounded-pill hover-lift"
              style={{ fontSize: '1rem' }}
            >
              Download Official PDFs
            </NavLink>
          </div>
        </div>
      </section>

      {/* Footer Meta */}
      <div className="text-center text-muted small pt-3">
        GreenVision™ Satellite Earth Observation Engine • Copernicus Sentinel-2 & USGS Landsat • Madurai District, Tamil Nadu, India
      </div>
    </div>
  );
};

export default LandingPage;
