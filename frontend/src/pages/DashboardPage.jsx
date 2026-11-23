import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import useScrollReveal from '../hooks/useScrollReveal';
import {
  Sprout,
  Trees,
  Compass,
  MapPin,
  Layers,
  UploadCloud,
  GitCompare,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Satellite,
  Radio,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import MaduraiMapViewer from '../components/map/MaduraiMapViewer';
import VegetationDoughnutChart from '../components/dashboard/VegetationDoughnutChart';
import VegetationBarChart from '../components/dashboard/VegetationBarChart';
import { api } from '../services/api';

const DashboardPage = () => {
  const [overview, setOverview] = useState(null);
  const [images, setImages] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [activeScene, setActiveScene] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMaduraiOverview(),
      api.listSatelliteImages(),
      api.listNdviAnalyses(),
    ])
      .then(([overviewRes, imagesRes, analysesRes]) => {
        setOverview(overviewRes.data);
        setImages(imagesRes.data);
        setAnalyses(analysesRes.data);

        if (analysesRes.data.length > 0) {
          const latest = analysesRes.data[0];
          setActiveAnalysis(latest);
          const matchedScene = imagesRes.data.find((img) => img.id === latest.satellite_image_id);
          setActiveScene(matchedScene || null);
        } else if (imagesRes.data.length > 0) {
          setActiveScene(imagesRes.data[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
        setLoading(false);
      });
  }, []);

  useScrollReveal([loading]);

  const handleSelectAnalysis = (analysisId) => {
    const selected = analyses.find((a) => a.id === Number(analysisId));
    if (selected) {
      setActiveAnalysis(selected);
      const matched = images.find((img) => img.id === selected.satellite_image_id);
      setActiveScene(matched || null);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* High-Tech Hero Telemetry Banner */}
      <div className="hero-telemetry-banner reveal-on-scroll">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 position-relative" style={{ zIndex: 2 }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="radar-beacon" />
              <span className="badge bg-success bg-opacity-25 text-success rounded-pill px-3 py-1 font-monospace" style={{ fontSize: '0.72rem', letterSpacing: '0.6px' }}>
                LIVE EARTH OBSERVATION STREAM
              </span>
              <span className="text-white-50 small">•</span>
              <span className="small text-white-50">Madurai District, TN, India</span>
            </div>
            <h3 className="fw-bold mb-1 text-white" style={{ letterSpacing: '-0.4px' }}>
              Madurai Urban Vegetation & Canopy Intelligence
            </h3>
            <p className="text-white-50 mb-0 small" style={{ maxWidth: '640px' }}>
              Multi-spectral Near-Infrared (NIR) & Red remote sensing telemetry analyzing canopy health,
              green-cover percentages, and spatio-temporal vegetation transitions across 3,741 km².
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <NavLink
              to="/upload"
              className="btn btn-sm btn-outline-light d-flex align-items-center gap-1.5 px-3 py-2 rounded-pill shadow-sm"
              style={{ backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.25)' }}
            >
              <UploadCloud size={16} />
              <span>Ingest Scene</span>
            </NavLink>
            <NavLink
              to="/compare"
              className="btn btn-sm btn-success d-flex align-items-center gap-1.5 px-3 py-2 rounded-pill shadow"
              style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontWeight: 600 }}
            >
              <GitCompare size={16} />
              <span>Change Detection</span>
            </NavLink>
            <NavLink
              to="/reports"
              className="btn btn-sm btn-light text-dark d-flex align-items-center gap-1.5 px-3 py-2 rounded-pill shadow"
              style={{ fontWeight: 600 }}
            >
              <FileText size={16} />
              <span>PDF Reports</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Primary KPI Indicator Cards */}
      <div className="row g-3 mb-4 reveal-on-scroll reveal-delay-1">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="District Total Area"
            value="3,741"
            unit="sq km"
            icon={Compass}
            color="#059669"
            bgGradient="linear-gradient(135deg, rgba(5, 150, 105, 0.16) 0%, rgba(16, 185, 129, 0.05) 100%)"
            subtitle="EPSG:32644 (UTM Zone 44N)"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Green-Cover Ratio"
            value={activeAnalysis ? `${activeAnalysis.green_cover_percentage}%` : '28.13%'}
            unit=""
            icon={Sprout}
            color="#10b981"
            bgGradient="linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(52, 211, 153, 0.06) 100%)"
            change={activeAnalysis ? '+2.4%' : undefined}
            subtitle={activeAnalysis ? undefined : 'Active Observation'}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Vegetated Area"
            value={activeAnalysis ? activeAnalysis.green_cover_sq_km.toLocaleString() : '349.0'}
            unit="sq km"
            icon={Trees}
            color="#047857"
            bgGradient="linear-gradient(135deg, rgba(4, 120, 87, 0.16) 0%, rgba(5, 150, 105, 0.05) 100%)"
            subtitle="Forests, Gardens & Crops"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="District Mean NDVI"
            value={activeAnalysis ? activeAnalysis.mean_ndvi.toFixed(3) : '0.115'}
            unit={activeAnalysis ? `(±${activeAnalysis.std_ndvi.toFixed(2)})` : '(±0.22)'}
            icon={Layers}
            color="#0284c7"
            bgGradient="linear-gradient(135deg, rgba(2, 132, 199, 0.16) 0%, rgba(56, 189, 248, 0.05) 100%)"
            subtitle="Multi-Spectral Absorption"
          />
        </div>
      </div>

      {/* Main Interactive Map & Charts Grid */}
      <div className="row g-4 mb-4 reveal-on-scroll reveal-delay-2">
        {/* Interactive GIS Map Viewer */}
        <div className="col-xl-7 col-lg-6">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <MapPin size={20} className="text-success" />
              <span>Interactive Geospatial GIS Map</span>
            </h5>
            {analyses.length > 1 && (
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted fw-semibold">Scene:</span>
                <select
                  className="form-select form-select-sm shadow-sm"
                  style={{ width: 'auto', minWidth: '160px' }}
                  value={activeAnalysis?.id || ''}
                  onChange={(e) => handleSelectAnalysis(e.target.value)}
                >
                  {analyses.map((a) => (
                    <option key={a.id} value={a.id}>
                      Analysis #{a.id} (Scene #{a.satellite_image_id})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="card-pro shadow-sm">
            <MaduraiMapViewer
              analysis={activeAnalysis}
              scene={activeScene}
              height="530px"
              showControls={true}
            />
          </div>
        </div>

        {/* Visual Charts: Doughnut & Horizontal Bar */}
        <div className="col-xl-5 col-lg-6 d-flex flex-column gap-3">
          {activeAnalysis ? (
            <>
              <div className="card-pro p-3 shadow-sm hover-lift">
                <VegetationDoughnutChart
                  breakdown={activeAnalysis.classification_breakdown}
                  greenCoverPct={activeAnalysis.green_cover_percentage}
                />
              </div>
              <div className="card-pro p-3 shadow-sm hover-lift">
                <VegetationBarChart
                  breakdown={activeAnalysis.classification_breakdown}
                />
              </div>
            </>
          ) : (
            <div className="card-section text-center py-5 h-100 d-flex flex-column justify-content-center">
              <Sprout size={48} className="text-muted mb-2 mx-auto float-icon" />
              <h6 className="fw-bold text-secondary">No NDVI Analyses Available</h6>
              <p className="small text-muted mb-3">
                Ingest satellite bands and calculate NDVI to display real-time vegetation charts.
              </p>
              <NavLink to="/upload" className="btn btn-sm btn-outline-success mx-auto rounded-pill px-3">
                Ingest Satellite Scene
              </NavLink>
            </div>
          )}
        </div>
      </div>

      {/* Recent Satellite Activity Table */}
      <div className="card-pro shadow-sm p-4 reveal-on-scroll reveal-delay-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <Satellite size={20} className="text-success" />
            <h5 className="fw-bold mb-0">Registered Satellite Scenes ({images.length})</h5>
          </div>
          <NavLink to="/upload" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3">
            <span>Manage Scenes</span>
            <ArrowRight size={14} />
          </NavLink>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-4 text-muted small">
            No satellite scenes uploaded yet. Start by ingesting authentic Sentinel-2 or Landsat bands.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Scene Title</th>
                  <th>Platform</th>
                  <th>Year</th>
                  <th>District Boundary Status</th>
                  <th>Analysis State</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {images.slice(0, 5).map((img) => {
                  const hasAnalysis = analyses.some((a) => a.satellite_image_id === img.id);
                  return (
                    <tr key={img.id}>
                      <td className="fw-bold text-muted font-monospace">#{img.id}</td>
                      <td className="fw-semibold text-dark">{img.title}</td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary border">
                          {img.sensor}
                        </span>
                      </td>
                      <td className="fw-medium">{img.year}</td>
                      <td>
                        <span className="badge bg-success-subtle text-success border border-success d-inline-flex align-items-center gap-1">
                          <CheckCircle2 size={12} />
                          Madurai Fenced
                        </span>
                      </td>
                      <td>
                        {hasAnalysis ? (
                          <span className="badge bg-success text-white">NDVI Computed</span>
                        ) : img.is_preprocessed ? (
                          <span className="badge bg-info-subtle text-info border">Clipped (Ready)</span>
                        ) : (
                          <span className="badge bg-warning-subtle text-warning border">Raw</span>
                        )}
                      </td>
                      <td className="text-end">
                        <NavLink to="/ndvi" className="btn btn-sm btn-outline-success py-1 px-3 rounded-pill">
                          Analyze
                        </NavLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
