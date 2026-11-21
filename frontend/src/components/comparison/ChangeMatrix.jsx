import React from 'react';
import { TrendingUp, TrendingDown, Minus, Layers, Info } from 'lucide-react';

const ChangeMatrix = ({ comparison }) => {
  if (!comparison) return null;

  const {
    baseline_year,
    target_year,
    green_cover_delta_percentage,
    green_cover_delta_sq_km,
    vegetation_gain_sq_km,
    vegetation_loss_sq_km,
    vegetation_stable_sq_km,
    transition_matrix,
  } = comparison;

  const isNetPositive = green_cover_delta_percentage >= 0;
  const categories = transition_matrix?.categories || [];
  const totalArea = transition_matrix?.total_compared_area_sq_km || 0;

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white border-bottom py-3">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <Layers className="text-success" size={20} />
            <span className="fw-bold fs-6">Vegetation Transition Dynamics Matrix</span>
          </div>
          <span className="badge bg-light text-dark border">
            {baseline_year} → {target_year}
          </span>
        </div>
      </div>

      <div className="card-body">
        {/* KPI Summary Cards */}
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-lg-3">
            <div className={`p-3 rounded border ${isNetPositive ? 'bg-success-subtle border-success' : 'bg-danger-subtle border-danger'}`}>
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="small text-muted fw-semibold">Net Green Cover Δ</span>
                {isNetPositive ? (
                  <TrendingUp className="text-success" size={20} />
                ) : (
                  <TrendingDown className="text-danger" size={20} />
                )}
              </div>
              <div className={`fs-4 fw-bold ${isNetPositive ? 'text-success' : 'text-danger'}`}>
                {isNetPositive ? '+' : ''}{green_cover_delta_percentage}%
              </div>
              <div className="small text-muted">
                {isNetPositive ? '+' : ''}{green_cover_delta_sq_km} km² net shift
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <div className="p-3 rounded border bg-light">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="small text-muted fw-semibold">Vegetation Gain</span>
                <span className="badge bg-success">Gain</span>
              </div>
              <div className="fs-4 fw-bold text-success">
                +{vegetation_gain_sq_km} km²
              </div>
              <div className="small text-muted">
                {totalArea > 0 ? ((vegetation_gain_sq_km / totalArea) * 100).toFixed(1) : 0}% of analyzed area
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <div className="p-3 rounded border bg-light">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="small text-muted fw-semibold">Vegetation Loss</span>
                <span className="badge bg-danger">Loss</span>
              </div>
              <div className="fs-4 fw-bold text-danger">
                -{vegetation_loss_sq_km} km²
              </div>
              <div className="small text-muted">
                {totalArea > 0 ? ((vegetation_loss_sq_km / totalArea) * 100).toFixed(1) : 0}% of analyzed area
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <div className="p-3 rounded border bg-light">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="small text-muted fw-semibold">Stable / Unchanged</span>
                <Minus className="text-muted" size={18} />
              </div>
              <div className="fs-4 fw-bold text-secondary">
                {vegetation_stable_sq_km} km²
              </div>
              <div className="small text-muted">
                {totalArea > 0 ? ((vegetation_stable_sq_km / totalArea) * 100).toFixed(1) : 0}% persistent
              </div>
            </div>
          </div>
        </div>

        {/* Transition Distribution Stacked Progress Bar */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="small fw-semibold text-muted">District Transition Proportions</span>
            <span className="small text-muted">Total: {totalArea} km²</span>
          </div>
          <div className="progress" style={{ height: '14px', borderRadius: '8px' }}>
            {categories.map((c) => (
              <div
                key={c.id}
                className="progress-bar"
                role="progressbar"
                style={{
                  width: `${c.percentage}%`,
                  backgroundColor: c.color_hex,
                }}
                title={`${c.name}: ${c.percentage}% (${c.area_sq_km} km²)`}
              />
            ))}
          </div>
        </div>

        {/* Categorical Breakdown Table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '40px' }}>Color</th>
                <th>Transition Category</th>
                <th>ΔNDVI Threshold</th>
                <th className="text-end">Area (km²)</th>
                <th className="text-end">Area (Hectares)</th>
                <th className="text-end">Coverage %</th>
                <th>Environmental Significance</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span
                      className="d-inline-block rounded-circle"
                      style={{
                        width: '18px',
                        height: '18px',
                        backgroundColor: c.color_hex,
                        border: '1px solid rgba(0,0,0,0.15)',
                      }}
                    />
                  </td>
                  <td className="fw-semibold text-dark">{c.name}</td>
                  <td>
                    <code className="small bg-light px-2 py-1 rounded text-secondary">
                      {c.min_delta === -2.0 ? '< -0.20' : c.max_delta === 2.0 ? '> +0.20' : `[${c.min_delta}, ${c.max_delta})`}
                    </code>
                  </td>
                  <td className="text-end fw-semibold">{c.area_sq_km}</td>
                  <td className="text-end text-muted">{c.area_hectares}</td>
                  <td className="text-end">
                    <span className="badge bg-light text-dark border">
                      {c.percentage}%
                    </span>
                  </td>
                  <td className="small text-muted">{c.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChangeMatrix;
