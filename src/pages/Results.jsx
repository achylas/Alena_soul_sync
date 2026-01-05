import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSession } from '../services/storage';
import { getResult } from '../services/api';
import '../styles/results.css';
import Skeleton from '../components/ui/Skeleton';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Legend
} from 'recharts';

export default function Results() {
  const { id } = useParams();
  const { user } = useAuth();
  const localSession = useMemo(() => user ? getSession(user.email, id) : null, [user, id]);
  const [remote, setRemote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const BACKEND_ENABLED = import.meta.env.VITE_ENABLE_BACKEND === 'true';

  useEffect(() => {
    let active = true;
    async function run() {
      setLoading(true);
      setError('');
      if (!BACKEND_ENABLED) {
        if (active) setLoading(false);
        return;
      }
      try {
        const r = await getResult(id);
        if (active) setRemote(r);
      } catch (e) {
        if (active) setError('Unable to fetch details from backend');
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => { active = false; };
  }, [id, BACKEND_ENABLED]);

  const base = localSession || remote;
  if (!base) return <div className="results"><div className="error">Result not found</div></div>;

  const severity = base.severity || (typeof base.score === 'number'
    ? (base.score <= 9 ? 'Low' : base.score <= 19 ? 'Moderate' : 'High')
    : 'Pending');

  const details = remote?.details || base.details || {
    summary: 'Provisional analysis (offline)',
    stress: base.details?.stress ?? null,
    sleepHours: base.details?.sleepHours ?? null,
    notes: base.details?.notes ?? ''
  };

  return (
    <div className="results">
      {/* Title */}
      <div className="results-title">{base.test} Result</div>

      {/* Meta Info */}
      <div className="results-meta">
        <div className="meta-card">
          <div className="meta-label">Date</div>
          <div className="meta-value">{loading && BACKEND_ENABLED ? <Skeleton width="80%" height={16} /> : new Date(base.date).toLocaleString()}</div>
        </div>
        <div className="meta-card">
          <div className="meta-label">Score</div>
          <div className="meta-value">{loading && BACKEND_ENABLED ? <Skeleton width="60%" height={16} /> : typeof base.score === 'number' ? base.score : 'N/A'}</div>
        </div>
        <div className="meta-card" style={{
          backgroundColor: severity === 'Low' ? '#22c55e' : severity === 'Moderate' ? '#facc15' : '#ef4444',
          color: '#fff'
        }}>
          <div className="meta-label">Severity</div>
          <div className="meta-value">{loading && BACKEND_ENABLED ? <Skeleton width="40%" height={16} /> : severity}</div>
        </div>
      </div>

      {/* Detailed Cards and Charts */}
      <div className="results-body">
        {loading && BACKEND_ENABLED && <div className="muted">Loading details from backend...</div>}
        {error && BACKEND_ENABLED && <div className="error">{error}</div>}
        {!loading && (
          <>
            <div className="muted">{BACKEND_ENABLED ? 'Detailed Report:' : 'Details (offline):'}</div>

            {/* Charts Section */}
            <div className="charts-container">
              {/* Stress & Sleep Bar Chart */}
              <div className="chart-card">
                <div className="chart-title">Stress & Sleep (Hours)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { name: 'Stress', value: details.stress || 0 },
                    { name: 'Sleep', value: details.sleepHours || 0 }
                  ]}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Score/Severity Radial Chart */}
              <div className="chart-card">
                <div className="chart-title">Score / Severity</div>
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="20%"
                    outerRadius="90%"
                    barSize={20}
                    data={[{ name: severity, value: base.score || 0, fill: severity === 'Low' ? '#22c55e' : severity === 'Moderate' ? '#facc15' : '#ef4444' }]}
                  >
                    <RadialBar minAngle={15} background clockWise dataKey="value" />
                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detail Cards */}
            <div className="details-cards">
  {Object.entries(details).map(([key, value]) => {
    const numericValue = Number(value) || 0;

    // Determine color based on metric
    let barColor = '#22c55e'; // green default
    if (key.toLowerCase() === 'stress' && numericValue > 70) barColor = '#ef4444';
    if (key.toLowerCase() === 'stress' && numericValue > 40 && numericValue <= 70) barColor = '#facc15';
    if (key.toLowerCase() === 'screenTime' && numericValue > 5) barColor = '#ef4444';
    if (key.toLowerCase() === 'activity' && numericValue < 3) barColor = '#ef4444';

    // Assign icons for each metric
    const iconMap = {
      stress: '💢',
      sleepHours: '🛌',
      activity: '🏃‍♂️',
      screenTime: '📱',
      notes: '📝'
    };
    const icon = iconMap[key.toLowerCase()] || 'ℹ️';

    return (
      <div className={`detail-card metric-card ${key}`} key={key}>
        <div className="metric-header">
          <span className="metric-icon">{icon}</span>
          <div className="detail-label">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
        </div>
        <div className="detail-value">{value !== null ? value.toString() : 'N/A'}</div>

        {/* Progress bar for numeric metrics */}
        {['stress', 'sleepHours', 'activity', 'screenTime'].includes(key.toLowerCase()) && (
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(numericValue * 10, 100)}%`, backgroundColor: barColor }}
            />
          </div>
        )}
      </div>
    );
  })}
</div>

          </>
        )}
      </div>
    </div>
  );
}
