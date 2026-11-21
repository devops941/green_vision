import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
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

  const handleSelectAnalysis = (analysisId) => {
    const selected = analyses.find((a) => a.id === Number(analysisId));
    if (selected) {
      setActiveAnalysis(selected);
      const matched = images.find((img) => img.id === selected.satellite_image_id);
      setActiveScene(matched || null);
    }
  };

  return (
    <div>
      {/* Top Welcome & District Scope Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold mb-1">Madurai Urban Green-Cover Intelligence</h3>
          <p className="text-secondary mb-0">
            Real-time satellite vegetation analytics for <strong>Madurai District, Tamil Nadu, India</strong>.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <NavLink to="/upload" className="btn btn-sm btn-outline-success d-flex align-items-center gap-1">
            <UploadCloud size={15} />
            <span>Ingest Scene</span>
          </NavLink>
          <NavLink to="/ndvi" className="btn btn-sm btn-success d-flex align-items-center gap-1" style={{ backgroundColor: 'var(--gv-primary)', borderColor: 'var(--gv-primary)' }}>
            <Sprout size={15} />
            <span>NDVI Engine</span>
          </NavLink>
        </div>
      </div>

      {/* Primary KPI Indicator Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="District Total Area"
            value="3,741"
            unit="sq km"
            icon={Compass}
            color="#1b5e20"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Green-Cover Percentage"
            value={activeAnalysis ? `${activeAnalysis.green_cover_percentage}%` : 'N/A'}
            unit=""
            icon={Sprout}
            color="#2e7d32"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total Vegetated Area"
            value={activeAnalysis ? activeAnalysis.green_cover_sq_km.toLocaleString() : 'N/A'}
            unit="sq km"
            icon={Trees}
            color="#15803d"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Mean District NDVI"
            value={activeAnalysis ? activeAnalysis.mean_ndvi.toFixed(3) : 'N/A'}
            unit={activeAnalysis ? `(±${activeAnalysis.std_ndvi.toFixed(2)})` : ''}
            icon={Layers}
            color="#0284c7"
          />
        </div>
      </div>

      {/* Main Interactive Map & Charts Grid */}
      <div className="row g-4 mb-4">
        {/* Interactive GIS Map Viewer */}
        <div className="col-xl-7 col-lg-6">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <MapPin size={20} className="text-success" />
              Interactive Geospatial Map
            </h5>
            {analyses.length > 1 && (
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto' }}
                value={activeAnalysis?.id || ''}
                onChange={(e) => handleSelectAnalysis(e.target.value)}
              >
                {analyses.map((a) => (
                  <option key={a.id} value={a.id}>
                    Analysis #{a.id} (Scene #{a.satellite_image_id})
                  </option>
                ))}
              </select>
            )}
          </div>

          <MaduraiMapViewer
            analysis={activeAnalysis}
            scene={activeScene}
            height="520px"
            showControls={true}
          />
        </div>

        {/* Visual Charts: Doughnut & Horizontal Bar */}
        <div className="col-xl-5 col-lg-6 d-flex flex-column gap-3">
          {activeAnalysis ? (
            <>
              <VegetationDoughnutChart
                breakdown={activeAnalysis.classification_breakdown}
                greenCoverPct={activeAnalysis.green_cover_percentage}
              />
              <VegetationBarChart
                breakdown={activeAnalysis.classification_breakdown}
              />
            </>
          ) : (
            <div className="card-section text-center py-5 h-100 d-flex flex-column justify-content-center">
              <Sprout size={48} className="text-muted mb-2 mx-auto" />
              <h6 className="fw-bold text-secondary">No NDVI Analyses Available</h6>
              <p className="small text-muted mb-3">
                Ingest satellite bands and calculate NDVI to display real-time vegetation charts.
              </p>
              <NavLink to="/upload" className="btn btn-sm btn-outline-success mx-auto">
                Ingest Satellite Scene
              </NavLink>
            </div>
          )}
        </div>
      </div>

      {/* Recent Satellite Activity Table */}
      <div className="card-section">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
            <Layers size={20} className="text-success" />
            Registered Satellite Scenes ({images.length})
          </h5>
          <NavLink to="/upload" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
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
            <table className="table table-sm table-hover align-middle mb-0 small">
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
                      <td className="fw-bold text-muted">#{img.id}</td>
                      <td className="fw-semibold text-dark">{img.title}</td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary border">
                          {img.sensor}
                        </span>
                      </td>
                      <td>{img.year}</td>
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
                        <NavLink to="/ndvi" className="btn btn-sm btn-outline-success py-0 px-2">
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
