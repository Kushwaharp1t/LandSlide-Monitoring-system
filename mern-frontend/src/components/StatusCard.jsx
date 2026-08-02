import React from 'react';

export default function StatusCard({ reading, material }) {
  const status = reading?.status || 'SAFE';
  const riskLevel = reading?.risk_level ?? 0;
  const elapsed = reading?.elapsed_sec ?? 0;
  const timestamp = (reading?.timestamp || '').split(' ')[1] || '--:--:--';

  const formatTime = (secs) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const statusClass = riskLevel === 2 ? 'danger' : (riskLevel === 1 ? 'warning' : 'safe');

  let desc = 'Slope dynamics stable. All sensors within normal operational limits.';
  if (riskLevel === 2) desc = 'CRITICAL SLOPE FAILURE IMMINENT. Multi-sensor danger thresholds exceeded!';
  else if (riskLevel === 1) desc = 'SLOPE INSTABILITY DETECTED. Accelerated moisture/pressure movement.';

  return (
    <div className={`card status-card ${statusClass}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: '#94a3b8' }}>
          CURRENT RISK ASSESSMENT
        </span>
        <span className="live-dot" />
      </div>

      <div className="status-main">
        <h2>{status}</h2>
        <p>{desc}</p>
      </div>

      <div className="status-metrics">
        <div className="metric-item">
          <span className="m-label">Active Target:</span>
          <span className="m-val">{material.toUpperCase()}</span>
        </div>
        <div className="metric-item">
          <span className="m-label">Elapsed Time:</span>
          <span className="m-val">{formatTime(elapsed)}</span>
        </div>
        <div className="metric-item">
          <span className="m-label">Last Ping:</span>
          <span className="m-val">{timestamp}</span>
        </div>
      </div>
    </div>
  );
}
