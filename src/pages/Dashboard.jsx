import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loadSessions } from '../services/storage'
import { Line } from 'react-chartjs-2'
import { useEffect, useRef, useState } from 'react'
import { computeWellnessIndex, scoreTrend, getDashboardInsight } from '../services/gemini'
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import '../styles/dashboard.css'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler)

// Animated counter hook
function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target == null || isNaN(target)) return
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return value
}

function StatCard({ icon, label, value, sub, color, delay = 0 }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0, 900)
  const display = typeof value === 'number' ? animated : (value ?? '—')
  return (
    <div className="stat-card" style={{ animationDelay: `${delay}ms`, '--stat-color': color }}>
      <div className="stat-icon" style={{ background: color + '22', color }}>
        {icon}
      </div>
      <div className="stat-body">
        <div className="stat-value">{display}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  )
}

function DeltaBadge({ value, label, icon }) {
  const isNull = value == null
  const isPos = value > 0
  const isNeg = value < 0
  const cls = isNull ? '' : isPos ? 'delta-up' : isNeg ? 'delta-down' : 'delta-flat'
  const arrow = isNull ? '—' : isPos ? '↑' : isNeg ? '↓' : '→'
  return (
    <div className={`delta-card ${cls}`}>
      <div className="delta-icon">{icon}</div>
      <div className="delta-label">{label}</div>
      <div className="delta-value">
        {arrow} {isNull ? 'N/A' : Math.abs(value)}
      </div>
    </div>
  )
}

