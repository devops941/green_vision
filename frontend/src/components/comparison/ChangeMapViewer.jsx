import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  ImageOverlay,
  LayersControl,
} from 'react-leaflet';
import L from 'leaflet';
import { Layers, Sliders, RotateCcw, Eye } from 'lucide-react';
import { api } from '../../services/api';

const MADURAI_CENTER = [9.9252, 78.1198];
const MADURAI_DEFAULT_BOUNDS = [
  [9.53, 77.68],
  [10.35, 78.52],
];

const CHANGE_LEGEND_ITEMS = [
  { name: 'Severe Loss (Δ < -0.20)', color: '#b71c1c' },
  { name: 'Moderate Loss (-0.20 to -0.05)', color: '#ef5350' },
  { name: 'Stable (-0.05 to +0.05)', color: '#cfd8dc' },
  { name: 'Moderate Gain (+0.05 to +0.20)', color: '#81c784' },
  { name: 'Significant Gain (Δ > +0.20)', color: '#1b5e20' },
];

const ChangeMapViewer = ({ comparison, height = '500px' }) => {
  const [boundaryGeoJson, setBoundaryGeoJson] = useState(null);
  const [opacity, setOpacity] = useState(0.85);
  const [showDiffOverlay, setShowDiffOverlay] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    api.getMaduraiBoundary()
      .then((res) => setBoundaryGeoJson(res.data))
      .catch((err) => console.error('Could not load Madurai boundary GeoJSON:', err));
  }, []);

  const resetView = () => {
    if (mapInstance) {
      mapInstance.flyToBounds(MADURAI_DEFAULT_BOUNDS, { duration: 1.0 });
    }
  };

  const API_SERVER_URL = process.env.REACT_APP_API_SERVER_URL || 'http://127.0.0.1:8000';
  const diffMapUrl = comparison?.difference_map_url
    ? `${API_SERVER_URL}${comparison.difference_map_url}`
    : null;

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white border-bottom py-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <Layers className="text-success" size={20} />
            <span className="fw-bold fs-6">
              Spatial Difference Map & Degradation Detection
            </span>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <Sliders size={16} className="text-muted" />
              <label htmlFor="diff-opacity-slider" className="small text-muted fw-semibold">
                Opacity: {Math.round(opacity * 100)}%
              </label>
              <input
                id="diff-opacity-slider"
                type="range"
                className="form-range"
                style={{ width: '90px' }}
                min="0.1"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
              />
            </div>

            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                id="toggleDiff"
                checked={showDiffOverlay}
                onChange={(e) => setShowDiffOverlay(e.target.checked)}
              />
              <label className="form-check-label small fw-semibold" htmlFor="toggleDiff">
                Diff Overlay
              </label>
            </div>

            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={resetView}
              title="Reset Zoom to Madurai District"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      <div className="card-body p-0 position-relative">
        <div style={{ height, width: '100%' }}>
          <MapContainer
            center={MADURAI_CENTER}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            ref={setMapInstance}
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Satellite Imagery (Esri)">
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="&copy; Esri, Maxar, Earthstar Geographics"
                  maxZoom={18}
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="OpenStreetMap">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                  maxZoom={18}
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="CartoDB Light">
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  attribution="&copy; CartoDB"
                  maxZoom={18}
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            {/* Official Madurai District Vector Boundary */}
            {showBoundary && boundaryGeoJson && (
              <GeoJSON
                data={boundaryGeoJson}
                style={{
                  color: '#10b981',
                  weight: 2.5,
                  opacity: 0.9,
                  fillColor: '#10b981',
                  fillOpacity: 0.05,
                  dashArray: '4, 4',
                }}
              />
            )}

            {/* Difference Raster Map Overlay */}
            {showDiffOverlay && diffMapUrl && (
              <ImageOverlay
                url={diffMapUrl}
                bounds={MADURAI_DEFAULT_BOUNDS}
                opacity={opacity}
                zIndex={400}
              />
            )}
          </MapContainer>
        </div>

        {/* Change Detection Map Legend */}
        <div
          className="position-absolute bg-white p-2 rounded shadow-sm border"
          style={{
            bottom: '16px',
            right: '16px',
            zIndex: 1000,
            fontSize: '0.78rem',
            maxWidth: '260px',
          }}
        >
          <div className="fw-bold text-dark mb-1 d-flex align-items-center gap-1">
            <Eye size={13} className="text-success" />
            <span>ΔNDVI Change Legend</span>
          </div>
          {CHANGE_LEGEND_ITEMS.map((item, idx) => (
            <div key={idx} className="d-flex align-items-center gap-2 mb-1">
              <span
                className="d-inline-block rounded-circle flex-shrink-0"
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: item.color,
                  border: '1px solid rgba(0,0,0,0.2)',
                }}
              />
              <span className="text-secondary">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChangeMapViewer;
