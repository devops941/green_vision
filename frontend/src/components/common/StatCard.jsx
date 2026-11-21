import React from 'react';

const StatCard = ({
  title,
  value,
  unit = '',
  change,
  icon: Icon,
  color = 'var(--gv-primary)',
  bgGradient = 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.04) 100%)',
  subtitle,
}) => {
  return (
    <div className="stat-card-pro">
      <div>
        <div className="stat-label mb-1">{title}</div>
        <div className="stat-value">
          {value}{' '}
          {unit && (
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gv-text-secondary)' }}>
              {unit}
            </span>
          )}
        </div>
        {change && (
          <div
            className="small mt-2 fw-semibold d-inline-flex align-items-center gap-1 px-2 py-0.5 rounded-pill"
            style={{
              backgroundColor: change.startsWith('+') ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: change.startsWith('+') ? '#047857' : '#b91c1c',
              fontSize: '0.75rem',
            }}
          >
            <span>{change}</span>
            <span className="text-muted fw-normal" style={{ fontSize: '0.7rem' }}>vs baseline</span>
          </div>
        )}
        {subtitle && !change && (
          <div className="small text-muted mt-2" style={{ fontSize: '0.75rem' }}>
            {subtitle}
          </div>
        )}
      </div>

      {Icon && (
        <div
          style={{
            background: bgGradient,
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            transition: 'transform 0.25s ease',
          }}
          className="stat-icon-wrapper"
        >
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
