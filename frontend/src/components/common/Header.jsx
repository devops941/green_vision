import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, Radio, Clock, Satellite } from 'lucide-react';

const Header = () => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="top-header">
      {/* Brand & Mission Status */}
      <div className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center gap-2">
          <div className="radar-beacon" title="Live Telemetry Stream Active" />
          <h5 className="mb-0 fw-bold" style={{ color: 'var(--gv-primary)', letterSpacing: '-0.3px' }}>
            GreenVision
          </h5>
        </div>
        <span className="text-muted d-none d-lg-inline">|</span>
        <div className="d-none d-lg-flex align-items-center gap-2 text-secondary small">
          <Satellite size={15} className="text-success float-icon" />
          <span className="fw-medium">Sentinel-2 & Landsat 8-9 Earth Observation Engine</span>
        </div>
      </div>

      {/* Real-time Telemetry & Scope Chips */}
      <div className="d-flex align-items-center gap-2 gap-md-3">
        {/* Live Clock Chip */}
        <div className="sensor-chip d-none d-md-flex align-items-center gap-1">
          <Clock size={13} className="text-muted" />
          <span className="font-monospace small">{timeStr} IST</span>
        </div>

        {/* Geographic Scope Badge */}
        <div className="scope-badge-pro" title="Strict Geographical Scope">
          <MapPin size={14} className="text-success" />
          <span>Madurai District, TN</span>
          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-0" style={{ fontSize: '0.68rem' }}>
            EPSG:32644
          </span>
        </div>

        {/* Authentic Multi-Spectral Verification Chip */}
        <div className="sensor-chip d-none d-sm-flex align-items-center gap-1 text-success fw-semibold">
          <ShieldCheck size={15} />
          <span>Authentic Multi-Spectral</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
