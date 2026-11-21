import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Compass,
  Layers,
  BarChart2,
  Download,
  AlertCircle,
  CheckCircle2,
  Trees,
  Droplets,
  Building2,
  FileCheck2,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import NdviControls from '../components/ndvi/NdviControls';
import NdviHistogram from '../components/ndvi/NdviHistogram';
import { api } from '../services/api';

const NdviAnalysisPage = () => {
  const [images, setImages] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Load available satellite scenes
  useEffect(() => {
    api.listSatelliteImages()
      .then((res) => {
        setImages(res.data);
        if (res.data.length > 0) {
          setSelectedImageId(res.data[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load images:', err);
        setLoading(false);
      });
  }, []);

  // Fetch analysis whenever selected image changes
  useEffect(() => {
    if (!selectedImageId) {
      setAnalysis(null);
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);

    api.getNdviAnalysisByImage(selectedImageId)
      .then((res) => {
        setAnalysis(res.data);
      })
      .catch(() => {
        // Analysis not yet computed for this scene
        setAnalysis(null);
      });
  }, [selectedImageId]);

  const handleCalculate = async () => {
    if (!selectedImageId) return;
    setCalculating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.calculateNdvi(selectedImageId);
      setAnalysis(res.data);
      setSuccessMsg(
        `Authentic NDVI calculation and vegetation classification completed for scene #${selectedImageId}!`
      );
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'NDVI calculation failed.';
      setErrorMsg(detail);
    } finally {
      setCalculating(false);
    }
  };

  const selectedScene = images.find((img) => img.id === selectedImageId);

  return (
    <div>
      {/* Title & Scope Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">NDVI Analytics &amp; Vegetation Intelligence</h3>
          <p className="text-secondary mb-0">
            Vectorized Normalized Difference Vegetation Index (NDVI) and 5-class density analysis for <strong>Madurai District</strong>.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success-subtle text-success border border-success px-3 py-2">
            NDVI = (NIR - RED) / (NIR + RED)
          </span>
        </div>
      </div>

      {/* Global Notifications */}
      {errorMsg && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <AlertCircle size={18} className="flex-shrink-0" />
          <div>{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-4">
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Scene Selector & Controls */}
      <NdviControls
        images={images}
        selectedImageId={selectedImageId}
        onSelectImage={(id) => setSelectedImageId(id)}
        onCalculate={handleCalculate}
        calculating={calculating}
      />

      {loading ? (
        <div className="text-muted py-5 text-center">Loading scene records...</div>
      ) : images.length === 0 ? (
        <div className="card-section text-center py-5">
          <Compass size={40} className="text-muted mb-2" />
          <h5 className="fw-bold text-secondary">No satellite scenes available for Madurai</h5>
          <p className="small text-muted mb-0">
            Please ingest authentic Red and NIR satellite bands on the <strong>Satellite Ingestion</strong> page first.
          </p>
        </div>
      ) : !analysis ? (
        <div className="card-section text-center py-5 bg-light border">
          <Sprout size={48} className="text-success mb-3 opacity-75" />
          <h5 className="fw-bold mb-2">NDVI Not Yet Calculated for Scene #{selectedImageId}</h5>
          <p className="text-secondary small mb-3" style={{ maxWidth: '500px', margin: '0 auto' }}>
            {selectedScene?.title} ({selectedScene?.sensor}, {selectedScene?.year}) is ready for processing.
            Click <strong>Calculate &amp; Classify NDVI</strong> above to compute vegetation coverage.
          </p>
          <button
            className="btn btn-sm btn-success px-4 py-2"
            onClick={handleCalculate}
            disabled={calculating}
          >
            {calculating ? 'Processing Vectorized Bands...' : 'Run Authentic NDVI Engine'}
          </button>
        </div>
      ) : (
        <div>
          {/* Top KPI Metric Cards */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Green-Cover Percentage"
                value={`${analysis.green_cover_percentage}%`}
                unit=""
                icon={Sprout}
                color="#1b5e20"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Total Vegetated Area"
                value={analysis.green_cover_sq_km.toLocaleString()}
                unit="sq km"
                icon={Trees}
                color="#2e7d32"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Non-Vegetation Area"
                value={analysis.non_vegetation_sq_km.toLocaleString()}
                unit="sq km"
                icon={Building2}
                color="#64748b"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Mean District NDVI"
                value={analysis.mean_ndvi.toFixed(3)}
                unit={`(±${analysis.std_ndvi.toFixed(2)})`}
                icon={BarChart2}
                color="#0284c7"
              />
            </div>
          </div>

          {/* Main Visual & Categorical Breakdown Grid */}
          <div className="row g-4">
            {/* Left Column: Colorized NDVI Map Preview */}
            <div className="col-lg-6">
              <div className="card-section h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <Layers size={18} className="text-success" />
                    Colorized NDVI Map Visualization
                  </h6>
                  <span className="badge bg-success-subtle text-success border border-success small">
                    Madurai Mask Applied
                  </span>
                </div>

                <div className="text-center p-2 bg-light rounded border mb-3">
                  <img
                    src={`http://127.0.0.1:8000${analysis.colorized_png_url}`}
                    alt="Colorized NDVI Map"
                    className="img-fluid rounded"
                    style={{ maxHeight: '420px', width: '100%', objectFit: 'contain' }}
                  />
                </div>

                {/* Spatial Metadata Summary */}
                <div className="p-3 bg-light rounded border small">
                  <div className="row g-2">
                    <div className="col-6">
                      <strong>Analyzed Area:</strong> {analysis.total_analyzed_area_sq_km.toLocaleString()} sq km
                    </div>
                    <div className="col-6">
                      <strong>NDVI Dynamic Range:</strong> [{analysis.min_ndvi.toFixed(2)}, {analysis.max_ndvi.toFixed(2)}]
                    </div>
                    <div className="col-6">
                      <strong>Spatial Resolution:</strong> 10 m / pixel
                    </div>
                    <div className="col-6">
                      <strong>Target CRS:</strong> <code>EPSG:32644 (UTM 44N)</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: 5-Class Categorical Breakdown & Statistics */}
            <div className="col-lg-6">
              <div className="card-section h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <FileCheck2 size={18} className="text-success" />
                    Vegetation Classification Breakdown
                  </h6>
                  <span className="badge bg-light text-secondary border small">
                    5 Environmental Tiers
                  </span>
                </div>

                <div className="table-responsive mb-3">
                  <table className="table table-sm align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Class</th>
                        <th>Range</th>
                        <th>Area (sq km)</th>
                        <th>Hectares (ha)</th>
                        <th className="text-end">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.classification_breakdown.map((c) => (
                        <tr key={c.class_id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span
                                style={{
                                  display: 'inline-block',
                                  width: '12px',
                                  height: '12px',
                                  backgroundColor: c.color_hex,
                                  borderRadius: '3px',
                                }}
                              ></span>
                              <span className="fw-semibold">{c.name}</span>
                            </div>
                          </td>
                          <td>
                            <code>[{c.min_ndvi}, {c.max_ndvi})</code>
                          </td>
                          <td>{c.area_sq_km.toLocaleString()}</td>
                          <td>{(c.area_sq_km * 100).toLocaleString()}</td>
                          <td className="text-end fw-bold">{c.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Progress bar visual distribution */}
                <div className="progress-stacked mb-3" style={{ height: '18px' }}>
                  {analysis.classification_breakdown.map((c) => (
                    <div
                      key={c.class_id}
                      className="progress"
                      role="progressbar"
                      style={{ width: `${c.percentage}%` }}
                    >
                      <div
                        className="progress-bar"
                        style={{ backgroundColor: c.color_hex }}
                        title={`${c.name}: ${c.percentage}%`}
                      ></div>
                    </div>
                  ))}
                </div>

                {/* NDVI Histogram frequency curve */}
                {analysis.histogram_url && (
                  <NdviHistogram histogramUrl={analysis.histogram_url} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NdviAnalysisPage;
