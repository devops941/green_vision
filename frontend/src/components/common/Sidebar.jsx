import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  UploadCloud,
  Sprout,
  GitCompare,
  FileText,
  Compass
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/madurai', label: 'Madurai District', icon: Map },
  { path: '/upload', label: 'Satellite Ingestion', icon: UploadCloud },
  { path: '/ndvi', label: 'NDVI Analytics', icon: Sprout },
  { path: '/compare', label: 'Year-wise Change', icon: GitCompare },
  { path: '/reports', label: 'PDF Reports', icon: FileText },
];

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Compass size={28} className="text-success" />
        <div>
          <div className="brand-title">GreenVision</div>
          <div className="brand-sub">Madurai Urban GIS</div>
        </div>
      </div>

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

      <div className="mt-auto p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="small text-muted mb-1">Geographic Boundary:</div>
        <div className="small text-white fw-semibold">Madurai District</div>
        <div className="small text-muted" style={{ fontSize: '0.75rem' }}>EPSG:32644 (UTM 44N)</div>
      </div>
    </aside>
  );
};

export default Sidebar;
