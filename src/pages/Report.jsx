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
import '../styles/report.css'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend)

export default function Report() {
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState('30d')
  const sessions = useMemo(() => user ? loadSessions(user.email).filter(s => s.test === 'Assessment') : [], [user])
  const filtered = useMemo(() => {
    if (dateRange === 'all') return sessions
    const now = new Date()
    const cutoff = new Date(now)
    if (dateRange === '7d') cutoff.setDate(cutoff.getDate() - 7)
    if (dateRange === '30d') cutoff.setDate(cutoff.getDate() - 30)
    if (dateRange === '90d') cutoff.setDate(cutoff.getDate() - 90)
    return sessions.filter(s => new Date(s.date) >= cutoff)
  }, [sessions, dateRange])
  const labels = filtered.map(s => new Date(s.date).toLocaleDateString())
  const scores = filtered.map(s => typeof s.score === 'number' ? s.score : null)
  const smoothing = Number(localStorage.getItem('mh_chart_smoothing') || 0.35)
  const css = typeof window !== 'undefined' ? getComputedStyle(document.body) : null
  const textColor = css ? (css.getPropertyValue('--text').trim() || '#e6eaf2') : '#e6eaf2'
  const mutedColor = css ? (css.getPropertyValue('--muted').trim() || '#8b94a7') : '#8b94a7'
  const borderColor = css ? (css.getPropertyValue('--border').trim() || 'rgba(34,42,54,0.3)') : 'rgba(34,42,54,0.3)'
  const panelColor = css ? (css.getPropertyValue('--panel').trim() || '#151a22') : '#151a22'
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: textColor } },
      tooltip: { mode: 'index', intersect: false, backgroundColor: panelColor, borderColor, borderWidth: 1, titleColor: textColor, bodyColor: textColor }
    },
    scales: { x: { grid: { color: borderColor }, ticks: { color: mutedColor } }, y: { grid: { color: borderColor }, ticks: { color: mutedColor } } },
    elements: { line: { tension: smoothing }, point: { radius: 3 } }
  }
  function printReport() {
    const canvases = Array.from(document.querySelectorAll('.report .chart-wrap canvas'))
    const replacements = []
    canvases.forEach(c => {
      try {
        const img = new Image()
        img.src = c.toDataURL('image/png')
        img.style.width = '100%'
        img.style.height = 'auto'
        img.style.display = 'block'
        c.parentNode.insertBefore(img, c)
        c.style.display = 'none'
        replacements.push({ canvas: c, img })
      } catch {}
    })
    function clean() {
      replacements.forEach(({ canvas, img }) => {
        img.remove()
        canvas.style.display = ''
      })
    }
    function onAfterPrint() {
      clean()
      window.removeEventListener('afterprint', onAfterPrint)
    }
    window.addEventListener('afterprint', onAfterPrint)
    setTimeout(() => {
      window.print()
      setTimeout(() => clean(), 1000)
    }, 250)
  }
  const dataScore = {
    labels,
    datasets: [{
      label: 'Score',
      data: scores,
      borderColor: '#7c4dff',
      backgroundColor: (ctx) => {
        const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 240)
        g.addColorStop(0, 'rgba(124,77,255,0.35)')
        g.addColorStop(1, 'rgba(124,77,255,0.05)')
        return g
      },
      fill: true
    }]
  }
  const dataWellbeing = {
    labels,
    datasets: [
      {
        label: 'Stress',
        data: filtered.map(s => s.details?.stress ?? null),
        borderColor: '#00b894',
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 240)
          g.addColorStop(0, 'rgba(0,184,148,0.35)')
          g.addColorStop(1, 'rgba(0,184,148,0.05)')
          return g
        },
        fill: true
      },
      {
        label: 'Sleep hours',
        data: filtered.map(s => s.details?.sleepHours ?? null),
        borderColor: '#e17055',
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 240)
          g.addColorStop(0, 'rgba(225,112,85,0.35)')
          g.addColorStop(1, 'rgba(225,112,85,0.05)')
          return g
        },
        fill: true
      }
    ]
  }
  const avgScore = filtered.length ? Math.round(filtered.reduce((a, b) => a + (Number(b.score) || 0), 0) / filtered.length) : null
  const avgStress = filtered.length ? Math.round(filtered.reduce((a, b) => a + (b.details?.stress || 0), 0) / filtered.length) : null
  const avgSleep = filtered.length ? Math.round(filtered.reduce((a, b) => a + (b.details?.sleepHours || 0), 0) / filtered.length) : null
  return (
    <div className="report">
      <div className="report-title">Report</div>
      <div className="report-controls">
        <label>Date Range</label>
        <select value={dateRange} onChange={e => setDateRange(e.target.value)}>
          <option value="7d">7d</option>
          <option value="30d">30d</option>
          <option value="90d">90d</option>
          <option value="all">All</option>
        </select>
        <button className="btn primary" onClick={printReport}>Print PDF</button>
      </div>
      <div className="report-grid">
        <div className="report-card">
          <div className="report-card-title">Summary</div>
          <div className="list" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            <div className="quick-item">
              <div className="pill">Average score</div>
              <div className="score">{avgScore ?? 'N/A'}</div>
            </div>
            <div className="quick-item">
              <div className="pill">Average stress</div>
              <div className="score">{avgStress ?? 'N/A'}</div>
            </div>
            <div className="quick-item">
              <div className="pill">Average sleep</div>
              <div className="score">{avgSleep ?? 'N/A'}</div>
            </div>
          </div>
        </div>
        <div className="report-card">
          <div className="report-card-title">Score Trend</div>
          <div className="chart-wrap" style={{ minHeight: 240 }}>
            {filtered.length === 0 ? <div className="muted">No data</div> : <Line data={dataScore} options={options} />}
          </div>
        </div>
        <div className="report-card">
          <div className="report-card-title">Wellbeing</div>
          <div className="chart-wrap" style={{ minHeight: 240 }}>
            {filtered.length === 0 ? <div className="muted">No data</div> : <Line data={dataWellbeing} options={options} />}
          </div>
        </div>
      </div>
    </div>
  )
}
