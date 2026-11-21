import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { BarChart3 } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const VegetationBarChart = ({ breakdown }) => {
  if (!breakdown || breakdown.length === 0) return null;

  const labels = breakdown.map((item) => item.name);
  const hectareValues = breakdown.map((item) => item.area_hectares || (item.area_sq_km * 100));
  const backgroundColors = breakdown.map((item) => item.color_hex);

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Area (Hectares)',
        data: hectareValues,
        backgroundColor: backgroundColors,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // Horizontal bars
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => ` Area: ${context.parsed.x.toLocaleString()} ha`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: '#f1f5f9',
        },
        ticks: {
          font: { size: 10 },
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 11, family: "'Inter', sans-serif" },
        },
      },
    },
  };

  return (
    <div className="card-section h-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
          <BarChart3 size={18} className="text-success" />
          Classified Land Cover Area (Hectares)
        </h6>
        <span className="badge bg-light text-secondary border small">Metric: Hectares</span>
      </div>

      <div style={{ height: '260px' }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default VegetationBarChart;
