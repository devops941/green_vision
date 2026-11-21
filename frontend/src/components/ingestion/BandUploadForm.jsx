import React, { useState } from 'react';
import { UploadCloud, FileCheck, AlertCircle, Loader2, Info } from 'lucide-react';
import { api } from '../../services/api';
import MetadataViewer from './MetadataViewer';

const BandUploadForm = ({ onUploadSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    sensor: 'SENTINEL_2',
    acquisition_date: new Date().toISOString().split('T')[0],
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    notes: '',
  });

  const [redFile, setRedFile] = useState(null);
  const [nirFile, setNirFile] = useState(null);

  const [inspecting, setInspecting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validationDetails, setValidationDetails] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' || name === 'month' ? parseInt(value) || '' : value,
    }));
  };

  const handleInspect = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setValidationDetails(null);

    if (!redFile || !nirFile) {
      setErrorMsg('Please select both Red and NIR band GeoTIFF files before validating.');
      return;
    }

    setInspecting(true);
    const data = new FormData();
    data.append('sensor', formData.sensor);
    data.append('red_band', redFile);
    data.append('nir_band', nirFile);

    try {
      const res = await api.validateSatelliteHeaders(data);
      setValidationDetails(res.data.details);
      setSuccessMsg(res.data.message);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Validation failed.';
      setErrorMsg(detail);
    } finally {
      setInspecting(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.title.trim()) {
      setErrorMsg('Please provide a descriptive title for this satellite scene.');
      return;
    }
    if (!redFile || !nirFile) {
      setErrorMsg('Both Red and NIR band files are required.');
      return;
    }

    setUploading(true);
    const data = new FormData();
    data.append('title', formData.title);
    data.append('sensor', formData.sensor);
    data.append('acquisition_date', formData.acquisition_date);
    data.append('year', formData.year);
    if (formData.month) data.append('month', formData.month);
    if (formData.notes) data.append('notes', formData.notes);
    data.append('red_band', redFile);
    data.append('nir_band', nirFile);

    try {
      const res = await api.uploadSatelliteImage(data);
      setSuccessMsg(`Satellite scene "${res.data.title}" successfully ingested and indexed!`);
      // Reset files
      setRedFile(null);
      setNirFile(null);
      setValidationDetails(null);
      if (onUploadSuccess) onUploadSuccess(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Upload failed.';
      setErrorMsg(detail);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card-section">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="fw-bold mb-1">Satellite Scene Ingestion</h5>
          <p className="text-secondary small mb-0">
            Upload authentic multi-spectral GeoTIFF bands intersecting <strong>Madurai District, Tamil Nadu</strong>.
          </p>
        </div>
      </div>

      <form onSubmit={handleUpload}>
        <div className="row g-3">
          {/* Title */}
          <div className="col-md-6">
            <label className="form-label small fw-semibold">Scene Display Title *</label>
            <input
              type="text"
              name="title"
              className="form-control"
              placeholder="e.g. Madurai Sentinel-2 Post-Monsoon 2024"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Sensor Platform */}
          <div className="col-md-6">
            <label className="form-label small fw-semibold">Satellite Platform / Sensor *</label>
            <select
              name="sensor"
              className="form-select"
              value={formData.sensor}
              onChange={handleInputChange}
            >
              <option value="SENTINEL_2">Copernicus Sentinel-2 (MSI) – B04 (Red) & B08 (NIR)</option>
              <option value="LANDSAT_8_9">USGS Landsat 8/9 (OLI) – B4 (Red) & B5 (NIR)</option>
            </select>
          </div>

          {/* Acquisition Date */}
          <div className="col-md-4">
            <label className="form-label small fw-semibold">Acquisition Date *</label>
            <input
              type="date"
              name="acquisition_date"
              className="form-control"
              value={formData.acquisition_date}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Year */}
          <div className="col-md-4">
            <label className="form-label small fw-semibold">Observation Year *</label>
            <input
              type="number"
              name="year"
              className="form-control"
              min="1980"
              max="2035"
              value={formData.year}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Month */}
          <div className="col-md-4">
            <label className="form-label small fw-semibold">Month</label>
            <input
              type="number"
              name="month"
              className="form-control"
              min="1"
              max="12"
              value={formData.month}
              onChange={handleInputChange}
            />
          </div>

          {/* Red Band File Picker */}
          <div className="col-md-6">
            <label className="form-label small fw-semibold">
              Red Spectral Band File (.tif, .jp2) *
              <span className="text-muted ms-1 font-monospace">
                [{formData.sensor === 'SENTINEL_2' ? 'B04 / 665nm' : 'B4 / 655nm'}]
              </span>
            </label>
            <input
              type="file"
              className="form-control"
              accept=".tif,.tiff,.jp2"
              onChange={(e) => setRedFile(e.target.files[0] || null)}
              required
            />
            {redFile && (
              <div className="small text-muted mt-1 text-truncate">
                Selected: <strong>{redFile.name}</strong> ({(redFile.size / (1024 * 1024)).toFixed(2)} MB)
              </div>
            )}
          </div>

          {/* NIR Band File Picker */}
          <div className="col-md-6">
            <label className="form-label small fw-semibold">
              Near-Infrared (NIR) Band File (.tif, .jp2) *
              <span className="text-muted ms-1 font-monospace">
                [{formData.sensor === 'SENTINEL_2' ? 'B08 / 842nm' : 'B5 / 865nm'}]
              </span>
            </label>
            <input
              type="file"
              className="form-control"
              accept=".tif,.tiff,.jp2"
              onChange={(e) => setNirFile(e.target.files[0] || null)}
              required
            />
            {nirFile && (
              <div className="small text-muted mt-1 text-truncate">
                Selected: <strong>{nirFile.name}</strong> ({(nirFile.size / (1024 * 1024)).toFixed(2)} MB)
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="col-12">
            <label className="form-label small fw-semibold">Provenance & Notes</label>
            <input
              type="text"
              name="notes"
              className="form-control"
              placeholder="e.g. MGRS Tile 44QND, Copernicus CDSE download, Cloud Cover < 5%"
              value={formData.notes}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-2 mt-4">
          <button
            type="button"
            className="btn btn-outline-success d-flex align-items-center gap-2"
            onClick={handleInspect}
            disabled={inspecting || uploading || !redFile || !nirFile}
          >
            {inspecting ? <Loader2 size={16} className="spinner-border spinner-border-sm" /> : <FileCheck size={16} />}
            <span>Validate Headers (Pre-flight)</span>
          </button>

          <button
            type="submit"
            className="btn btn-success d-flex align-items-center gap-2"
            style={{ backgroundColor: 'var(--gv-primary)', borderColor: 'var(--gv-primary)' }}
            disabled={uploading || inspecting || !redFile || !nirFile}
          >
            {uploading ? <Loader2 size={16} className="spinner-border spinner-border-sm" /> : <UploadCloud size={16} />}
            <span>{uploading ? 'Validating & Uploading...' : 'Upload & Register Scene'}</span>
          </button>
        </div>
      </form>

      {/* Notifications */}
      {errorMsg && (
        <div className="alert alert-danger d-flex align-items-start gap-2 mt-3 mb-0">
          <AlertCircle size={20} className="mt-1 flex-shrink-0" />
          <div>
            <strong>Geospatial Validation Error:</strong> {errorMsg}
          </div>
        </div>
      )}

      {successMsg && !errorMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 mt-3 mb-0">
          <FileCheck size={18} className="flex-shrink-0" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Inspected Metadata Preview */}
      {validationDetails && <MetadataViewer details={validationDetails} />}
    </div>
  );
};

export default BandUploadForm;
