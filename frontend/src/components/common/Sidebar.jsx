import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Globe,
  LayoutDashboard,
  Map,
  UploadCloud,
  Sprout,
  GitCompare,
  FileText,
  Compass,
  Radio,
  Satellite,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Overview & Portal', icon: Globe },
  { path: '/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
  { path: '/madurai', label: 'Madurai District GIS', icon: Map },
  { path: '/upload', label: 'Satellite Ingestion', icon: UploadCloud },
  { path: '/ndvi', label: 'NDVI Analytics', icon: Sprout },
  { path: '/compare', label: 'Temporal Change', icon: GitCompare },
  { path: '/reports', label: 'PDF Reports', icon: FileText },
];

const Sidebar = () => {
  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <Satellite size={22} className="float-icon" />
        </div>
        <div>
          <div className="brand-title">GreenVision™</div>
          <div className="brand-sub">Madurai Urban GIS Pro</div>
        </div>
      </div>

      {/* Navigation List */}
      <ul className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `nav-link-custom ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>

      {/* Bottom Telemetry Card */}
      <div className="sidebar-telemetry-box mt-auto">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <span className="small text-muted fw-semibold" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
            GEOSPATIAL FENCE
          </span>
          <div className="radar-beacon" title="District Geofence Active" />
        </div>
        <div className="small text-white fw-bold d-flex align-items-center gap-1">
          <Map size={14} className="text-success" />
          <span>Madurai District</span>
        </div>
        <div className="small text-muted mt-1 font-monospace" style={{ fontSize: '0.72rem' }}>
          EPSG:32644 (UTM 44N)
        </div>
        <div className="mt-2 pt-2 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center">
          <span className="badge bg-success bg-opacity-25 text-success rounded-pill px-2 py-0" style={{ fontSize: '0.65rem' }}>
            Level-2A Surface
          </span>
          <span className="text-white-50" style={{ fontSize: '0.65rem' }}>
            v1.0.0 Pro
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
