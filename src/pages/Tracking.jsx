import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { loadSessions } from '../services/storage'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js'
import '../styles/tracking.css'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend)

const TESTS = ['Assessment']

export default function Tracking() {
  const { user } = useAuth()
  const [test, setTest] = useState(TESTS[0])
  const [dateRange, setDateRange] = useState('30d')
  const [chartType, setChartType] = useState('area')
  const allSessions = useMemo(() => user ? loadSessions(user.email).filter(s => s.test === test) : [], [user, test])
  const filtered = useMemo(() => {
    if (dateRange === 'all') return allSessions
    const now = new Date()
    const cutoff = new Date(now)
    if (dateRange === '7d') cutoff.setDate(cutoff.getDate() - 7)
    if (dateRange === '30d') cutoff.setDate(cutoff.getDate() - 30)
    if (dateRange === '90d') cutoff.setDate(cutoff.getDate() - 90)
    return allSessions.filter(s => new Date(s.date) >= cutoff)
  }, [allSessions, dateRange])
  const labels = filtered.map(s => new Date(s.date).toLocaleDateString())
  const data = filtered.map(s => typeof s.score === 'number' ? s.score : null)
  const eventRadius = filtered.map(s => {
    const n = (s.details?.notes || '').trim()
    const mark = n.length > 0 || (s.details?.activity || 0) >= 8 || (s.details?.caffeine || 0) >= 6 || (s.details?.screenTime || 0) >= 8
    return mark ? 6 : 3
  })
  const eventColor = filtered.map(s => {
    const n = (s.details?.notes || '').trim()
    return n.length > 0 ? '#00d4ff' : '#7c4dff'
  })
  const colorMap = { 'Assessment': '#6b5bff' }
  const baseColor = colorMap[test]
  const css = typeof window !== 'undefined' ? getComputedStyle(document.body) : null
  const textColor = css ? (css.getPropertyValue('--text').trim() || '#e6eaf2') : '#e6eaf2'
  const mutedColor = css ? (css.getPropertyValue('--muted').trim() || '#8b94a7') : '#8b94a7'
  const borderColor = css ? (css.getPropertyValue('--border').trim() || 'rgba(34,42,54,0.3)') : 'rgba(34,42,54,0.3)'
  const panelColor = css ? (css.getPropertyValue('--panel').trim() || '#151a22') : '#151a22'
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: textColor } },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: panelColor,
        borderColor: borderColor,
        borderWidth: 1,
        titleColor: textColor,
        bodyColor: textColor
      }
    },
    scales: {
      x: { grid: { color: borderColor }, ticks: { color: mutedColor } },
      y: { grid: { color: borderColor }, ticks: { color: mutedColor } }
    },
    elements: { line: { tension: Number(localStorage.getItem('mh_chart_smoothing') || 0.35) }, point: { radius: 3, hoverRadius: 5 } }
  }
  const chartData = {
    labels,
    datasets: [{
      label: test,
      data,
      borderColor: baseColor,
      backgroundColor: chartType === 'area'
        ? (ctx) => {
            const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 240)
            g.addColorStop(0, 'rgba(107,91,255,0.35)')
            g.addColorStop(1, 'rgba(107,91,255,0.05)')
            return g
          }
        : 'transparent',
      fill: chartType === 'area',
      pointRadius: eventRadius,
      pointBackgroundColor: eventColor
    }]
  }
  return (
    <div className="tracking">
      <div className="tracking-title">Tracking</div>
      <div className="controls">
        <div className="control">
          <label>Dataset</label>
          <select value={test} onChange={e => setTest(e.target.value)}>
            {TESTS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="control">
          <label>Date Range</label>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}>
            <option value="7d">7d</option>
            <option value="30d">30d</option>
            <option value="90d">90d</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="control">
          <label>Chart Type</label>
          <select value={chartType} onChange={e => setChartType(e.target.value)}>
            <option value="line">Line</option>
            <option value="area">Area</option>
          </select>
        </div>
        
      </div>
      <div className="actions-row">
        <button className="btn" onClick={() => {
          const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' })
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = `sessions_${dateRange}.json`
          a.click()
          URL.revokeObjectURL(a.href)
        }}>Export JSON</button>
        <button className="btn" onClick={() => {
          const header = ['id','date','test','score','severity','stress','sleepHours','activity','screenTime','caffeine']
          const rows = filtered.map(s => [
            s.id,
            s.date,
            s.test,
            s.score ?? '',
            s.severity ?? '',
            s.details?.stress ?? '',
            s.details?.sleepHours ?? '',
            s.details?.activity ?? '',
            s.details?.screenTime ?? '',
            s.details?.caffeine ?? ''
          ])
          const csv = [header, ...rows].map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n')
          const blob = new Blob([csv], { type: 'text/csv' })
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = `sessions_${dateRange}.csv`
          a.click()
          URL.revokeObjectURL(a.href)
        }}>Export CSV</button>
      </div>
      <div className="chart-wrap">
        {filtered.length === 0 ? <div className="muted">No data</div> : <Line data={chartData} options={chartOptions} />}
      </div>
    </div>
  )
}
