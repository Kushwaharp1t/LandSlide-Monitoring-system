import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function VibrationChart({ vibeHistory, currentVibe, riskLevel }) {
  const labels = vibeHistory.map(item => item.elapsed);
  const dataPoints = vibeHistory.map(item => item.vibe);

  let borderColor = '#3b82f6';
  let bgColor = 'rgba(59, 130, 246, 0.1)';

  if (riskLevel === 2) {
    borderColor = '#e84040';
    bgColor = 'rgba(232, 64, 64, 0.15)';
  } else if (riskLevel === 1) {
    borderColor = '#e8a020';
    bgColor = 'rgba(232, 160, 32, 0.15)';
  }

  const data = {
    labels,
    datasets: [{
      label: 'Vibration (ADC)',
      data: dataPoints,
      borderColor,
      backgroundColor: bgColor,
      borderWidth: 2,
      pointRadius: 0,
      fill: true,
      tension: 0.35
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { display: false },
      y: {
        min: 0,
        max: 32767,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    animation: { duration: 0 }
  };

  return (
    <div className="card" style={{ minHeight: '280px' }}>
      <div className="card-header">
        <div>
          <h3>Piezoelectric Vibration Telemetry</h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Real-time rolling waveform buffer (~150 readings)</p>
        </div>
        <div style={{ backgroundColor: '#0f1117', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#3b82f6' }}>
          {currentVibe.toLocaleString()} ADC
        </div>
      </div>
      <div style={{ position: 'relative', width: '100%', flexGrow: 1, minHeight: '200px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
