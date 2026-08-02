import React from 'react';

export default function HeaderBar({ 
  isPlaying, 
  onTogglePlay, 
  material, 
  onMaterialChange, 
  speed, 
  onSpeedChange, 
  modeStatus 
}) {
  return (
    <header className="header-bar">
      <div className="brand">
        <div className="brand-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <h1>Landslide Detection & Monitoring Dashboard</h1>
          <p className="subtitle">MERN Stack (MongoDB, Express, React, Node) IoT Telemetry</p>
        </div>
      </div>

      <div className="controls-group">
        {/* MODE BADGE */}
        <div className={`mode-badge ${modeStatus?.mode || 'replay'}`}>
          <span className="dot">●</span>
          <span>{modeStatus?.mode === 'live' ? 'LIVE MODE' : `REPLAY MODE (${speed}x)`}</span>
        </div>

        {/* MATERIAL SELECT */}
        <div className="control-item">
          <select 
            id="material-select"
            className="custom-select"
            value={material}
            onChange={(e) => onMaterialChange(e.target.value)}
          >
            <option value="soil">Soil (46 min)</option>
            <option value="sand">Sand (30 min)</option>
            <option value="coal">Coal (60 min)</option>
          </select>
        </div>

        {/* PLAY/PAUSE */}
        <button 
          id="play-btn"
          className={`btn ${isPlaying ? 'btn-secondary' : 'btn-primary'}`}
          onClick={onTogglePlay}
        >
          <span>{isPlaying ? 'Stop Replay' : 'Start Replay'}</span>
        </button>

        {/* SPEED BUTTONS */}
        <div className="speed-control-group">
          <span style={{ fontSize: '0.75rem', color: '#64748b', padding: '0 0.4rem' }}>Speed:</span>
          {[1, 5, 20].map(s => (
            <button
              key={s}
              className={`speed-btn ${speed === s ? 'active' : ''}`}
              onClick={() => onSpeedChange(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
