import React from 'react';

export default function ThreatMatrix({ riskLevel = 0 }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Threat Level Matrix</h3>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Risk Index (0 - 2)</span>
      </div>
      <div className="risk-meter-container">
        <div className="risk-segments">
          <div className={`risk-segment safe-seg ${riskLevel === 0 ? 'active' : ''}`}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>0</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>SAFE</span>
          </div>
          <div className={`risk-segment warn-seg ${riskLevel === 1 ? 'active' : ''}`}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>1</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>WARNING</span>
          </div>
          <div className={`risk-segment danger-seg ${riskLevel === 2 ? 'active' : ''}`}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>2</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>DANGER</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f1117', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
          <span>Risk Score: <strong>{riskLevel} / 2</strong></span>
          <span style={{
            padding: '0.2rem 0.6rem',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '0.75rem',
            backgroundColor: riskLevel === 2 ? 'rgba(232, 64, 64, 0.15)' : (riskLevel === 1 ? 'rgba(232, 160, 32, 0.12)' : 'rgba(38, 208, 124, 0.12)'),
            color: riskLevel === 2 ? '#e84040' : (riskLevel === 1 ? '#e8a020' : '#26d07c')
          }}>
            {riskLevel === 2 ? 'DANGER' : (riskLevel === 1 ? 'WARNING' : 'SAFE')}
          </span>
        </div>
      </div>
    </div>
  );
}
