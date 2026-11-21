import React from 'react';
import { BarChart3 } from 'lucide-react';

const NdviHistogram = ({ histogramUrl }) => {
  if (!histogramUrl) return null;

  const fullUrl = `http://127.0.0.1:8000${histogramUrl}`;

  return (
    <div className="card-section mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
          <BarChart3 size={18} className="text-success" />
          NDVI Pixel Frequency Distribution Curve
        </h6>
        <span className="badge bg-light text-secondary border small">
          Matplotlib Scientific Output
        </span>
      </div>

      <div className="text-center p-2 bg-light rounded border">
        <img
          src={fullUrl}
          alt="NDVI Frequency Distribution"
          className="img-fluid rounded"
          style={{ maxHeight: '350px', width: '100%', objectFit: 'contain' }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>

      <div className="text-muted small mt-2" style={{ fontSize: '0.775rem' }}>
        * Distribution curve displays the pixel frequency across Madurai District. Dashed red vertical line indicates the scene mean NDVI.
      </div>
    </div>
  );
};

export default NdviHistogram;
