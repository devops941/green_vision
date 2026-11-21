import React from 'react';

const StatCard = ({ title, value, unit = '', change, icon: Icon, color = 'var(--gv-primary)' }) => {
  return (
    <div className="stat-card">
      <div>
        <div className="stat-label mb-1">{title}</div>
        <div className="stat-value">
          {value} <span style={{ fontSize: '1rem', fontWeight: 500 }}>{unit}</span>
        </div>
        {change && (
          <div className="small mt-2" style={{ color: change.startsWith('+') ? 'var(--gv-success)' : 'var(--gv-danger)' }}>
            {change} vs baseline
          </div>
        )}
      </div>
      {Icon && (
        <div
          style={{
            backgroundColor: 'var(--gv-primary-light)',
            padding: '12px',
            borderRadius: '12px',
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
