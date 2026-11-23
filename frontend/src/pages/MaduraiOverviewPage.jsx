import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import {
  MapPin,
  Globe,
  Compass,
  CheckCircle,
  Satellite,
  ShieldCheck,
  RefreshCw,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';

const MaduraiOverviewPage = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useScrollReveal([loading]);

  const fetchOverview = () => {
    setLoading(true);
    setError(null);
    api.getMaduraiOverview()
      .then((res) => {
        setOverview(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load Madurai metadata:", err);
        setError("Failed to load Madurai District metadata. Check if backend is running.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Top Geospatial Header Banner */}
      <div className="hero-telemetry-banner mb-4 reveal-on-scroll">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 position-relative" style={{ zIndex: 2 }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="radar-beacon" />
              <span className="badge bg-success bg-opacity-25 text-success rounded-pill px-3 py-1 font-monospace" style={{ fontSize: '0.72rem', letterSpacing: '0.6px' }}>
                OFFICIAL GEOSPATIAL PARAMETERS
              </span>
              <span className="text-white-50 small">•</span>
              <span className="small text-white-50">EPSG:32644 (UTM Zone 44N)</span>
            </div>
            <h3 className="fw-bold mb-1 text-white" style={{ letterSpacing: '-0.3px' }}>
              Madurai District Geographical & Boundary Profile
            </h3>
            <p className="text-white-50 mb-0 small" style={{ maxWidth: '650px' }}>
              Official administrative boundary polygon and spatial coordinates governing all multi-spectral
              satellite image ingestion, boundary masking, and green-cover auditing.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <NavLink
              to="/"
              className="btn btn-sm btn-outline-light d-flex align-items-center gap-1.5 px-3 py-2 rounded-pill shadow-sm"
              style={{ backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.25)' }}
            >
              <Compass size={16} />
              <span>Dashboard Map</span>
            </NavLink>
            <NavLink
              to="/upload"
              className="btn btn-sm btn-success d-flex align-items-center gap-1.5 px-3 py-2 rounded-pill shadow"
              style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontWeight: 600 }}
            >
              <Satellite size={16} />
              <span>Ingest Scene</span>
            </NavLink>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading Madurai geospatial metadata...</span>
          </div>
          <p className="mt-3 text-muted small">Connecting to GreenVision GIS Engine...</p>
        </div>
      ) : overview ? (
        <div>
          {/* Top Quick Telemetry Cards */}
          <div className="row g-3 mb-4 reveal-on-scroll reveal-delay-1">
            <div className="col-sm-6 col-lg-3">
              <div className="stat-card-pro hover-lift">
                <div>
                  <div className="stat-label mb-1">Target District</div>
                  <div className="stat-value text-success">{overview.district}</div>
                  <div className="small text-muted mt-1">{overview.state}, {overview.country}</div>
                </div>
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)',
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MapPin size={24} />
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="stat-card-pro hover-lift">
                <div>
                  <div className="stat-label mb-1">Official Area</div>
                  <div className="stat-value">~{overview.area_sq_km.toLocaleString()}</div>
                  <div className="small text-muted mt-1">Square Kilometers</div>
                </div>
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(56, 189, 248, 0.05) 100%)',
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Globe size={24} />
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="stat-card-pro hover-lift">
                <div>
                  <div className="stat-label mb-1">Projected CRS</div>
                  <div className="stat-value" style={{ fontSize: '1.4rem' }}>UTM 44N</div>
                  <div className="small text-muted mt-1"><code>{overview.utm_crs}</code></div>
                </div>
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(251, 191, 36, 0.05) 100%)',
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Compass size={24} />
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="stat-card-pro hover-lift">
                <div>
                  <div className="stat-label mb-1">Administrative Taluks</div>
                  <div className="stat-value">{overview.taluks.length}</div>
                  <div className="small text-muted mt-1">Monitored Jurisdictions</div>
                </div>
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(192, 132, 252, 0.05) 100%)',
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    color: '#9333ea',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Layers size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Profile & Bounding Box Cards */}
          <div className="row g-4 mb-4 reveal-on-scroll reveal-delay-2">
            <div className="col-md-6">
              <div className="card-pro h-100 p-4 shadow-sm hover-lift">
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <MapPin size={20} className="text-success" />
                  <span>Administrative Regional Profile</span>
                </h5>
                <ul className="list-unstyled mb-0 d-flex flex-column gap-3 small">
                  <li className="d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted fw-semibold">Administrative Division:</span>
                    <span className="fw-bold text-dark">{overview.district} District</span>
                  </li>
                  <li className="d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted fw-semibold">State / Region:</span>
                    <span className="fw-semibold text-dark">{overview.state}</span>
                  </li>
                  <li className="d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted fw-semibold">Country:</span>
                    <span className="fw-semibold text-dark">{overview.country}</span>
                  </li>
                  <li className="d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted fw-semibold">Geographic Center:</span>
                    <span className="fw-semibold text-success font-monospace">
                      {overview.center.latitude}° N, {overview.center.longitude}° E
                    </span>
                  </li>
                  <li className="d-flex justify-content-between border-bottom pb-2">
                    <span className="text-muted fw-semibold">Official Total Area:</span>
                    <span className="fw-semibold text-dark">~{overview.area_sq_km.toLocaleString()} km²</span>
                  </li>
                  <li className="d-flex justify-content-between">
                    <span className="text-muted fw-semibold">Target Grid Resolution:</span>
                    <span className="badge bg-success-subtle text-success border border-success">
                      10m (Sentinel-2) / 30m (Landsat)
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card-pro h-100 p-4 shadow-sm hover-lift">
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <Globe size={20} className="text-success" />
                  <span>Geographical Bounding Box (WGS84 EPSG:4326)</span>
                </h5>
                <div className="p-3 bg-light rounded-3 small font-monospace mb-3 border">
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">West Longitude (Min):</span>
                    <span className="fw-bold text-dark">{overview.bbox_wgs84.min_longitude}° E</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">South Latitude (Min):</span>
                    <span className="fw-bold text-dark">{overview.bbox_wgs84.min_latitude}° N</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">East Longitude (Max):</span>
                    <span className="fw-bold text-dark">{overview.bbox_wgs84.max_longitude}° E</span>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted">North Latitude (Max):</span>
                    <span className="fw-bold text-dark">{overview.bbox_wgs84.max_latitude}° N</span>
                  </div>
                </div>
                <div className="text-secondary small leading-relaxed">
                  {overview.description}
                </div>
              </div>
            </div>
          </div>

          {/* Covered Administrative Taluks */}
          <div className="card-pro p-4 shadow-sm mb-4 reveal-on-scroll reveal-delay-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <Compass size={20} className="text-success" />
                <span>Monitored Administrative Taluks ({overview.taluks.length})</span>
              </h5>
              <span className="badge bg-light text-muted border">
                Official Revenue Divisions
              </span>
            </div>

            <div className="row g-3">
              {overview.taluks.map((taluk) => (
                <div key={taluk} className="col-md-4 col-sm-6">
                  <div className="p-3 border rounded-3 d-flex align-items-center gap-2.5 bg-light hover-lift" style={{ transition: 'all 0.2s ease' }}>
                    <div className="rounded-circle bg-success bg-opacity-10 p-1.5 text-success">
                      <CheckCircle size={16} />
                    </div>
                    <div>
                      <div className="fw-bold text-dark small">{taluk} Taluk</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>Madurai District Jurisdiction</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card shadow-sm border-0 p-4 text-center my-4">
          <div className="text-danger mb-3">
            <MapPin size={48} className="mx-auto opacity-75" />
          </div>
          <h5 className="fw-bold text-dark">Backend Connection Offline</h5>
          <p className="text-muted small mx-auto" style={{ maxWidth: '480px' }}>
            {error || 'Could not connect to the GreenVision backend service at http://127.0.0.1:8000.'}
          </p>
          <div className="d-flex justify-content-center gap-2 mt-2">
            <button className="btn btn-sm btn-success d-flex align-items-center gap-1 rounded-pill px-3" onClick={fetchOverview}>
              <RefreshCw size={14} />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaduraiOverviewPage;
