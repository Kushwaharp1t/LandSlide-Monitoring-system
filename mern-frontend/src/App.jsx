import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import HeaderBar from './components/HeaderBar';
import RadialGauge from './components/RadialGauge';
import StatusCard from './components/StatusCard';
import VibrationChart from './components/VibrationChart';
import ThreatMatrix from './components/ThreatMatrix';
import ComparisonTable from './components/ComparisonTable';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [material, setMaterial] = useState('soil');
  const [speed, setSpeed] = useState(5);
  const [modeStatus, setModeStatus] = useState({ mode: 'replay', material: 'soil' });
  
  const [currentReading, setCurrentReading] = useState({
    roll_deg: 0,
    pitch_deg: 0,
    pressure_kpa: 0,
    moisture_pct: 0,
    vibration_adc: 0,
    status: 'SAFE',
    risk_level: 0,
    elapsed_sec: 0,
    timestamp: '--:--:--'
  });

  const [vibeHistory, setVibeHistory] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[REACT WS] Connected to MERN backend server');
    });

    socket.on('mode_status', (data) => {
      console.log('[REACT WS] Mode status update:', data);
      setModeStatus(data);
    });

    socket.on('reading', (row) => {
      setCurrentReading(row);
      setVibeHistory(prev => {
        const next = [...prev, { elapsed: row.elapsed_sec, vibe: row.vibration_adc }];
        if (next.length > 150) next.shift();
        return next;
      });
    });

    socket.on('replay_complete', () => {
      console.log('[REACT WS] Replay session completed');
      setIsPlaying(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleTogglePlay = () => {
    if (!socketRef.current) return;

    if (isPlaying) {
      socketRef.current.emit('stop_replay');
      setIsPlaying(false);
    } else {
      socketRef.current.emit('start_replay', { material, speed });
      setIsPlaying(true);
    }
  };

  const handleMaterialChange = (newMat) => {
    setMaterial(newMat);
    if (isPlaying && socketRef.current) {
      socketRef.current.emit('stop_replay');
      setTimeout(() => {
        socketRef.current.emit('start_replay', { material: newMat, speed });
      }, 200);
    }
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (isPlaying && socketRef.current) {
      socketRef.current.emit('set_speed', { speed: newSpeed });
    }
  };

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <HeaderBar
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        material={material}
        onMaterialChange={handleMaterialChange}
        speed={speed}
        onSpeedChange={handleSpeedChange}
        modeStatus={modeStatus}
      />

      {/* TOP ROW - 3 RADIAL GAUGES */}
      <section className="grid-top">
        <RadialGauge
          title="Roll Angle"
          value={currentReading.roll_deg || 0}
          unit="°"
          min={-90}
          max={90}
          warnThreshold={20}
          dangerThreshold={35}
          isBilateral={true}
        />
        <RadialGauge
          title="Pitch Angle"
          value={currentReading.pitch_deg || 0}
          unit="°"
          min={-90}
          max={90}
          warnThreshold={20}
          dangerThreshold={35}
          isBilateral={true}
        />
        <RadialGauge
          title="Pore Water Pressure"
          value={currentReading.pressure_kpa || 0}
          unit="kPa"
          min={0}
          max={200}
          warnThreshold={120}
          dangerThreshold={160}
        />
      </section>

      {/* MIDDLE ROW - STATUS CARD & VIBRATION CHART */}
      <section className="grid-middle">
        <StatusCard reading={currentReading} material={material} />
        <VibrationChart
          vibeHistory={vibeHistory}
          currentVibe={currentReading.vibration_adc || 0}
          riskLevel={currentReading.risk_level || 0}
        />
      </section>

      {/* BOTTOM ROW - MOISTURE GAUGE, THREAT MATRIX, INFO */}
      <section className="grid-bottom">
        <RadialGauge
          title="Soil Moisture Content"
          value={currentReading.moisture_pct || 0}
          unit="%"
          min={0}
          max={100}
          warnThreshold={70}
          dangerThreshold={85}
        />
        <ThreatMatrix riskLevel={currentReading.risk_level || 0} />
        <div className="card">
          <div className="card-header">
            <h3>MERN Architecture Info</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#94a3b8' }}>Stack:</span>
              <span style={{ fontWeight: 600, color: '#3b82f6' }}>MERN (Mongo, Express, React, Node)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#94a3b8' }}>Frontend Engine:</span>
              <span style={{ fontWeight: 600 }}>React 18 + Vite</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '0.5rem' }}>
              <span style={{ color: '#94a3b8' }}>WebSocket Protocol:</span>
              <span style={{ fontWeight: 600, color: '#26d07c' }}>Socket.IO (v4)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Dataset Size:</span>
              <span style={{ fontWeight: 600 }}>4,083 Telemetry Readings</span>
            </div>
          </div>
        </div>
      </section>

      {/* HISTORICAL COMPARISON TABLE */}
      <ComparisonTable />
    </div>
  );
}
