import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  ImageOverlay,
  useMapEvents,
  Popup,
  Marker,
  LayersControl,
} from 'react-leaflet';
import L from 'leaflet';
import { Layers, Sliders, MapPin, Eye, RotateCcw, Crosshair } from 'lucide-react';
import { api } from '../../services/api';

// Fix leaflet marker icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom probe marker pin icon
const probeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Map click listener hook component
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

const MADURAI_CENTER = [9.9252, 78.1198];
const MADURAI_DEFAULT_BOUNDS = [
  [9.53, 77.68],
  [10.35, 78.52],
];

const MaduraiMapViewer = ({
  analysis,
  scene,
  height = '500px',
  showControls = true,
}) => {
  const [boundaryGeoJson, setBoundaryGeoJson] = useState(null);
  const [opacity, setOpacity] = useState(0.85);
  const [showNdvi, setShowNdvi] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);
  const [probeResult, setProbeResult] = useState(null);
  const [probing, setProbing] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  // Fetch official Madurai boundary GeoJSON
  useEffect(() => {
    api.getMaduraiBoundary()
      .then((res) => setBoundaryGeoJson(res.data))
      .catch((err) => console.error('Could not load Madurai boundary:', err));
  }, []);

  const handleMapClick = async (latlng) => {
    if (!analysis || !scene) return;
    setProbing(true);
    try {
      const res = await api.probeNdviPixel(scene.id, latlng.lat, latlng.lng);
      setProbeResult({
        lat: latlng.lat,
        lng: latlng.lng,
        data: res.data,
      });
    } catch (err) {
      console.error('Probe error:', err);
    } finally {
      setProbing(false);
    }
  };

  const resetView = () => {
    if (mapInstance) {
      mapInstance.flyToBounds(MADURAI_DEFAULT_BOUNDS, { duration: 1.2 });
    }
  };

  // Determine overlay bounds
  let overlayBounds = MADURAI_DEFAULT_BOUNDS;
  if (scene && scene.bbox) {
    overlayBounds = [
      [scene.bbox.min_latitude, scene.bbox.min_longitude],
      [scene.bbox.max_latitude, scene.bbox.max_longitude],
    ];
  }

  const ndviImageUrl = analysis?.colorized_png_url
    ? `http://127.0.0.1:8000${analysis.colorized_png_url}`
    : null;

  return (
    <div className="card-section p-0 overflow-hidden position-relative">
      {/* Top Map Control Bar */}
      {showControls && (
        <div className="p-3 bg-white border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-success-subtle text-success border border-success fw-semibold">
              Madurai District GIS Viewer
            </span>
            {probing && (
              <span className="badge bg-primary text-white d-flex align-items-center gap-1">
                <Crosshair size={12} className="spinner-border spinner-border-sm" /> Probing Pixel...
              </span>
            )}
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Opacity Slider */}
            {ndviImageUrl && (
              <div className="d-flex align-items-center gap-2 small">
                <Sliders size={14} className="text-secondary" />
                <span className="text-secondary">NDVI Opacity:</span>
                <input
                  type="range"
                  className="form-range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  style={{ width: '90px' }}
                />
                <span className="fw-semibold text-dark">{Math.round(opacity * 100)}%</span>
              </div>
            )}

            {/* Reset Bounds */}
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={resetView}
              title="Reset to Madurai District Extent"
            >
              <RotateCcw size={13} />
              <span className="d-none d-sm-inline">Reset View</span>
            </button>
          </div>
        </div>
      )}

      {/* Leaflet Map Container */}
      <div style={{ height, width: '100%' }}>
        <MapContainer
          center={MADURAI_CENTER}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          ref={setMapInstance}
        >
          <MapClickHandler onMapClick={handleMapClick} />

          <LayersControl position="topright">
            {/* Base Layer: Esri World Imagery (Satellite) */}
            <LayersControl.BaseLayer checked name="Satellite (Esri Imagery)">
              <TileLayer
                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={18}
              />
            </LayersControl.BaseLayer>

            {/* Base Layer: OpenStreetMap Standard */}
            <LayersControl.BaseLayer name="OpenStreetMap (Street)">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>

            {/* Base Layer: CartoDB Clean Light */}
            <LayersControl.BaseLayer name="CartoDB Clean Light">
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Official Madurai District Boundary Polygon Layer */}
          {showBoundary && boundaryGeoJson && (
            <GeoJSON
              data={boundaryGeoJson}
              style={{
                color: '#1b5e20',
                weight: 2.5,
                opacity: 0.9,
                fillColor: '#2e7d32',
                fillOpacity: 0.08,
                dashArray: '4, 4',
              }}
            />
          )}

          {/* Colorized NDVI Raster Layer Overlay */}
          {showNdvi && ndviImageUrl && (
            <ImageOverlay
              url={ndviImageUrl}
              bounds={overlayBounds}
              opacity={opacity}
            />
          )}

          {/* Click-to-inspect Pixel Probe Marker */}
          {probeResult && (
            <Marker position={[probeResult.lat, probeResult.lng]} icon={probeIcon}>
              <Popup>
                <div style={{ minWidth: '180px' }}>
                  <div className="fw-bold text-success border-bottom pb-1 mb-2 d-flex align-items-center gap-1">
                    <MapPin size={14} /> Madurai Pixel Inspection
                  </div>
                  {probeResult.data.status === 'success' ? (
                    <div className="small">
                      <div className="d-flex justify-content-between mb-1">
                        <strong>NDVI Value:</strong>
                        <span className="badge bg-dark font-monospace">{probeResult.data.ndvi}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong>Classification:</strong>
                        <span
                          className="badge"
                          style={{ backgroundColor: probeResult.data.color_hex }}
                        >
                          {probeResult.data.class_name}
                        </span>
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Lat: {probeResult.lat.toFixed(4)}°N, Lon: {probeResult.lng.toFixed(4)}°E
                      </div>
                    </div>
                  ) : (
                    <div className="small text-danger">
                      {probeResult.data.message || 'Location is outside district bounds.'}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Floating Instructions Banner */}
      <div
        className="position-absolute bottom-0 start-0 m-3 p-2 bg-white rounded shadow-sm border small"
        style={{ zIndex: 1000, maxWidth: '280px', opacity: 0.95 }}
      >
        <div className="fw-bold text-success d-flex align-items-center gap-1 mb-1">
          <Crosshair size={13} /> Interactive Pixel Probe
        </div>
        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
          Click anywhere inside Madurai District on the map to sample the authentic NDVI float value and vegetation category.
        </div>
      </div>
    </div>
  );
};

export default MaduraiMapViewer;
