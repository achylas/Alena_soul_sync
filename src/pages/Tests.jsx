import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { addSession } from '../services/storage'
import { submitTest } from '../services/api'
import '../styles/tests.css'
import { useToast } from '../components/ToastProvider'

const QUESTIONS = [
  'Mood: felt down or low',
  'Energy: felt tired or low energy',
  'Sleep quality',
  'Appetite changes',
  'Concentration difficulties',
  'Restlessness',
  'Worrying frequently',
  'Irritability',
  'Hopelessness',
  'Physical symptoms (headaches, tension)'
]

const OPTIONS_0_3 = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 }
]

export default function Tests() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast() || {}
  const BACKEND_ENABLED = import.meta.env.VITE_ENABLE_BACKEND === 'true'

  const [step, setStep] = useState(0) // question index
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(null))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Advanced
  const [stress, setStress] = useState(5)
  const [sleepHours, setSleepHours] = useState(7)
  const [activity, setActivity] = useState(5)
  const [screenTime, setScreenTime] = useState(4)
  const [caffeine, setCaffeine] = useState(2)
  const [notes, setNotes] = useState('')

  const isAdvancedStep = step === QUESTIONS.length
  const percent = Math.round(((step) / (QUESTIONS.length + 1)) * 100)

  function setAnswer(value) {
    const next = [...answers]
    next[step] = value
    setAnswers(next)
  }

  function next() {
    if (!isAdvancedStep && answers[step] === null) {
      setError('Please select an option')
      return
    }
    setError('')
    setStep(s => s + 1)
  }

  function prev() {
    setError('')
    setStep(s => Math.max(0, s - 1))
  }

  async function submit() {
    setSubmitting(true)
    try {
      let res = null
      if (BACKEND_ENABLED) {
        res = await submitTest({
          test: 'Assessment',
          email: user.email,
          answers,
          extras: { stress, sleepHours, activity, screenTime, caffeine, notes }
        })
      }

      const scoreBase = answers.reduce((s, v) => s + v, 0)
      const score =
        scoreBase +
        Math.max(0, stress - sleepHours) +
        Math.max(0, screenTime - 2) +
        Math.max(0, caffeine - 1) -
        Math.max(0, activity - 4)

      const session = {
        id: res?.id ?? crypto.randomUUID(),
        test: 'Assessment',
        date: new Date().toISOString(),
        answers,
        score,
        severity: res?.severity ?? (score <= 9 ? 'Low' : score <= 19 ? 'Moderate' : 'High'),
        details: res?.details ?? { stress, sleepHours, activity, screenTime, caffeine, notes }
      }

      addSession(user.email, session)
      showToast && showToast('Assessment completed', 'success')
      navigate(`/results/${session.id}`)
    } catch {
      showToast && showToast('Saved offline', 'success')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="test">
      <div className="tests-title">Mental Health Assessment</div>

      <div className="progress">
        <span style={{ width: percent + '%' }} />
      </div>

      {error && <div className="error">{error}</div>}

      {/* QUESTION CARD */}
      {!isAdvancedStep && (
        <div className="qa-item question-card">
          <div className="q">
            {step + 1}. {QUESTIONS[step]}
          </div>

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
      )}

      {/* ADVANCED STEP */}
      {isAdvancedStep && (
        <div className="advanced">
          <div className="advanced-title">Lifestyle & Context</div>

          <div className="advanced-grid">
            <Range label="Stress level" value={stress} setValue={setStress} max={10} />
            <Range label="Sleep hours" value={sleepHours} setValue={setSleepHours} max={12} />
            <Range label="Activity level" value={activity} setValue={setActivity} max={10} />
            <Range label="Screen time" value={screenTime} setValue={setScreenTime} max={12} />
            <Range label="Caffeine (cups)" value={caffeine} setValue={setCaffeine} max={10} />
          </div>

          <label>Notes</label>
          <textarea rows="3" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      )}

      {/* NAVIGATION */}
      <div className="step-actions">
        {step > 0 && (
          <button className="btn ghost" onClick={prev}>
            Back
          </button>
        )}

        {!isAdvancedStep && (
          <button className="btn primary" onClick={next}>
            Next
          </button>
        )}

        {isAdvancedStep && (
          <button className="btn primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Finish Assessment'}
          </button>
        )}
      </div>
    </div>
  )
}

function Range({ label, value, setValue, max }) {
  return (
    <div className="advanced-group">
      <label>{label}</label>
      <input
        type="range"
        min="0"
        max={max}
        value={value}
        onChange={e => setValue(Number(e.target.value))}
      />
      <div className="muted">Value: {value}</div>
    </div>
  )
}
