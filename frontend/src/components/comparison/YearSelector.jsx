import React from 'react';
import { GitCompare, Calendar, ArrowRight, Play, CheckCircle } from 'lucide-react';

const YearSelector = ({
  analyses,
  comparisons,
  baselineId,
  targetId,
  selectedCompId,
  customTitle,
  loading,
  onBaselineChange,
  onTargetChange,
  onTitleChange,
  onSelectExisting,
  onRunComparison,
}) => {
  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white border-bottom py-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <GitCompare className="text-success" size={20} />
            <span className="fw-bold fs-6">Temporal Change Configuration</span>
          </div>

          {comparisons && comparisons.length > 0 && (
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted fw-semibold">Saved Comparisons:</span>
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto', minWidth: '220px' }}
                value={selectedCompId || ''}
                onChange={(e) => onSelectExisting(e.target.value)}
              >
                <option value="">-- Choose Existing Comparison --</option>
                {comparisons.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id}: {c.baseline_year} vs {c.target_year} ({c.green_cover_delta_percentage >= 0 ? '+' : ''}{c.green_cover_delta_percentage}%)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="card-body">
        <form onSubmit={onRunComparison}>
          <div className="row g-3 align-items-center">
            {/* Baseline T1 */}
            <div className="col-md-5">
              <label className="form-label small fw-semibold text-muted d-flex align-items-center gap-1">
                <Calendar size={14} className="text-primary" />
                Baseline Scene (T₁) - Earlier Year
              </label>
              <select
                className="form-select"
                value={baselineId || ''}
                onChange={(e) => onBaselineChange(e.target.value)}
                required
              >
                <option value="">-- Select Baseline Analysis (T₁) --</option>
                {analyses.map((a) => (
                  <option key={a.id} value={a.id}>
                    Analysis #{a.id} | Scene #{a.satellite_image_id} (Green Cover: {a.green_cover_percentage}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Transition Arrow */}
            <div className="col-md-2 text-center d-none d-md-flex justify-content-center align-items-center pt-3">
              <div className="rounded-circle bg-light p-2 border">
                <ArrowRight size={22} className="text-success" />
              </div>
            </div>

            {/* Target T2 */}
            <div className="col-md-5">
              <label className="form-label small fw-semibold text-muted d-flex align-items-center gap-1">
                <Calendar size={14} className="text-success" />
                Target Scene (T₂) - Later Year
              </label>
              <select
                className="form-select"
                value={targetId || ''}
                onChange={(e) => onTargetChange(e.target.value)}
                required
              >
                <option value="">-- Select Target Analysis (T₂) --</option>
                {analyses.map((a) => (
                  <option key={a.id} value={a.id}>
                    Analysis #{a.id} | Scene #{a.satellite_image_id} (Green Cover: {a.green_cover_percentage}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row mt-3 g-3 align-items-center">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Optional custom title (e.g., 'Madurai Urban Expansion: 2020 vs 2024')"
                value={customTitle}
                onChange={(e) => onTitleChange(e.target.value)}
              />
            </div>
            <div className="col-md-4 text-end">
              <button
                type="submit"
                className="btn btn-success w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
                disabled={loading || !baselineId || !targetId || baselineId === targetId}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    <span>Computing Bi-Temporal Delta...</span>
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    <span>Run Multi-Year Change Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {baselineId && targetId && baselineId === targetId && (
            <div className="alert alert-warning py-2 mt-3 small mb-0">
              Please choose two distinct satellite scenes to evaluate vegetation dynamics over time.
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default YearSelector;
