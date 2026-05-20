import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { addSession } from '../services/storage'
import { useToast } from '../components/ToastProvider'
import { gad7Severity, GAD7_QUESTIONS, OPTIONS_0_3 } from '../services/scoring'
import '../styles/tests.css'

export default function GAD7Test() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast() || {}

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(Array(GAD7_QUESTIONS.length).fill(null))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const percent = Math.round((step / GAD7_QUESTIONS.length) * 100)

  function setAnswer(value) {
    const next = [...answers]
    next[step] = value
    setAnswers(next)
    setError('')
  }

  function next() {
    if (answers[step] === null) { setError('Please select an option to continue'); return }
    setError('')
    if (step < GAD7_QUESTIONS.length - 1) setStep(s => s + 1)
    else submit()
  }

  function prev() { setError(''); setStep(s => Math.max(0, s - 1)) }

  async function submit() {
    setSubmitting(true)
    try {
      const total = answers.reduce((s, v) => s + (v || 0), 0)
      const severity = gad7Severity(total)
      const session = {
        id: crypto.randomUUID(),
        test: 'GAD-7 Anxiety Assessment',
        date: new Date().toISOString(),
        answers,
        score: total,
        severity,
        details: {}
      }
      addSession(user.email, session)
      showToast?.('Anxiety assessment completed', 'success')
      navigate(`/results/${session.id}`)
    } catch {
      showToast?.('Error saving result', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="test">
      <div className="tests-title">GAD-7 Anxiety Assessment</div>
      <div style={{ textAlign:'center', fontSize:12, color:'#6b85a8', marginTop:-8 }}>
        Generalized Anxiety Disorder 7-item Scale · Over the last 2 weeks
      </div>

      <div className="progress">
        <span style={{ width: percent + '%', background: 'linear-gradient(90deg,#f59e0b,#f06b6b)' }} />
      </div>

      {error && <div className="error">{error}</div>}

      <div className="qa-item question-card" style={{ borderTop: '3px solid #f59e0b' }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{
            padding: '3px 10px', borderRadius: 999,
            background: 'rgba(245,158,11,.12)', color: '#f59e0b',
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em'
          }}>
            Anxiety · Question {step + 1} of {GAD7_QUESTIONS.length}
          </span>
        </div>
        <div className="q">{step + 1}. {GAD7_QUESTIONS[step]}</div>
        <div className="a">
          {OPTIONS_0_3.map(opt => (
            <label
              key={opt.value}
              className={answers[step] === opt.value ? 'option selected' : 'option'}
            >
              <span className="control" />
              <span className="option-label">{opt.label}</span>
              <input
                type="radio"
                checked={answers[step] === opt.value}
                onChange={() => setAnswer(opt.value)}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Live score */}
      <div style={{
        display: 'flex', gap: 12,
        background: '#0e1c30', border: '1px solid #1e3358',
        borderRadius: 12, padding: '12px 16px'
      }}>
        <div style={{ flex:1, textAlign:'center' }}>
          <div style={{ fontSize:10, color:'#6b85a8', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:700 }}>Score so far</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#f59e0b' }}>
            {answers.reduce((s,v) => s + (v ?? 0), 0)}/21
          </div>
        </div>
        <div style={{ flex:1, textAlign:'center' }}>
          <div style={{ fontSize:10, color:'#6b85a8', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:700 }}>Questions left</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#e8edf5' }}>
            {GAD7_QUESTIONS.length - step - 1}
          </div>
        </div>
      </div>

      <div className="step-actions">
        {step > 0 && <button className="btn ghost" onClick={prev}>← Back</button>}
        <button
          className="btn primary"
          onClick={next}
          disabled={submitting}
          style={{ marginLeft: 'auto', background: 'linear-gradient(135deg,#f59e0b,#f06b6b)', borderColor:'transparent' }}
        >
          {submitting ? 'Saving…' : step === GAD7_QUESTIONS.length - 1 ? 'Complete →' : 'Next →'}
        </button>
      </div>

      <div className="ocd-info-box">
        <span>ℹ️</span>
        <p>The GAD-7 is a validated screening tool for generalized anxiety disorder. Scores: 0–4 Minimal, 5–9 Mild, 10–14 Moderate, 15–21 Severe. This is not a diagnosis.</p>
      </div>
    </div>
  )
}
