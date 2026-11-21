import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GitCompare,
  AlertCircle,
  CheckCircle,
  UploadCloud,
  Sprout,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import YearSelector from '../components/comparison/YearSelector';
import ChangeMatrix from '../components/comparison/ChangeMatrix';
import ChangeMapViewer from '../components/comparison/ChangeMapViewer';

const ComparisonPage = () => {
  const [analyses, setAnalyses] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [baselineId, setBaselineId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [selectedCompId, setSelectedCompId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [activeComparison, setActiveComparison] = useState(null);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch initial data
  const fetchData = async () => {
    setPageLoading(true);
    setError(null);
    try {
      const [analysesRes, comparisonsRes] = await Promise.all([
        api.listNdviAnalyses(),
        api.listComparisons(),
      ]);

      setAnalyses(analysesRes.data || []);
      const comps = comparisonsRes.data || [];
      setComparisons(comps);

      // Default to latest comparison if available
      if (comps.length > 0) {
        setSelectedCompId(comps[0].id.toString());
        setActiveComparison(comps[0]);
        setBaselineId(comps[0].baseline_analysis_id.toString());
        setTargetId(comps[0].target_analysis_id.toString());
      } else if (analysesRes.data && analysesRes.data.length >= 2) {
        setBaselineId(analysesRes.data[0].id.toString());
        setTargetId(analysesRes.data[1].id.toString());
      }
    } catch (err) {
      console.error('Error fetching comparison workspace data:', err);
      setError('Failed to load satellite analyses or saved comparisons.');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle selecting an existing comparison from the dropdown
  const handleSelectExisting = async (compIdStr) => {
    setSelectedCompId(compIdStr);
    if (!compIdStr) {
      setActiveComparison(null);
      return;
    }

    const found = comparisons.find((c) => c.id.toString() === compIdStr);
    if (found) {
      setActiveComparison(found);
      setBaselineId(found.baseline_analysis_id.toString());
      setTargetId(found.target_analysis_id.toString());
      setCustomTitle(found.title);
    } else {
      try {
        const res = await api.getComparison(parseInt(compIdStr, 10));
        setActiveComparison(res.data);
      } catch (err) {
        console.error('Failed to load comparison record:', err);
      }
    }
  };

  // Run new comparison
  const handleRunComparison = async (e) => {
    e.preventDefault();
    if (!baselineId || !targetId) {
      setError('Please select both a baseline and a target scene.');
      return;
    }
    if (baselineId === targetId) {
      setError('Baseline and Target must be distinct satellite scenes.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        baseline_analysis_id: parseInt(baselineId, 10),
        target_analysis_id: parseInt(targetId, 10),
        title: customTitle.trim() || undefined,
      };

      const res = await api.compareScenes(payload);
      setActiveComparison(res.data);
      setSelectedCompId(res.data.id.toString());
      setSuccessMessage(`Bi-temporal comparison successfully computed: ${res.data.title}`);

      // Refresh comparisons list
      const updatedComps = await api.listComparisons();
      setComparisons(updatedComps.data || []);
    } catch (err) {
      console.error('Change comparison execution failed:', err);
      setError(
        err.response?.data?.detail || 'Failed to execute temporal change analysis. Check server logs.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading comparison workspace...</span>
        </div>
        <p className="mt-3 text-muted">Loading Madurai District multi-year analyses...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-2">
      {/* Page Title & Scope */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <GitCompare className="text-success" />
            <span>Multi-Year Temporal Change Analysis</span>
          </h4>
          <p className="text-muted small mb-0">
            Bi-temporal pixel diffing (ΔNDVI = T₂ − T₁) and vegetation transition matrix for{' '}
            <strong className="text-dark">Madurai District, Tamil Nadu</strong>.
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

      {successMessage && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-4" role="alert">
          <CheckCircle size={18} />
          <div className="small">{successMessage}</div>
        </div>
      )}

      {/* When fewer than 2 analyses exist */}
      {analyses.length < 2 ? (
        <div className="card shadow-sm border-0 text-center py-5 mb-4">
          <div className="card-body">
            <div className="rounded-circle bg-light d-inline-flex p-3 mb-3 border">
              <Sparkles className="text-success" size={36} />
            </div>
            <h5 className="fw-bold text-dark">At Least Two Analyzed Scenes Required</h5>
            <p className="text-muted mx-auto" style={{ maxWidth: '520px' }}>
              Multi-year change detection computes pixel-by-pixel transitions between two distinct observation dates.
              Currently, you have <strong>{analyses.length}</strong> NDVI analysis recorded.
            </p>
            <div className="d-flex justify-content-center gap-3 mt-3">
              <Link to="/upload" className="btn btn-success d-flex align-items-center gap-2">
                <UploadCloud size={16} />
                <span>Upload Satellite Bands</span>
              </Link>
              <Link to="/ndvi" className="btn btn-outline-success d-flex align-items-center gap-2">
                <Sprout size={16} />
                <span>Calculate NDVI Analyses</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Year Selector Form */}
          <YearSelector
            analyses={analyses}
            comparisons={comparisons}
            baselineId={baselineId}
            targetId={targetId}
            selectedCompId={selectedCompId}
            customTitle={customTitle}
            loading={loading}
            onBaselineChange={setBaselineId}
            onTargetChange={setTargetId}
            onTitleChange={setCustomTitle}
            onSelectExisting={handleSelectExisting}
            onRunComparison={handleRunComparison}
          />

          {/* Active Comparison Analytics */}
          {activeComparison ? (
            <>
              {/* Transition Matrix & KPI Breakdown */}
              <ChangeMatrix comparison={activeComparison} />

              {/* Spatial Difference Map */}
              <ChangeMapViewer comparison={activeComparison} height="520px" />
            </>
          ) : (
            <div className="card shadow-sm border-0 text-center py-4 text-muted">
              Select a baseline and target scene above and click "Run Multi-Year Change Analysis" to visualize vegetation dynamics.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ComparisonPage;
