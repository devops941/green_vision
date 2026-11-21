import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  PlusCircle,
  Calendar,
  AlertCircle,
  CheckCircle,
  HardDrive,
  GitCompare,
  Sprout,
  X,
  FileCheck,
} from 'lucide-react';
import { api } from '../services/api';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [comparisons, setComparisons] = useState([]);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states for generation modal / panel
  const [selectedAnalysisId, setSelectedAnalysisId] = useState('');
  const [selectedComparisonId, setSelectedComparisonId] = useState('');
  const [reportTypeToGenerate, setReportTypeToGenerate] = useState('ndvi'); // 'ndvi' or 'comparison'
  const [previewReport, setPreviewReport] = useState(null);

  const API_SERVER_URL = process.env.REACT_APP_API_SERVER_URL || 'http://127.0.0.1:8000';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [repsRes, analysesRes, compsRes] = await Promise.all([
        api.listReports(),
        api.listNdviAnalyses(),
        api.listComparisons(),
      ]);
      setReports(repsRes.data || []);
      setAnalyses(analysesRes.data || []);
      setComparisons(compsRes.data || []);

      if (analysesRes.data && analysesRes.data.length > 0) {
        setSelectedAnalysisId(analysesRes.data[0].id.toString());
      }
      if (compsRes.data && compsRes.data.length > 0) {
        setSelectedComparisonId(compsRes.data[0].id.toString());
      }
    } catch (err) {
      console.error('Error fetching reports data:', err);
      setError('Failed to load reports archive or analysis sources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      let res;
      if (reportTypeToGenerate === 'ndvi') {
        if (!selectedAnalysisId) {
          setError('Please select an NDVI analysis to compile.');
          setGenerating(false);
          return;
        }
        res = await api.generateNdviReport(parseInt(selectedAnalysisId, 10));
      } else {
        if (!selectedComparisonId) {
          setError('Please select a temporal comparison to compile.');
          setGenerating(false);
          return;
        }
        res = await api.generateComparisonReport(parseInt(selectedComparisonId, 10));
      }

      setSuccess(`Report compiled successfully: ${res.data.filename} (${res.data.file_size_kb} KB)`);
      setPreviewReport(res.data);

      // Refresh reports list
      const updated = await api.listReports();
      setReports(updated.data || []);
    } catch (err) {
      console.error('Report compilation error:', err);
      setError(err.response?.data?.detail || 'Failed to generate PDF report. Check server logs.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReport = async (filename) => {
    if (!window.confirm(`Are you sure you want to permanently delete '${filename}'?`)) {
      return;
    }

    try {
      await api.deleteReport(filename);
      setReports((prev) => prev.filter((r) => r.filename !== filename));
      if (previewReport && previewReport.filename === filename) {
        setPreviewReport(null);
      }
      setSuccess(`Report '${filename}' deleted.`);
    } catch (err) {
      console.error('Failed to delete report:', err);
      setError('Could not delete report file.');
    }
  };

  return (
    <div className="container-fluid py-2">
      {/* Page Title & Scope */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <FileText className="text-success" />
            <span>Official Environmental PDF Reports & Exports</span>
          </h4>
          <p className="text-muted small mb-0">
            Automated multi-page executive assessment reports generated exclusively for{' '}
            <strong className="text-dark">Madurai District, Tamil Nadu (EPSG:32644)</strong>.
          </p>
        </div>

        <button
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
          onClick={fetchData}
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
          <AlertCircle size={18} />
          <div className="small">{error}</div>
        </div>
      )}

      {success && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-4" role="alert">
          <CheckCircle size={18} />
          <div className="small">{success}</div>
        </div>
      )}

      {/* Generator Configuration Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white border-bottom py-3">
          <div className="d-flex align-items-center gap-2">
            <PlusCircle className="text-success" size={20} />
            <span className="fw-bold fs-6">Compile New Environmental Assessment Report</span>
          </div>
        </div>

        <div className="card-body">
          <form onSubmit={handleGenerateReport}>
            <div className="row g-3 align-items-center">
              {/* Report Type Selector */}
              <div className="col-md-3">
                <label className="form-label small fw-semibold text-muted">Report Type</label>
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn btn-sm ${reportTypeToGenerate === 'ndvi' ? 'btn-success' : 'btn-outline-secondary'}`}
                    onClick={() => setReportTypeToGenerate('ndvi')}
                  >
                    <Sprout size={14} className="me-1" />
                    NDVI Scene
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${reportTypeToGenerate === 'comparison' ? 'btn-success' : 'btn-outline-secondary'}`}
                    onClick={() => setReportTypeToGenerate('comparison')}
                  >
                    <GitCompare size={14} className="me-1" />
                    Multi-Year Change
                  </button>
                </div>
              </div>

              {/* Source Analysis / Comparison Selector */}
              <div className="col-md-6">
                {reportTypeToGenerate === 'ndvi' ? (
                  <>
                    <label className="form-label small fw-semibold text-muted">
                      Select Computed NDVI Analysis
                    </label>
                    <select
                      className="form-select"
                      value={selectedAnalysisId}
                      onChange={(e) => setSelectedAnalysisId(e.target.value)}
                      disabled={analyses.length === 0}
                    >
                      {analyses.length === 0 ? (
                        <option value="">No NDVI analyses available. Compute one first.</option>
                      ) : (
                        analyses.map((a) => (
                          <option key={a.id} value={a.id}>
                            Analysis #{a.id} • Scene #{a.satellite_image_id} • Green Cover: {a.green_cover_percentage}% ({a.green_cover_sq_km} km²)
                          </option>
                        ))
                      )}
                    </select>
                  </>
                ) : (
                  <>
                    <label className="form-label small fw-semibold text-muted">
                      Select Computed Temporal Comparison
                    </label>
                    <select
                      className="form-select"
                      value={selectedComparisonId}
                      onChange={(e) => setSelectedComparisonId(e.target.value)}
                      disabled={comparisons.length === 0}
                    >
                      {comparisons.length === 0 ? (
                        <option value="">No temporal comparisons available. Run one first.</option>
                      ) : (
                        comparisons.map((c) => (
                          <option key={c.id} value={c.id}>
                            Comparison #{c.id} • {c.baseline_year} vs {c.target_year} • Net Shift: {c.green_cover_delta_percentage >= 0 ? '+' : ''}{c.green_cover_delta_percentage}%
                          </option>
                        ))
                      )}
                    </select>
                  </>
                )}
              </div>

              {/* Generate Trigger Button */}
              <div className="col-md-3 text-end pt-3 pt-md-0">
                <button
                  type="submit"
                  className="btn btn-success w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
                  disabled={
                    generating ||
                    (reportTypeToGenerate === 'ndvi' && analyses.length === 0) ||
                    (reportTypeToGenerate === 'comparison' && comparisons.length === 0)
                  }
                >
                  {generating ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      <span>Compiling PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck size={16} />
                      <span>Generate PDF Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Reports Archive & Preview Section */}
      <div className="row g-4">
        {/* Reports Archive Table */}
        <div className={previewReport ? 'col-lg-7' : 'col-12'}>
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <HardDrive className="text-success" size={18} />
                <span className="fw-bold fs-6">Generated Reports Archive</span>
              </div>
              <span className="badge bg-light text-dark border">
                {reports.length} {reports.length === 1 ? 'Report' : 'Reports'}
              </span>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-success" role="status" />
                  <p className="mt-2 text-muted small">Loading archive...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <FileText size={40} className="text-muted opacity-50 mb-2" />
                  <p className="mb-0">No PDF reports generated yet.</p>
                  <p className="small">Select an analysis above to compile your first official assessment report.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Report ID & Title</th>
                        <th>Type</th>
                        <th>File Size</th>
                        <th>Generated</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((rep) => {
                        const isSelected = previewReport && previewReport.filename === rep.filename;
                        const dlUrl = `${API_SERVER_URL}/api/reports/download/${rep.filename}`;

                        return (
                          <tr key={rep.filename} className={isSelected ? 'table-success' : ''}>
                            <td>
                              <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '240px' }} title={rep.filename}>
                                {rep.filename}
                              </div>
                              <div className="small text-muted font-monospace">{rep.report_id}</div>
                            </td>
                            <td>
                              <span
                                className={`badge ${rep.report_type === 'temporal_comparison' ? 'bg-primary-subtle text-primary border border-primary' : 'bg-success-subtle text-success border border-success'}`}
                              >
                                {rep.report_type === 'temporal_comparison' ? 'Change Audit' : 'NDVI Assessment'}
                              </span>
                            </td>
                            <td className="small text-muted">{rep.file_size_kb} KB</td>
                            <td className="small text-muted">
                              {new Date(rep.created_at).toLocaleDateString()}
                            </td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <button
                                  className={`btn ${isSelected ? 'btn-success' : 'btn-outline-secondary'}`}
                                  onClick={() => setPreviewReport(rep)}
                                  title="Preview PDF"
                                >
                                  <Eye size={14} />
                                </button>
                                <a
                                  href={dlUrl}
                                  className="btn btn-outline-success"
                                  download
                                  title="Download PDF"
                                >
                                  <Download size={14} />
                                </a>
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleDeleteReport(rep.filename)}
                                  title="Delete Report"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live PDF Preview Pane */}
        {previewReport && (
          <div className="col-lg-5">
            <div className="card shadow-sm border-0 sticky-top" style={{ top: '80px' }}>
              <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <Eye className="text-success" size={18} />
                  <span className="fw-bold fs-6">Document Viewer</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <a
                    href={`${API_SERVER_URL}/api/reports/download/${previewReport.filename}`}
                    className="btn btn-sm btn-success d-flex align-items-center gap-1"
                    download
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </a>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setPreviewReport(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="card-body p-0">
                <div style={{ height: '600px', width: '100%' }}>
                  <iframe
                    src={`${API_SERVER_URL}/static/reports/${previewReport.filename}#toolbar=0`}
                    title="PDF Report Preview"
                    width="100%"
                    height="100%"
                    style={{ border: 'none' }}
                  />
                </div>
              </div>

              <div className="card-footer bg-light py-2 small text-muted text-center">
                Madurai District Urban Vegetation Assessment • High-Res Vectorized PDF
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
