import React, { useEffect, useState } from 'react';
import { Sprout, Trees, Layers, AlertCircle, Compass } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { api } from '../services/api';

const DashboardPage = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSystemStatus()
      .then((res) => {
        setSystemStatus(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to connect to backend API:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* Page Title & Scope Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Urban Vegetation Intelligence Dashboard</h3>
          <p className="text-secondary mb-0">
            Geospatial green-cover monitoring restricted strictly to <strong>Madurai District, Tamil Nadu</strong>.
          </p>
        </div>
        <div className="text-end">
          <span className="badge bg-success-subtle text-success border border-success px-3 py-2">
            Sentinel-2 & Landsat-8/9 Ready
          </span>
        </div>
      </div>

      {/* Primary Indicator Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Total District Area"
            value="3,741"
            unit="sq km"
            icon={Compass}
            color="#1b5e20"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Spatial Target"
            value="Madurai"
            unit="District"
            icon={Layers}
            color="#0284c7"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Vegetation Engine"
            value="NDVI"
            unit="(NIR - Red)"
            icon={Sprout}
            color="#2e7d32"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard
            title="Sensor Standards"
            value="10m / 30m"
            unit="resolution"
            icon={Trees}
            color="#15803d"
          />
        </div>
      </div>

      {/* Backend Operational Status Card */}
      <div className="card-section">
        <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
          <Layers size={20} className="text-success" />
          System & GIS Processing Engine Status
        </h5>
        {loading ? (
          <div className="text-muted">Connecting to GreenVision backend server...</div>
        ) : systemStatus ? (
          <div>
            <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3">
              <strong>Status:</strong> {systemStatus.status.toUpperCase()} – {systemStatus.service} v{systemStatus.version}
            </div>
            <div className="row g-2 small">
              <div className="col-md-6">
                <strong>Geographical Scope:</strong> {systemStatus.target_scope}
              </div>
              <div className="col-md-6">
                <strong>Python Version:</strong> {systemStatus.python_version}
              </div>
              <div className="col-md-6">
                <strong>Server Timestamp:</strong> {systemStatus.backend_time}
              </div>
              <div className="col-md-6">
                <strong>Data Directories Initialized:</strong> {Object.keys(systemStatus.data_directories).length} modules ready
              </div>
            </div>
          </div>
        ) : (
          <div className="alert alert-warning d-flex align-items-center gap-2">
            <AlertCircle size={18} />
            <div>
              Could not reach backend at <code>http://127.0.0.1:8000/api</code>. Ensure FastAPI server is running via <code>python run.py</code>.
            </div>
          </div>
        )}
      </div>

      {/* Scientific Notice */}
      <div className="card-section" style={{ borderLeft: '4px solid var(--gv-primary)' }}>
        <h6 className="fw-bold mb-2">Scientific Integrity Policy</h6>
        <p className="text-secondary small mb-0">
          GreenVision computes NDVI exclusively from calibrated Level-2 surface reflectance products (Copernicus Sentinel-2 Band 8 &amp; Band 4, or USGS Landsat 8/9 Band 5 &amp; Band 4). Standard 3-channel RGB imagery is rejected by the processing validator. All measurements are clipped to official Madurai district administrative boundaries.
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
