import React from 'react';
import { Play, Loader2, Info } from 'lucide-react';

const NDVI_CLASSES = [
  { id: 0, name: 'Water Body', range: '< 0.0', color: '#0d47a1', desc: 'Rivers, tanks, wetlands' },
  { id: 1, name: 'Built-up / Barren', range: '0.0 - 0.2', color: '#bdbdbd', desc: 'Urban concrete, rock, soil' },
  { id: 2, name: 'Sparse Vegetation', range: '0.2 - 0.4', color: '#fff59d', desc: 'Dry grassland, open shrubs' },
  { id: 3, name: 'Moderate Vegetation', range: '0.4 - 0.6', color: '#66bb6a', desc: 'Crops, urban parks, mixed' },
  { id: 4, name: 'Dense Vegetation', range: '0.6 - 1.0', color: '#1b5e20', desc: 'Thick canopy, orchards, forest' },
];

const NdviControls = ({
  images,
  selectedImageId,
  onSelectImage,
  onCalculate,
  calculating,
}) => {
  return (
    <div className="card-section mb-4">
      <div className="row g-3 align-items-center">
        {/* Scene Selection */}
        <div className="col-lg-6 col-md-7">
          <label className="form-label small fw-semibold text-secondary mb-1">
            Select Madurai Satellite Scene:
          </label>
          <select
            className="form-select form-select-sm"
            value={selectedImageId || ''}
            onChange={(e) => onSelectImage(Number(e.target.value))}
          >
            {images.length === 0 && <option value="">No satellite scenes available</option>}
            {images.map((img) => (
              <option key={img.id} value={img.id}>
                #{img.id} - {img.title} ({img.sensor}, {img.year})
              </option>
            ))}
          </select>
        </div>

        {/* Action Button */}
        <div className="col-lg-6 col-md-5 text-md-end mt-md-4">
          <button
            className="btn btn-sm btn-success d-inline-flex align-items-center gap-2 px-3"
            style={{ backgroundColor: 'var(--gv-primary)', borderColor: 'var(--gv-primary)' }}
            onClick={onCalculate}
            disabled={!selectedImageId || calculating}
          >
            {calculating ? (
              <>
                <Loader2 size={16} className="spinner-border spinner-border-sm" />
                <span>Computing Authentic NDVI...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Calculate &amp; Classify NDVI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Standard Classification Scale Legend Bar */}
      <div className="mt-3 pt-3 border-top">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="small fw-semibold text-secondary d-flex align-items-center gap-1">
            <Info size={14} className="text-primary" />
            Standard Environmental NDVI Classification Scale:
          </span>
          <span className="small text-muted" style={{ fontSize: '0.75rem' }}>
            Vegetation Threshold: NDVI &ge; 0.20
          </span>
        </div>
        <div className="row g-2">
          {NDVI_CLASSES.map((cls) => (
            <div key={cls.id} className="col">
              <div
                className="p-2 rounded text-center small"
                style={{
                  backgroundColor: cls.id === 0 || cls.id === 4 ? cls.color : '#f8fafc',
                  color: cls.id === 0 || cls.id === 4 ? '#ffffff' : '#0f172a',
                  border: `2px solid ${cls.color}`,
                  minHeight: '60px',
                }}
              >
                <div className="fw-bold" style={{ fontSize: '0.8rem' }}>{cls.name}</div>
                <div style={{ fontSize: '0.725rem', opacity: 0.9 }}>{cls.range}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NdviControls;
