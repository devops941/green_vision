import React from 'react';
import { ShieldCheck, MapPin } from 'lucide-react';

const Header = () => {
  return (
    <header className="top-header">
      <div className="d-flex align-items-center gap-3">
        <h5 className="mb-0 fw-bold" style={{ color: 'var(--gv-primary)' }}>
          GreenVision
        </h5>
        <span className="text-muted d-none d-md-inline">|</span>
        <span className="text-secondary small d-none d-md-inline">
          Satellite-Based Urban Vegetation Intelligence
        </span>
      </div>

      <div className="d-flex align-items-center gap-3">
        <div className="scope-badge">
          <MapPin size={15} />
          <span>Madurai District, TN</span>
        </div>
        <div className="d-flex align-items-center gap-1 text-success small fw-semibold">
          <ShieldCheck size={16} />
          <span className="d-none d-sm-inline">Authentic Satellite Engine</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
