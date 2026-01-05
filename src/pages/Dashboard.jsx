import { Link } from 'react-router-dom'
import Card from '../components/Card'
import { useAuth } from '../context/AuthContext'
import { loadSessions } from '../services/storage'
import { Line } from 'react-chartjs-2'
import StatNumber from '../components/ui/StatNumber'
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js'
import '../styles/dashboard.css'

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend)

export default function Dashboard() {
  const { user } = useAuth()
  const sessions = user ? loadSessions(user.email) : []
  const latest = sessions.slice(-3).reverse()
  const assess = sessions.filter(s => s.test === 'Assessment')
  const labels = assess.map(s => new Date(s.date).toLocaleDateString())
  const dataAssess = assess.map(s => typeof s.score === 'number' ? s.score : null)
  const smoothing = Number(localStorage.getItem('mh_chart_smoothing') || 0.35)
  const last = assess[assess.length - 1]
  const prev = assess[assess.length - 2]
  const trend = last && prev && typeof last.score === 'number' && typeof prev.score === 'number' ? (last.score - prev.score) : null
  const avgScore = assess.length ? Math.round(assess.reduce((a, b) => a + (Number(b.score) || 0), 0) / assess.length) : null
  const avgStress = assess.length ? Math.round(assess.reduce((a, b) => a + (b.details?.stress || 0), 0) / assess.length) : null
  const avgSleep = assess.length ? Math.round(assess.reduce((a, b) => a + (b.details?.sleepHours || 0), 0) / assess.length) : null
  const sparkScores = assess.slice(-6).map(s => typeof s.score === 'number' ? s.score : null)
  function avgWindow(daysStart, daysEnd) {
    const now = new Date()
    const start = new Date(now); start.setDate(start.getDate() - daysStart)
    const end = new Date(now); end.setDate(end.getDate() - daysEnd)
    const window = assess.filter(s => {
      const d = new Date(s.date)
      return d <= start && d > end
    })
    const avgS = window.length ? Math.round(window.reduce((a, b) => a + (Number(b.score) || 0), 0) / window.length) : null
    const avgStressW = window.length ? Math.round(window.reduce((a, b) => a + (b.details?.stress || 0), 0) / window.length) : null
    const avgSleepW = window.length ? Math.round(window.reduce((a, b) => a + (b.details?.sleepHours || 0), 0) / window.length) : null
    return { avgS, avgStressW, avgSleepW }
  }
  const last7 = avgWindow(0, 7)
  const prev7 = avgWindow(7, 14)
  const deltas = {
    score: last7.avgS != null && prev7.avgS != null ? last7.avgS - prev7.avgS : null,
    stress: last7.avgStressW != null && prev7.avgStressW != null ? last7.avgStressW - prev7.avgStressW : null,
    sleep: last7.avgSleepW != null && prev7.avgSleepW != null ? last7.avgSleepW - prev7.avgSleepW : null
  }
  const recs = []
  if (last) {
    const sev = last.severity || (typeof last.score === 'number' ? (last.score <= 9 ? 'Low' : last.score <= 19 ? 'Moderate' : 'High') : 'Pending')
    if (sev === 'High') recs.push('Consider reaching out to a professional or helpline')
    if ((last.details?.sleepHours ?? 0) < 6) recs.push('Aim for 7–9 hours of sleep consistently')
    if ((last.details?.stress ?? 0) >= 7) recs.push('Practice stress management techniques daily')
    recs.push('Track trends weekly and review the Overview metrics')
  }
  const eventRadiusMain = assess.map(s => {
    const n = (s.details?.notes || '').trim()
    const mark = n.length > 0 || (s.details?.activity || 0) >= 8 || (s.details?.caffeine || 0) >= 6 || (s.details?.screenTime || 0) >= 8
    return mark ? 6 : 3
  })
  const eventColorMain = assess.map(s => {
    const n = (s.details?.notes || '').trim()
    return n.length > 0 ? '#00d4ff' : '#7c4dff'
  })
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
    elements: { line: { tension: smoothing }, point: { radius: 3 } }
  }
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Assessment',
        data: dataAssess,
        borderColor: '#6b5bff',
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 240)
          g.addColorStop(0, 'rgba(107,91,255,0.35)')
          g.addColorStop(1, 'rgba(107,91,255,0.05)')
          return g
        },
        fill: true,
        pointRadius: eventRadiusMain,
        pointBackgroundColor: eventColorMain
      }
    ]
  }
  return (
    <div className="grid">
      <Card title={`Welcome ${user?.displayName || ''}`}>
        <div className="welcome">
          <div>
            <div className="muted">Track your mental health with clinically validated scales</div>
            <div className="actions">
              <Link className="btn primary" to="/tests">Take a test</Link>
              <Link className="btn" to="/tracking">View tracking</Link>
            </div>
          </div>
        </div>
      </Card>
      <Card title="Insights (Week over Week)">
        <div className="list" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <div className="quick-item">
            <div className="pill">Score Δ</div>
            <div className="score">{deltas.score == null ? 'N/A' : (deltas.score > 0 ? '+' + deltas.score : deltas.score)}</div>
          </div>
          <div className="quick-item">
            <div className="pill">Stress Δ</div>
            <div className="score">{deltas.stress == null ? 'N/A' : (deltas.stress > 0 ? '+' + deltas.stress : deltas.stress)}</div>
          </div>
          <div className="quick-item">
            <div className="pill">Sleep Δ</div>
            <div className="score">{deltas.sleep == null ? 'N/A' : (deltas.sleep > 0 ? '+' + deltas.sleep : deltas.sleep)}</div>
          </div>
        </div>
      </Card>
      <Card title="Overview">
        <div className="list" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
          <div className="quick-item">
            <div className="pill">Total assessments</div>
            <StatNumber value={assess.length} />
          </div>
          <div className="quick-item">
            <div className="pill">Average score</div>
            <StatNumber value={avgScore ?? 0} />
          </div>
          <div className="quick-item">
            <div className="pill">Trend vs last</div>
            <div className="score">{trend === null ? 'N/A' : (trend > 0 ? '+' + trend : trend)}</div>
          </div>
          <div className="quick-item">
            <div className="pill">Stress / Sleep</div>
            <div className="score">{avgStress ?? 'N/A'} / {avgSleep ?? 'N/A'}</div>
          </div>
        </div>
        <div className="chart-wrap" style={{ minHeight: 120 }}>
          {sparkScores.length === 0 ? <div className="muted">No recent trend</div> : (
            <Line
              data={{
                labels: sparkScores.map((_, i) => `-${sparkScores.length - i}`),
                datasets: [{
                  label: 'Recent trend',
                  data: sparkScores,
                  borderColor: '#7c4dff',
                  backgroundColor: (ctx) => {
                    const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 120)
                    g.addColorStop(0, 'rgba(124,77,255,0.35)')
                    g.addColorStop(1, 'rgba(124,77,255,0.08)')
                    return g
                  },
                  fill: true
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } },
                elements: { line: { tension: smoothing }, point: { radius: 0 } }
              }}
            />
          )}
        </div>
      </Card>
      <Card title="Latest results">
        <div className="list">
          {latest.length === 0 && <div className="muted">No results yet</div>}
          {latest.map(s => (
            <Link className="list-item" to={`/results/${s.id}`} key={s.id}>
              <div className="pill">{s.test}</div>
              <div>{new Date(s.date).toLocaleString()}</div>
              <div className="score">{s.score}</div>
              <div className={`severity ${((s.severity || '').toLowerCase())}`}>{s.severity || 'Pending'}</div>
            </Link>
          ))}
        </div>
      </Card>
      <Card title="Progress">
        <div className="chart-wrap">
          {sessions.length === 0 ? <div className="muted">No data to chart</div> : <Line data={chartData} options={chartOptions} />}
        </div>
      </Card>
      <Card title="Recommendations">
        <div className="list">
          {recs.length === 0 && <div className="muted">No recommendations yet</div>}
          {recs.map((r, i) => (
            <div className="list-item" key={i} style={{ gridTemplateColumns: '1fr' }}>
              <div>{r}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Wellbeing (Stress vs Sleep)">
        <div className="chart-wrap">
          {assess.length === 0 ? <div className="muted">No data</div> : (
            <Line
              data={{
                labels,
                datasets: [
                  {
                    label: 'Stress',
                    data: assess.map(s => s.details?.stress ?? null),
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
                    data: assess.map(s => s.details?.sleepHours ?? null),
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
              }}
              options={chartOptions}
            />
          )}
        </div>
      </Card>
      <Card title="Quick links">
        <div className="quick">
          <Link to="/tests" className="quick-item">
            <div className="pill">Assessment</div>
            <div>Interactive questions</div>
          </Link>
          <Link to="/report" className="quick-item">
            <div className="pill">Report</div>
            <div>Printable summary with charts</div>
          </Link>
        </div>
      </Card>
    </div>
  )
}
