import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function RadialGauge({ title, value, unit, min, max, warnThreshold, dangerThreshold, isBilateral = false }) {
  let percent = 0;
  let color = '#26d07c';

  if (isBilateral) {
    percent = ((value + Math.abs(min)) / (max - min)) * 100;
    const absVal = Math.abs(value);
    if (absVal > dangerThreshold) color = '#e84040';
    else if (absVal > warnThreshold) color = '#e8a020';
  } else {
    percent = (value / max) * 100;
    if (value > dangerThreshold) color = '#e84040';
    else if (value > warnThreshold) color = '#e8a020';
  }

  const p = Math.max(0, Math.min(100, percent));

  const data = {
    datasets: [{
      data: [p, 100 - p],
      backgroundColor: [color, '#252b3b'],
      borderWidth: 0,
      borderRadius: 4
    }]
  };

  const options = {
    rotation: 270,
    circumference: 180,
    cutout: '80%',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: { enabled: false },
      legend: { display: false }
    },
    animation: { duration: 300 }
  };

  return (
    <div className="card gauge-card">
      <div className="card-header">
        <h3>{title}</h3>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{unit}</span>
      </div>
      <div className="gauge-wrapper">
        <Doughnut data={data} options={options} />
        <div className="gauge-center-value">
          <span className="val">{value.toFixed(1)}</span>
          <span className="unit">{unit}</span>
        </div>
      </div>
    </div>
  );
}
