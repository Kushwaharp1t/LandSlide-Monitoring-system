import React, { useEffect, useState } from 'react';

export default function ComparisonTable() {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/summary/all');
      if (!res.ok) throw new Error('Failed to fetch summary');
      const data = await res.json();
      setSummaryData(data);
    } catch (err) {
      console.error('[TABLE ERROR]', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const formatTime = (secs) => {
    if (secs == null) return 'N/A';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const materials = ['soil', 'sand', 'coal'];

  return (
    <div className="card" style={{ marginTop: '0.5rem' }}>
      <div className="card-header">
        <div>
          <h2>Geotechnical Material Stability Comparison</h2>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Aggregated historical baseline vs. failure threshold metrics derived from MongoDB / Database store
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchSummary}>Refresh Data</button>
      </div>

      <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Material Type</th>
              <th>Test Duration</th>
              <th>Time to Warning</th>
              <th>Time to Failure (Danger)</th>
              <th>Moisture Progression (Base → Fail)</th>
              <th>Pore Pressure (Base → Fail)</th>
              <th>Peak Vibration</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading summary metrics...</td></tr>
            ) : error ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#e84040' }}>Error: {error}</td></tr>
            ) : (
              materials.map(mat => {
                const s = summaryData?.[mat];
                if (!s) return null;
                return (
                  <tr key={mat}>
                    <td><span className="mat-badge">{s.material}</span></td>
                    <td>{formatTime(s.total_duration_sec)} ({Math.round(s.total_duration_sec / 60)} min)</td>
                    <td><span style={{ color: '#26d07c' }}>{formatTime(s.time_to_warning_sec)}</span></td>
                    <td><span style={{ color: '#e84040' }}>{formatTime(s.time_to_danger_sec)}</span></td>
                    <td>{s.baseline_moisture}% &rarr; <strong>{s.failure_moisture}%</strong></td>
                    <td>{s.baseline_pressure} &rarr; <strong>{s.failure_pressure} kPa</strong></td>
                    <td><strong>{s.max_vibration?.toLocaleString()}</strong> ADC</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
