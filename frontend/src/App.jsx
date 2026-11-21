import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import MaduraiOverviewPage from './pages/MaduraiOverviewPage';
import UploadPage from './pages/UploadPage';
import NdviAnalysisPage from './pages/NdviAnalysisPage';
import ComparisonPage from './pages/ComparisonPage';
import ReportsPage from './pages/ReportsPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/styles/main.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <Header />
          <main className="page-body">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/madurai" element={<MaduraiOverviewPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/ndvi" element={<NdviAnalysisPage />} />
              <Route path="/compare" element={<ComparisonPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
