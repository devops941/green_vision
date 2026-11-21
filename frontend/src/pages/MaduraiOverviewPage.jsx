import React, { useEffect, useState } from 'react';
import { MapPin, Globe, Compass, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

const MaduraiOverviewPage = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMaduraiOverview()
      .then((res) => {
        setOverview(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load Madurai metadata:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h3 className="fw-bold mb-1">Madurai District Overview</h3>
        <p className="text-secondary">
          Official administrative geospatial boundaries and regional parameters for satellite monitoring.
        </p>
      </div>

      {loading ? (
        <div className="text-muted">Loading Madurai geospatial metadata...</div>
      ) : overview ? (
        <div>
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="card-section h-100">
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <MapPin size={20} className="text-success" />
                  Administrative Profile
                </h5>
                <ul className="list-unstyled mb-0 d-flex flex-direction-column gap-2">
                  <li><strong>District:</strong> {overview.district}</li>
                  <li><strong>State:</strong> {overview.state}</li>
                  <li><strong>Country:</strong> {overview.country}</li>
                  <li><strong>Total Area:</strong> ~{overview.area_sq_km.toLocaleString()} sq km</li>
                  <li><strong>UTM Projection:</strong> <code>{overview.utm_crs}</code> (Zone 44N)</li>
                  <li><strong>Geographic Center:</strong> Lat {overview.center.latitude}° N, Lon {overview.center.longitude}° E</li>
                </ul>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card-section h-100">
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <Globe size={20} className="text-success" />
                  Geographical Bounding Box (WGS84)
                </h5>
                <div className="p-3 bg-light rounded small font-monospace mb-3">
                  <div>Min Longitude: {overview.bbox_wgs84.min_longitude}° E</div>
                  <div>Min Latitude:  {overview.bbox_wgs84.min_latitude}° N</div>
                  <div>Max Longitude: {overview.bbox_wgs84.max_longitude}° E</div>
                  <div>Max Latitude:  {overview.bbox_wgs84.max_latitude}° N</div>
                </div>
                <div className="text-secondary small">
                  {overview.description}
                </div>
              </div>
            </div>
          </div>

          <div className="card-section">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <Compass size={20} className="text-success" />
              Covered Administrative Taluks
            </h5>
            <div className="row g-2">
              {overview.taluks.map((taluk) => (
                <div key={taluk} className="col-md-4 col-sm-6">
                  <div className="p-2 border rounded d-flex align-items-center gap-2 bg-light">
                    <CheckCircle size={16} className="text-success" />
                    <span className="small fw-semibold">{taluk}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-danger">
          Failed to load Madurai District metadata. Check if backend is running.
        </div>
      )}
    </div>
  );
};

export default MaduraiOverviewPage;
