import React, { useState, useEffect } from 'react';
import { UploadCloud, Layers, Trash2, Calendar, Database, ShieldCheck, Eye, Scissors, CheckCircle, Loader2 } from 'lucide-react';
import BandUploadForm from '../components/ingestion/BandUploadForm';
import { api } from '../services/api';

const UploadPage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);

  const fetchImages = () => {
    setLoading(true);
    api.listSatelliteImages()
      .then((res) => {
        setImages(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch satellite scenes:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handlePreprocess = async (id, title) => {
    setProcessingId(id);
    setStatusMsg(null);
    try {
      const res = await api.preprocessImage(id);
      setStatusMsg({
        type: 'success',
        text: `Scene #${id} ("${title}") successfully clipped along Madurai District GeoJSON boundary (${res.data.valid_district_pixels.toLocaleString()} valid district pixels).`,
      });
      fetchImages();
    } catch (err) {
      setStatusMsg({
        type: 'danger',
        text: `Preprocessing failed for scene #${id}: ` + (err.response?.data?.detail || err.message),
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete satellite scene "${title}"?`)) {
      try {
        await api.deleteSatelliteImage(id);
        fetchImages();
        if (selectedImage && selectedImage.id === id) {
          setSelectedImage(null);
        }
      } catch (err) {
        alert('Failed to delete satellite image: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  return (
    <div>
      {/* Title & Scope */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Satellite Ingestion & Preprocessing</h3>
          <p className="text-secondary mb-0">
            Ingest, validate, and clip multi-spectral satellite scenes strictly along the <strong>Madurai District administrative boundary</strong>.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-primary-subtle text-primary border border-primary px-3 py-2">
            Target CRS: EPSG:32644 (UTM 44N)
          </span>
        </div>
      </div>

      {/* Global Status Notification */}
      {statusMsg && (
        <div className={`alert alert-${statusMsg.type} alert-dismissible fade show mb-4`} role="alert">
          {statusMsg.text}
          <button type="button" className="btn-close" onClick={() => setStatusMsg(null)}></button>
        </div>
      )}

      {/* Upload Form Component */}
      <BandUploadForm onUploadSuccess={() => fetchImages()} />

      {/* Registered Satellite Scenes Table */}
      <div className="card-section mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
            <Database size={20} className="text-success" />
            Registered Satellite Scenes for Madurai ({images.length})
          </h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={fetchImages}>
            Refresh List
          </button>
        </div>

        {loading ? (
          <div className="text-muted py-3">Loading registered scenes...</div>
        ) : images.length === 0 ? (
          <div className="text-center py-5 border rounded bg-light">
            <UploadCloud size={40} className="text-muted mb-2" />
            <div className="fw-semibold text-secondary">No satellite scenes uploaded yet</div>
            <div className="small text-muted mt-1">
              Upload authentic Red and NIR band GeoTIFFs above to begin processing for Madurai District.
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small">
                <tr>
                  <th>ID</th>
                  <th>Scene Title</th>
                  <th>Platform / Sensor</th>
                  <th>Year / Date</th>
                  <th>CRS & Resolution</th>
                  <th>Preprocessing State</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="small">
                {images.map((img) => (
                  <tr key={img.id}>
                    <td className="fw-bold text-muted">#{img.id}</td>
                    <td>
                      <div className="fw-semibold text-dark">{img.title}</div>
                      {img.notes && <div className="text-muted small text-truncate" style={{ maxWidth: '250px' }}>{img.notes}</div>}
                    </td>
                    <td>
                      <span className="badge bg-secondary-subtle text-secondary border">
                        {img.sensor}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <Calendar size={14} className="text-muted" />
                        <span>{new Date(img.acquisition_date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-muted small">Year: {img.year}</div>
                    </td>
                    <td>
                      <div><code>{img.crs}</code></div>
                      <div className="text-muted small">{img.spatial_resolution_m} m/pixel</div>
                    </td>
                    <td>
                      {img.is_preprocessed ? (
                        <span className="badge bg-success-subtle text-success border border-success d-inline-flex align-items-center gap-1">
                          <CheckCircle size={12} />
                          Clipped &amp; Masked
                        </span>
                      ) : (
                        <span className="badge bg-warning-subtle text-warning border border-warning">
                          Raw (Needs Masking)
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      {!img.is_preprocessed && (
                        <button
                          className="btn btn-sm btn-outline-success me-2"
                          title="Preprocess & Mask to Madurai Boundary"
                          onClick={() => handlePreprocess(img.id, img.title)}
                          disabled={processingId === img.id}
                        >
                          {processingId === img.id ? (
                            <Loader2 size={14} className="spinner-border spinner-border-sm" />
                          ) : (
                            <Scissors size={14} />
                          )}
                          <span className="ms-1 d-none d-md-inline">Preprocess</span>
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        title="View Detailed Metadata"
                        onClick={() => setSelectedImage(img)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        title="Delete Scene"
                        onClick={() => handleDelete(img.id, img.title)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Scene Metadata Modal */}
      {selectedImage && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  Metadata: {selectedImage.title}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedImage(null)}
                ></button>
              </div>
              <div className="modal-body small">
                <div className="row g-3">
                  <div className="col-md-6">
                    <strong>Scene ID:</strong> #{selectedImage.id}<br />
                    <strong>Sensor:</strong> {selectedImage.sensor}<br />
                    <strong>Acquisition Date:</strong> {new Date(selectedImage.acquisition_date).toLocaleString()}<br />
                    <strong>Year:</strong> {selectedImage.year}<br />
                    <strong>Spatial Resolution:</strong> {selectedImage.spatial_resolution_m} m<br />
                    <strong>Native CRS:</strong> <code>{selectedImage.crs}</code><br />
                    <strong>Preprocessing Status:</strong>{' '}
                    <span className={selectedImage.is_preprocessed ? 'text-success fw-bold' : 'text-warning'}>
                      {selectedImage.is_preprocessed ? 'Clipped & Masked' : 'Raw'}
                    </span>
                    {selectedImage.valid_pixels_count && (
                      <div>
                        <strong>Valid Madurai Pixels:</strong> {selectedImage.valid_pixels_count.toLocaleString()} px
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <strong>Geographical Bounding Box (WGS84):</strong>
                    <div className="p-2 bg-light rounded mt-1 font-monospace">
                      Min Lon: {selectedImage.bbox?.min_longitude}° E<br />
                      Min Lat: {selectedImage.bbox?.min_latitude}° N<br />
                      Max Lon: {selectedImage.bbox?.max_longitude}° E<br />
                      Max Lat: {selectedImage.bbox?.max_latitude}° N
                    </div>
                  </div>
                  <div className="col-12">
                    <strong>Raw Ingestion Paths:</strong>
                    <div className="p-2 bg-light rounded mt-1 text-break font-monospace">
                      <div><strong>Red Band:</strong> {selectedImage.red_band_path}</div>
                      <div className="mt-1"><strong>NIR Band:</strong> {selectedImage.nir_band_path}</div>
                    </div>
                  </div>
                  {selectedImage.is_preprocessed && (
                    <div className="col-12">
                      <strong className="text-success">Preprocessed Clipped Paths (data/processed/):</strong>
                      <div className="p-2 bg-success-subtle rounded mt-1 text-break font-monospace">
                        <div><strong>Clipped Red:</strong> {selectedImage.processed_red_path}</div>
                        <div className="mt-1"><strong>Clipped NIR:</strong> {selectedImage.processed_nir_path}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedImage(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
