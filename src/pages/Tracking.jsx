import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { loadSessions } from '../services/storage'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, LineElement, CategoryScale,
  LinearScale, PointElement, Tooltip, Legend, Filler
} from 'chart.js'
import '../styles/tracking.css'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler)

const DATASETS = [
  { key: 'all',        label: 'All Tests',       color: '#5b8def' },
  { key: 'phq',        label: 'PHQ-9 (Depression)', color: '#7c5cfc' },
  { key: 'ocd',        label: 'OCD (Y-BOCS)',    color: '#f59e0b' },
]

function matchDataset(s, key) {
  if (key === 'all') return true
  if (key === 'ocd') return s.test?.includes('OCD') || s.test?.includes('Y-BOCS')
  if (key === 'phq') return !s.test?.includes('OCD') && !s.test?.includes('Y-BOCS')
  return true
}

export default function Tracking() {
  const { user } = useAuth()
  const [dataset, setDataset] = useState('all')
  const [dateRange, setDateRange] = useState('30d')
  const [chartType, setChartType] = useState('area')

  const allSessions = useMemo(() =>
    user ? loadSessions(user.email).filter(s => matchDataset(s, dataset)) : [],
    [user, dataset]
  )

  const filtered = useMemo(() => {
    if (dateRange === 'all') return allSessions
    const now = new Date()
    const cutoff = new Date(now)
    if (dateRange === '7d')  cutoff.setDate(cutoff.getDate() - 7)
    if (dateRange === '30d') cutoff.setDate(cutoff.getDate() - 30)
    if (dateRange === '90d') cutoff.setDate(cutoff.getDate() - 90)
    return allSessions.filter(s => new Date(s.date) >= cutoff)
  }, [allSessions, dateRange])

  const labels = filtered.map(s => new Date(s.date).toLocaleDateString())
  const scores = filtered.map(s => typeof s.score === 'number' ? s.score : null)
  const ds = DATASETS.find(d => d.key === dataset) || DATASETS[0]

  const eventRadius = filtered.map(s => {
    const n = (s.details?.notes || '').trim()
    return n.length > 0 || (s.details?.activity || 0) >= 8 ? 7 : 4
  })
  const eventColor = filtered.map(s =>
    (s.details?.notes || '').trim().length > 0 ? '#22d3a0' : ds.color
  )

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#7a94b8', font: { size: 12 }, boxWidth: 12 } },
      tooltip: {
        backgroundColor: '#0e1c30',
        borderColor: '#1e3358',
        borderWidth: 1,
        titleColor: '#e8edf5',
        bodyColor: '#7a94b8',
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          afterBody: (items) => {
            const s = filtered[items[0]?.dataIndex]
            if (!s) return []
            const lines = []
            if (s.details?.stress != null)     lines.push(`Stress: ${s.details.stress}/10`)
            if (s.details?.sleepHours != null)  lines.push(`Sleep: ${s.details.sleepHours}h`)
            if (s.details?.notes)               lines.push(`Note: ${s.details.notes.slice(0, 40)}`)
            return lines
          }
        }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(30,51,88,.6)' }, ticks: { color: '#6b85a8', font: { size: 11 } } },
      y: { grid: { color: 'rgba(30,51,88,.6)' }, ticks: { color: '#6b85a8', font: { size: 11 } } }
    },
    elements: {
      line: { tension: Number(localStorage.getItem('mh_chart_smoothing') || 0.4) },
      point: { radius: eventRadius, hoverRadius: 8 }
    }
  }

  const chartData = {
    labels,
    datasets: [{
      label: ds.label,
      data: scores,
      borderColor: ds.color,
      borderWidth: 2,
      backgroundColor: chartType === 'area'
        ? (ctx) => {
            const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 280)
            g.addColorStop(0, ds.color + '44')
            g.addColorStop(1, ds.color + '05')
            return g
          }
        : 'transparent',
      fill: chartType === 'area',
      pointRadius: eventRadius,
      pointBackgroundColor: eventColor,
      pointBorderColor: '#0e1c30',
      pointBorderWidth: 2,
    }]
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `soulsync_${dataset}_${dateRange}.json`; a.click()
    URL.revokeObjectURL(a.href)
  }

  function exportCSV() {
    const header = ['id','date','test','score','severity','stress','sleepHours','activity','screenTime','caffeine','notes']
    const rows = filtered.map(s => [
      s.id, s.date, s.test, s.score ?? '', s.severity ?? '',
      s.details?.stress ?? '', s.details?.sleepHours ?? '',
      s.details?.activity ?? '', s.details?.screenTime ?? '',
      s.details?.caffeine ?? '', s.details?.notes ?? ''
    ])
    const csv = [header, ...rows].map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `soulsync_${dataset}_${dateRange}.csv`; a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="tracking">
      <div className="tracking-title">Tracking</div>

      <div className="controls">
        <div className="control">
          <label>Dataset</label>
          <select value={dataset} onChange={e => setDataset(e.target.value)}>
            {DATASETS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
          </select>
        </div>
        <div className="control">
          <label>Date Range</label>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
        <div className="control">
          <label>Chart Type</label>
          <select value={chartType} onChange={e => setChartType(e.target.value)}>
            <option value="area">Area</option>
            <option value="line">Line</option>
          </select>
        </div>
        <div className="control-actions">
          <button className="btn" onClick={exportJSON}>⬇ JSON</button>
          <button className="btn" onClick={exportCSV}>⬇ CSV</button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="tracking-stats">
        <div className="ts-item">
          <span className="ts-label">Sessions</span>
          <span className="ts-val">{filtered.length}</span>
        </div>
        <div className="ts-item">
          <span className="ts-label">Avg Score</span>
          <span className="ts-val">
            {filtered.length ? Math.round(filtered.reduce((a,b) => a + (b.score||0), 0) / filtered.length) : '—'}
          </span>
        </div>
        <div className="ts-item">
          <span className="ts-label">Min Score</span>
          <span className="ts-val" style={{ color: '#22d3a0' }}>
            {filtered.length ? Math.min(...filtered.map(s => s.score ?? 99)) : '—'}
          </span>
        </div>
        <div className="ts-item">
          <span className="ts-label">Max Score</span>
          <span className="ts-val" style={{ color: '#f06b6b' }}>
            {filtered.length ? Math.max(...filtered.map(s => s.score ?? 0)) : '—'}
          </span>
        </div>
        <div className="ts-item">
          <span className="ts-label">🟢 Event markers</span>
          <span className="ts-val" style={{ fontSize: 11, color: '#6b85a8' }}>= sessions with notes</span>
        </div>
      </div>

      <div className="chart-wrap">
        {filtered.length === 0
          ? <div className="muted" style={{ textAlign:'center', padding:40 }}>No data for this range</div>
          : <Line data={chartData} options={chartOptions} />
        }
      </div>
    </div>
  )
}