function RecItem({ text, index }) {
  const icons = ['💡', '🌙', '🧘', '📊', '💬', '🏃']
  return (
    <div className="rec-item" style={{ animationDelay: `${index * 80}ms` }}>
      <span className="rec-icon">{icons[index % icons.length]}</span>
      <span className="rec-text">{text}</span>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const sessions = user ? loadSessions(user.email) : []
  const assess = sessions.filter(s => s.test === 'Assessment' || s.test?.includes('PHQ') || s.test?.includes('Depression'))
  const labels = assess.map(s => new Date(s.date).toLocaleDateString())
  const dataAssess = assess.map(s => typeof s.score === 'number' ? s.score : null)
  const smoothing = Number(localStorage.getItem('mh_chart_smoothing') || 0.4)

  const last = assess[assess.length - 1]
  const prev = assess[assess.length - 2]
  const scoreDelta = last && prev && typeof last.score === 'number' && typeof prev.score === 'number'
    ? (last.score - prev.score) : null
  const avgScore = assess.length
    ? Math.round(assess.reduce((a, b) => a + (Number(b.score) || 0), 0) / assess.length) : null
  const avgStress = assess.length
    ? Math.round(assess.reduce((a, b) => a + (b.details?.stress || 0), 0) / assess.length) : null
  const avgSleep = assess.length
    ? Math.round(assess.reduce((a, b) => a + (b.details?.sleepHours || 0), 0) / assess.length) : null

  function avgWindow(daysStart, daysEnd) {
    const now = new Date()
    const start = new Date(now); start.setDate(start.getDate() - daysStart)
    const end = new Date(now); end.setDate(end.getDate() - daysEnd)
    const w = assess.filter(s => { const d = new Date(s.date); return d <= start && d > end })
    return {
      avgS: w.length ? Math.round(w.reduce((a, b) => a + (Number(b.score) || 0), 0) / w.length) : null,
      avgStressW: w.length ? Math.round(w.reduce((a, b) => a + (b.details?.stress || 0), 0) / w.length) : null,
      avgSleepW: w.length ? Math.round(w.reduce((a, b) => a + (b.details?.sleepHours || 0), 0) / w.length) : null,
    }
  }
  const last7 = avgWindow(0, 7)
  const prev7 = avgWindow(7, 14)
  const deltas = {
    score: last7.avgS != null && prev7.avgS != null ? last7.avgS - prev7.avgS : null,
    stress: last7.avgStressW != null && prev7.avgStressW != null ? last7.avgStressW - prev7.avgStressW : null,
    sleep: last7.avgSleepW != null && prev7.avgSleepW != null ? last7.avgSleepW - prev7.avgSleepW : null,
  }

  const recs = []
  if (last) {
    const sev = last.severity || (typeof last.score === 'number'
      ? (last.score <= 9 ? 'Low' : last.score <= 19 ? 'Moderate' : 'High') : 'Pending')
    if (sev === 'High') recs.push('Consider reaching out to a professional or helpline')
    if ((last.details?.sleepHours ?? 0) < 6) recs.push('Aim for 7–9 hours of sleep consistently')
    if ((last.details?.stress ?? 0) >= 7) recs.push('Practice stress management techniques daily')
    recs.push('Track trends weekly and review the Overview metrics')
  }

  // Chart colors
  const chartBase = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#7a94b8', font: { size: 12 }, boxWidth: 12, padding: 16 } },
      tooltip: {
        backgroundColor: '#111c33',
        borderColor: '#1e2d4a',
        borderWidth: 1,
        titleColor: '#e5e9f2',
        bodyColor: '#7a94b8',
        padding: 12,
        cornerRadius: 10,
      }
    },
    scales: {
      x: { grid: { color: 'rgba(30,45,74,0.6)' }, ticks: { color: '#7a94b8', font: { size: 11 } } },
      y: { grid: { color: 'rgba(30,45,74,0.6)' }, ticks: { color: '#7a94b8', font: { size: 11 } } }
    },
    elements: { line: { tension: smoothing }, point: { radius: 4, hoverRadius: 6 } }
  }

  const progressChart = {
    labels,
    datasets: [{
      label: 'PHQ-9 Score',
      data: dataAssess,
      borderColor: '#6b8fff',
      borderWidth: 2,
      backgroundColor: (ctx) => {
        const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 280)
        g.addColorStop(0, 'rgba(107,143,255,0.3)')
        g.addColorStop(1, 'rgba(107,143,255,0.02)')
        return g
      },
      fill: true,
      pointBackgroundColor: '#6b8fff',
      pointBorderColor: '#111c33',
      pointBorderWidth: 2,
    }]
  }

  const wellbeingChart = {
    labels,
    datasets: [
      {
        label: 'Stress',
        data: assess.map(s => s.details?.stress ?? null),
        borderColor: '#f87171',
        borderWidth: 2,
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260)
          g.addColorStop(0, 'rgba(248,113,113,0.25)')
          g.addColorStop(1, 'rgba(248,113,113,0.02)')
          return g
        },
        fill: true,
        pointBackgroundColor: '#f87171',
        pointBorderColor: '#111c33',
        pointBorderWidth: 2,
      },
      {
        label: 'Sleep hrs',
        data: assess.map(s => s.details?.sleepHours ?? null),
        borderColor: '#34d399',
        borderWidth: 2,
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260)
          g.addColorStop(0, 'rgba(52,211,153,0.2)')
          g.addColorStop(1, 'rgba(52,211,153,0.02)')
          return g
        },
        fill: true,
        pointBackgroundColor: '#34d399',
        pointBorderColor: '#111c33',
        pointBorderWidth: 2,
      }
    ]
  }

  const lastSeverity = last
    ? (last.severity || (typeof last.score === 'number'
        ? (last.score <= 4 ? 'Minimal' : last.score <= 9 ? 'Low' : last.score <= 14 ? 'Moderate' : last.score <= 19 ? 'High' : 'Severe')
        : 'Pending'))
    : null

  const severityColor = {
    Minimal: '#34d399', Low: '#34d399', Moderate: '#fbbf24', High: '#f87171', Severe: '#f87171', Pending: '#7a94b8'
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  // Wellness Index + trend
  const wellnessIndex = computeWellnessIndex(sessions)
  const trend = scoreTrend(sessions)
  const wiColor = wellnessIndex == null ? '#6b85a8'
    : wellnessIndex >= 70 ? '#22d3a0'
    : wellnessIndex >= 45 ? '#f59e0b'
    : '#f06b6b'
  const trendMeta = {
    improving:    { icon: '📉', label: 'Improving', color: '#22d3a0' },
    worsening:    { icon: '📈', label: 'Worsening', color: '#f06b6b' },
    stable:       { icon: '➡️', label: 'Stable',    color: '#f59e0b' },
    insufficient: { icon: '📊', label: 'Not enough data', color: '#6b85a8' },
  }
  const tm = trendMeta[trend] || trendMeta.insufficient

  // OCD sessions
  const ocdSessions = sessions.filter(s => s.test?.includes('OCD') || s.test?.includes('Y-BOCS'))
  const lastOCD = ocdSessions[ocdSessions.length - 1]

  // AI insight state
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiLoaded, setAiLoaded] = useState(false)

  async function loadAI() {
    if (aiLoaded || aiLoading) return
    setAiLoading(true)
    try {
      const text = await getDashboardInsight(user, sessions)
      setAiInsight(text)
    } catch {
      setAiInsight('Add VITE_GEMINI_KEY to your .env file to enable AI insights.')
    } finally {
      setAiLoading(false)
      setAiLoaded(true)
    }
  }

  return (
    <div className="dashboard">

      {/* ── HERO ── */}
      <div className="dash-hero">
        <div className="dash-hero-left">
          <div className="dash-greeting">{greeting}, <span>{name}</span> 👋</div>
          <div className="dash-subtitle">Here's your mental wellness overview for today.</div>
          <div className="dash-hero-actions">
            <Link className="btn primary" to="/tests">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              Take Assessment
            </Link>
            <Link className="btn" to="/tracking">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17l6-6 4 4 7-7v6h2V5h-9v2h6l-6 6-4-4L1 15z"/></svg>
              View Tracking
            </Link>
            <Link className="btn" to="/history">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8v5h5v-2h-3V8h-2zm0-7C6.48 1 2 5.48 2 11H0l3.89 3.89L8 11H5c0-3.86 3.14-7 7-7s7 3.14 7 7-3.14 7-7 7c-1.93 0-3.68-.78-4.94-2.06l-1.42 1.42C7.54 19.91 9.65 21 12 21c5.52 0 10-4.48 10-10S17.52 1 12 1z"/></svg>
              History
            </Link>
          </div>
        </div>
        {lastSeverity && (
          <div className="dash-status-badge" style={{ '--sev-color': severityColor[lastSeverity] || '#7a94b8' }}>
            <div className="dash-status-ring" />
            <div className="dash-status-inner">
              <div className="dash-status-label">Latest Status</div>
              <div className="dash-status-value">{lastSeverity}</div>
              <div className="dash-status-score">Score: {last?.score ?? '—'}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── STAT CARDS ── */}
      <div className="stat-grid">
        <StatCard icon="📋" label="Total Assessments" value={assess.length} color="#5b8def" delay={0} />
        <StatCard icon="📊" label="Average Score" value={avgScore} sub="PHQ-9 scale" color="#7c5cfc" delay={60} />
        <StatCard icon="😰" label="Avg Stress" value={avgStress} sub="out of 10" color="#f06b6b" delay={120} />
        <StatCard icon="🌙" label="Avg Sleep" value={avgSleep} sub="hours/night" color="#22d3a0" delay={180} />
      </div>

      {/* ── WELLNESS INDEX + TREND ── */}
      <div className="dash-section">
        <div className="dash-section-header">
          <h3>Mental Wellness Index</h3>
          <span className="dash-section-sub">AI-computed composite score from all your data</span>
        </div>
        <div className="wellness-row">
          {/* Index gauge */}
          <div className="wellness-card" style={{ '--wi-color': wiColor }}>
            <div className="wellness-score" style={{ color: wiColor }}>
              {wellnessIndex ?? '—'}
              {wellnessIndex != null && <span className="wellness-unit">/100</span>}
            </div>
            <div className="wellness-bar-track">
              <div className="wellness-bar-fill" style={{ width: (wellnessIndex ?? 0) + '%', background: wiColor }} />
            </div>
            <div className="wellness-label">
              {wellnessIndex == null ? 'Complete assessments to calculate'
                : wellnessIndex >= 70 ? '✅ Good overall wellness'
                : wellnessIndex >= 45 ? '⚠️ Moderate — room to improve'
                : '🔴 Low — consider seeking support'}
            </div>
          </div>

          {/* Trend */}
          <div className="wellness-card trend-card">
            <div className="trend-icon">{tm.icon}</div>
            <div className="trend-label" style={{ color: tm.color }}>{tm.label}</div>
            <div className="wellness-label">Score trend (last 8 sessions)</div>
          </div>

          {/* OCD status */}
          <div className="wellness-card ocd-status-card">
            <div className="ocd-status-icon">🔄</div>
            {lastOCD ? (
              <>
                <div className="ocd-status-score" style={{
                  color: lastOCD.severity === 'Mild' ? '#22d3a0'
                    : lastOCD.severity === 'Moderate' ? '#f59e0b' : '#f06b6b'
                }}>
                  {lastOCD.score}/40
                </div>
                <div className="wellness-label">OCD: {lastOCD.severity}</div>
                <Link to={`/ocd-results/${lastOCD.id}`} className="wellness-link">View result →</Link>
              </>
            ) : (
              <>
                <div className="ocd-status-score" style={{ color: '#6b85a8' }}>—</div>
                <div className="wellness-label">No OCD assessment yet</div>
                <Link to="/ocd" className="wellness-link">Take Y-BOCS →</Link>
              </>
            )}
          </div>

          {/* AI insight trigger */}
          <div className="wellness-card ai-trigger-card">
            <div className="ai-trigger-icon">🤖</div>
            {!aiLoaded && !aiLoading && (
              <button className="ai-trigger-btn" onClick={loadAI}>
                Get AI Insight
              </button>
            )}
            {aiLoading && (
              <div className="ai-trigger-loading">
                <div className="ai-mini-spinner" />
                Analyzing…
              </div>
            )}
            {aiLoaded && (
              <p className="ai-trigger-text">{aiInsight}</p>
            )}
            <Link to="/ai" className="wellness-link">Full AI Chat →</Link>
          </div>
        </div>
      </div>

      {/* ── WEEK OVER WEEK ── */}
      <div className="dash-section">
        <div className="dash-section-header">
          <h3>Week over Week</h3>
          <span className="dash-section-sub">Compared to previous 7 days</span>
        </div>
        <div className="delta-grid">
          <DeltaBadge value={deltas.score} label="PHQ-9 Score" icon="📈" />
          <DeltaBadge value={deltas.stress} label="Stress Level" icon="😰" />
          <DeltaBadge value={deltas.sleep} label="Sleep Hours" icon="🌙" />
        </div>
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="charts-row">
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">
              <span className="dash-card-dot" style={{ background: '#5b8def' }} />
              PHQ-9 Progress Over Time
            </div>
          </div>
          <div className="chart-area">
            {assess.length === 0
              ? <div className="chart-empty"><span>📭</span><p>No assessment data yet</p><Link to="/tests" className="btn primary">Take your first test</Link></div>
              : <Line data={progressChart} options={chartBase} />
            }
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">
              <span className="dash-card-dot" style={{ background: '#22d3a0' }} />
              Stress vs Sleep
            </div>
          </div>
          <div className="chart-area">
            {assess.length === 0
              ? <div className="chart-empty"><span>📭</span><p>No data yet</p></div>
              : <Line data={wellbeingChart} options={chartBase} />
            }
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW ── */}
      <div className="bottom-row">

        {/* Latest Results */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">
              <span className="dash-card-dot" style={{ background: '#fbbf24' }} />
              Latest Results
            </div>
            <Link to="/history" className="dash-card-link">View all →</Link>
          </div>
          {sessions.length === 0
            ? <div className="empty-state"><span>🗂️</span><p>No results yet. Take a test to get started.</p></div>
            : <div className="results-list">
                {sessions.slice(-4).reverse().map(s => {
                  const sev = (s.severity || '').toLowerCase()
                  const sevColor = sev === 'low' || sev === 'minimal' ? '#22d3a0'
                    : sev === 'moderate' ? '#f59e0b'
                    : sev === 'high' || sev === 'severe' || sev === 'extreme' ? '#f06b6b'
                    : '#6b85a8'
                  const isOCD = s.test?.includes('OCD') || s.test?.includes('Y-BOCS')
                  return (
                    <Link
                      className="result-row"
                      to={isOCD ? `/ocd-results/${s.id}` : `/results/${s.id}`}
                      key={s.id}
                    >
                      <div className="result-type">{s.test}</div>
                      <div className="result-date">{new Date(s.date).toLocaleDateString()}</div>
                      <div className="result-score">{s.score}</div>
                      <div className="result-sev" style={{ color: sevColor, background: sevColor + '18' }}>
                        {s.severity || 'Pending'}
                      </div>
                    </Link>
                  )
                })}
              </div>
          }
        </div>

        {/* Recommendations */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">
              <span className="dash-card-dot" style={{ background: '#7c5cfc' }} />
              Recommendations
            </div>
          </div>
          {recs.length === 0
            ? <div className="empty-state"><span>✨</span><p>Complete an assessment to get personalized recommendations.</p></div>
            : <div className="recs-list">
                {recs.map((r, i) => <RecItem key={i} text={r} index={i} />)}
              </div>
          }
        </div>

        {/* Quick Links */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div className="dash-card-title">
              <span className="dash-card-dot" style={{ background: '#22d3a0' }} />
              Quick Access
            </div>
          </div>
          <div className="quick-links">
            <Link to="/tests" className="quick-link-item" style={{ '--ql-color': '#5b8def' }}>
              <div className="ql-icon">🧠</div>
              <div className="ql-body"><div className="ql-title">PHQ-9 Assessment</div><div className="ql-sub">Depression screening</div></div>
              <div className="ql-arrow">→</div>
            </Link>
            <Link to="/ocd" className="quick-link-item" style={{ '--ql-color': '#f59e0b' }}>
              <div className="ql-icon">🔄</div>
              <div className="ql-body"><div className="ql-title">OCD Assessment</div><div className="ql-sub">Y-BOCS scale</div></div>
              <div className="ql-arrow">→</div>
            </Link>
            <Link to="/ai" className="quick-link-item" style={{ '--ql-color': '#a78bfa' }}>
              <div className="ql-icon">🤖</div>
              <div className="ql-body"><div className="ql-title">AI Insights</div><div className="ql-sub">Chat with AI assistant</div></div>
              <div className="ql-arrow">→</div>
            </Link>
            <Link to="/report" className="quick-link-item" style={{ '--ql-color': '#22d3a0' }}>
              <div className="ql-icon">📄</div>
              <div className="ql-body"><div className="ql-title">Report</div><div className="ql-sub">Printable summary</div></div>
              <div className="ql-arrow">→</div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
