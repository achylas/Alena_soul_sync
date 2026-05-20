import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSession } from '../services/storage'
import { getOCDInsight } from '../services/gemini'
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts'
import '../styles/ocd-results.css'

const SEVERITY_META = {
  Mild:     { color: '#22d3a0', bg: 'rgba(34,211,160,.12)',  icon: '🟢', desc: 'Subclinical to mild OCD symptoms' },
  Moderate: { color: '#f59e0b', bg: 'rgba(245,158,11,.12)',  icon: '🟡', desc: 'Moderate OCD symptoms present' },
  Severe:   { color: '#f06b6b', bg: 'rgba(240,107,107,.12)', icon: '🔴', desc: 'Severe OCD symptoms — professional help recommended' },
  Extreme:  { color: '#dc2626', bg: 'rgba(220,38,38,.14)',   icon: '🚨', desc: 'Extreme OCD symptoms — urgent professional support advised' },
}

const OCD_QUESTIONS_SHORT = [
  'Time on obsessions', 'Interference (obs)', 'Distress (obs)',
  'Resistance (obs)', 'Control (obs)',
  'Time on compulsions', 'Interference (comp)', 'Distress (comp)',
  'Resistance (comp)', 'Control (comp)',
]

export default function OCDResults() {
  const { id } = useParams()
  const { user } = useAuth()
  const [session, setSession] = useState(null)
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    if (user) {
      const s = getSession(user.email, id)
      setSession(s)
      if (s) fetchAI(s)
    }
  }, [user, id])

  async function fetchAI(s) {
    setAiLoading(true)
    setAiError('')
    try {
      const insight = await getOCDInsight(
        s.score,
        s.details?.obsessionScore,
        s.details?.compulsionScore,
        s.severity,
        s.answers
      )
      setAiInsight(insight)
    } catch (e) {
      setAiError(e.message?.includes('No Gemini')
        ? 'Add VITE_GEMINI_KEY to .env to enable AI insights.'
        : 'AI insight unavailable right now.')
    } finally {
      setAiLoading(false)
    }
  }

  if (!session) return (
    <div className="ocd-results">
      <div className="ocd-res-error">Result not found. <Link to="/ocd">Take the assessment</Link></div>
    </div>
  )

  const { score, severity, details, answers, date } = session
  const meta = SEVERITY_META[severity] || SEVERITY_META.Moderate
  const obsScore  = details?.obsessionScore  ?? 0
  const compScore = details?.compulsionScore ?? 0

  const radialData = [
    { name: 'Compulsions', value: compScore, fill: '#f06b6b' },
    { name: 'Obsessions',  value: obsScore,  fill: '#5b8def' },
    { name: 'Total',       value: score,     fill: meta.color },
  ]

  return (
    <div className="ocd-results">

      {/* Title */}
      <div className="ocd-res-header">
        <div className="ocd-res-badge">Y-BOCS Result</div>
        <h1 className="ocd-res-title">OCD Assessment Complete</h1>
        <p className="ocd-res-date">{new Date(date).toLocaleString()}</p>
      </div>

      {/* Severity hero */}
      <div className="ocd-severity-hero" style={{ background: meta.bg, borderColor: meta.color + '44' }}>
        <div className="ocd-sev-icon">{meta.icon}</div>
        <div className="ocd-sev-body">
          <div className="ocd-sev-label">Overall Severity</div>
          <div className="ocd-sev-value" style={{ color: meta.color }}>{severity}</div>
          <div className="ocd-sev-desc">{meta.desc}</div>
        </div>
        <div className="ocd-sev-score">
          <div className="ocd-sev-num" style={{ color: meta.color }}>{score}</div>
          <div className="ocd-sev-denom">/40</div>
        </div>
      </div>

      {/* ML Detection result */}
      {details?.ocd_detected !== undefined && (
        <div className="ocd-ml-row">
          <div className={`ocd-detect-card ${details.ocd_detected ? 'detected' : 'not-detected'}`}>
            <div className="ocd-detect-icon">{details.ocd_detected ? '🔴' : '🟢'}</div>
            <div className="ocd-detect-body">
              <div className="ocd-detect-title">
                {details.ocd_detected ? 'OCD Indicators Detected' : 'No Clinical OCD Indicators'}
              </div>
              <div className="ocd-detect-sub">
                ML Model Confidence: <strong>{details.ocd_confidence}%</strong>
                {details.model_source === 'rule_based' && (
                  <span className="ocd-detect-badge">Rule-based</span>
                )}
                {details.model_source === 'ml_model' && (
                  <span className="ocd-detect-badge ml">ML Model</span>
                )}
              </div>
            </div>
          </div>

          {/* Severity probability bars */}
          {details.severity_probabilities && (
            <div className="ocd-prob-card">
              <div className="ocd-prob-title">Severity Probability Distribution</div>
              {Object.entries(details.severity_probabilities)
                .sort((a, b) => {
                  const order = ['Subclinical','Mild','Moderate','Severe','Extreme']
                  return order.indexOf(a[0]) - order.indexOf(b[0])
                })
                .map(([label, pct]) => {
                  const barColor = label === 'Subclinical' || label === 'Mild' ? '#22d3a0'
                    : label === 'Moderate' ? '#f59e0b'
                    : '#f06b6b'
                  return (
                    <div key={label} className="ocd-prob-row">
                      <span className="ocd-prob-label">{label}</span>
                      <div className="ocd-prob-bar-wrap">
                        <div
                          className="ocd-prob-bar-fill"
                          style={{ width: pct + '%', background: barColor }}
                        />
                      </div>
                      <span className="ocd-prob-pct" style={{ color: barColor }}>{pct}%</span>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* Subscale cards */}
      <div className="ocd-subscale-cards">
        <div className="ocd-sub-card obs">
          <div className="ocd-sub-icon">🧠</div>
          <div className="ocd-sub-body">
            <div className="ocd-sub-label">Obsession Subscale</div>
            <div className="ocd-sub-score">{obsScore}<span>/20</span></div>
            <div className="ocd-sub-bar">
              <div className="ocd-sub-fill obs-fill" style={{ width: (obsScore / 20 * 100) + '%' }} />
            </div>
            <div className="ocd-sub-sev">{details?.obsessionSeverity}</div>
          </div>
        </div>
        <div className="ocd-sub-card comp">
          <div className="ocd-sub-icon">🔄</div>
          <div className="ocd-sub-body">
            <div className="ocd-sub-label">Compulsion Subscale</div>
            <div className="ocd-sub-score">{compScore}<span>/20</span></div>
            <div className="ocd-sub-bar">
              <div className="ocd-sub-fill comp-fill" style={{ width: (compScore / 20 * 100) + '%' }} />
            </div>
            <div className="ocd-sub-sev">{details?.compulsionSeverity}</div>
          </div>
        </div>
      </div>

      {/* Charts + answer breakdown */}
      <div className="ocd-charts-row">

        {/* Radial chart */}
        <div className="ocd-chart-card">
          <div className="ocd-chart-title">Score Breakdown</div>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius="25%" outerRadius="90%"
              barSize={18}
              data={radialData}
            >
              <RadialBar minAngle={10} background clockWise dataKey="value" />
              <Tooltip
                contentStyle={{ background: '#0e1c30', border: '1px solid #1e3358', borderRadius: 8 }}
                labelStyle={{ color: '#e8edf5' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="ocd-chart-legend">
            {radialData.map(d => (
              <div key={d.name} className="ocd-legend-item">
                <span className="ocd-legend-dot" style={{ background: d.fill }} />
                <span>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Per-question answer grid */}
        <div className="ocd-chart-card">
          <div className="ocd-chart-title">Question-by-Question Breakdown</div>
          <div className="ocd-answer-grid">
            {(answers || []).map((val, i) => {
              const isObs = i < 5
              const pct = (val / 4) * 100
              const color = val <= 1 ? '#22d3a0' : val === 2 ? '#f59e0b' : '#f06b6b'
              return (
                <div key={i} className="ocd-answer-row">
                  <span className={`ocd-ans-tag ${isObs ? 'obs' : 'comp'}`}>
                    {isObs ? 'O' : 'C'}{(i % 5) + 1}
                  </span>
                  <span className="ocd-ans-q">{OCD_QUESTIONS_SHORT[i]}</span>
                  <div className="ocd-ans-bar-wrap">
                    <div className="ocd-ans-bar-fill" style={{ width: pct + '%', background: color }} />
                  </div>
                  <span className="ocd-ans-val" style={{ color }}>{val ?? '—'}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="ocd-ai-card">
        <div className="ocd-ai-header">
          <span className="ocd-ai-icon">🤖</span>
          <div>
            <div className="ocd-ai-title">AI-Powered Interpretation</div>
            <div className="ocd-ai-sub">Powered by Google Gemini · Not a diagnosis</div>
          </div>
        </div>
        <div className="ocd-ai-body">
          {aiLoading && (
            <div className="ocd-ai-loading">
              <div className="ocd-ai-spinner" />
              Analyzing your results…
            </div>
          )}
          {aiError && <div className="ocd-ai-error">{aiError}</div>}
          {aiInsight && <p className="ocd-ai-text">{aiInsight}</p>}
        </div>
      </div>

      {/* Severity scale reference */}
      <div className="ocd-scale-ref">
        <div className="ocd-scale-title">Y-BOCS Severity Scale Reference</div>
        <div className="ocd-scale-grid">
          {[
            { range: '0–7',   label: 'Mild',     color: '#22d3a0' },
            { range: '8–15',  label: 'Moderate', color: '#f59e0b' },
            { range: '16–23', label: 'Severe',   color: '#f06b6b' },
            { range: '24–40', label: 'Extreme',  color: '#dc2626' },
          ].map(s => (
            <div
              key={s.label}
              className={`ocd-scale-item ${severity === s.label ? 'current' : ''}`}
              style={{ borderColor: severity === s.label ? s.color : 'transparent' }}
            >
              <div className="ocd-scale-dot" style={{ background: s.color }} />
              <div className="ocd-scale-range">{s.range}</div>
              <div className="ocd-scale-label" style={{ color: s.color }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="ocd-res-actions">
        <Link to="/ocd" className="ocd-btn-link primary">Retake Assessment</Link>
        <Link to="/dashboard" className="ocd-btn-link ghost">Back to Dashboard</Link>
        <Link to="/history" className="ocd-btn-link ghost">View History</Link>
      </div>

    </div>
  )
}
