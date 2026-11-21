import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { PieChart } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const VegetationDoughnutChart = ({ breakdown, greenCoverPct }) => {
  if (!breakdown || breakdown.length === 0) return null;

  const labels = breakdown.map((item) => item.name);
  const dataValues = breakdown.map((item) => item.percentage);
  const backgroundColors = breakdown.map((item) => item.color_hex);

  const data = {
    labels: labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: backgroundColors,
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 12,
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const item = breakdown[context.dataIndex];
            return ` ${item.name}: ${item.percentage}% (${item.area_sq_km.toLocaleString()} sq km / ${item.area_hectares.toLocaleString()} ha)`;
          },
        },
      },
    },
    cutout: '68%',
  };

  return (
    <div className="card-section h-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
          <PieChart size={18} className="text-success" />
          Vegetation Distribution Share
        </h6>
        <span className="badge bg-success-subtle text-success border border-success small">
          Green Cover: {greenCoverPct}%
        </span>
      </div>

      <div className="position-relative" style={{ height: '260px' }}>
        <Doughnut data={data} options={options} />
        {/* Center label */}
        <div
          className="position-absolute top-50 start-50 translate-middle text-center pointer-events-none"
          style={{ marginTop: '-15px' }}
        >
          <div className="fw-bold text-success" style={{ fontSize: '1.4rem', lineHeight: 1 }}>
            {greenCoverPct}%
          </div>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
            Green Cover
          </div>
        </div>
      </div>
    </div>
  );
};

export default VegetationDoughnutChart;
