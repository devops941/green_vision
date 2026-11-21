import React from 'react';
import { CheckCircle2, AlertTriangle, Layers, MapPin, Gauge } from 'lucide-react';

const MetadataViewer = ({ details }) => {
  if (!details) return null;

  const { red_band, nir_band, sensor, dimension_match, crs_match, madurai_intersection } = details;

  return (
    <div className="card-section border-success bg-white mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0 text-success d-flex align-items-center gap-2">
          <CheckCircle2 size={18} />
          Pre-Flight Validation Successful
        </h6>
        <span className="badge bg-success-subtle text-success border border-success px-2 py-1">
          {sensor}
        </span>
      </div>

      <div className="row g-3">
        {/* Red Band Summary */}
        <div className="col-md-6">
          <div className="p-3 rounded border bg-light">
            <div className="fw-semibold text-secondary small mb-2 d-flex align-items-center gap-1">
              <span className="badge bg-danger text-white">RED Band</span>
              <span className="text-truncate" style={{ maxWidth: '200px' }}>{red_band.filename}</span>
            </div>
            <div className="small">
              <div><strong>CRS:</strong> <code>{red_band.crs}</code></div>
              <div><strong>Resolution:</strong> ~{red_band.resolution_m} m</div>
              <div><strong>Dimensions:</strong> {red_band.width} × {red_band.height} px</div>
              <div><strong>Data Type:</strong> {red_band.dtypes.join(', ')}</div>
            </div>
          </div>
        </div>

        {/* NIR Band Summary */}
        <div className="col-md-6">
          <div className="p-3 rounded border bg-light">
            <div className="fw-semibold text-secondary small mb-2 d-flex align-items-center gap-1">
              <span className="badge bg-success text-white">NIR Band</span>
              <span className="text-truncate" style={{ maxWidth: '200px' }}>{nir_band.filename}</span>
            </div>
            <div className="small">
              <div><strong>CRS:</strong> <code>{nir_band.crs}</code></div>
              <div><strong>Resolution:</strong> ~{nir_band.resolution_m} m</div>
              <div><strong>Dimensions:</strong> {nir_band.width} × {nir_band.height} px</div>
              <div><strong>Data Type:</strong> {nir_band.dtypes.join(', ')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Spatial Fence & Compatibility Checks */}
      <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <div className="row g-2 small">
          <div className="col-md-4 d-flex align-items-center gap-2">
            <MapPin size={16} className="text-success" />
            <span>
              <strong>Madurai Intersection:</strong>{' '}
              <span className="text-success fw-bold">Verified ({madurai_intersection.approx_district_overlap_percentage}% overlap)</span>
            </span>
          </div>
          <div className="col-md-4 d-flex align-items-center gap-2">
            <Layers size={16} className={dimension_match ? "text-success" : "text-warning"} />
            <span>
              <strong>Grid Dimensions:</strong>{' '}
              {dimension_match ? (
                <span className="text-success fw-bold">Matched ({red_band.width}×{red_band.height})</span>
              ) : (
                <span className="text-warning fw-bold">Requires Resampling</span>
              )}
            </span>
          </div>
          <div className="col-md-4 d-flex align-items-center gap-2">
            <Gauge size={16} className={crs_match ? "text-success" : "text-info"} />
            <span>
              <strong>Target Projection:</strong>{' '}
              <span className="text-dark fw-bold">UTM Zone 44N (EPSG:32644)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetadataViewer;
