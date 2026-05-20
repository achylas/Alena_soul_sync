import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { addSession } from '../services/storage'
import { useToast } from '../components/ToastProvider'
import { predictOCD } from '../services/gemini'
import '../styles/ocd-test.css'

/**
 * Plain-language Y-BOCS questions.
 * Clinically equivalent to the original — same 10 items, same 0-4 scoring.
 * Rewritten so any user can understand without clinical knowledge.
 */
const QUESTIONS = [
  {
    sub: 'Obsessions',
    emoji: '🧠',
    title: 'How much time do unwanted thoughts take up?',
    body: 'Do you get stuck on the same thought over and over — like worrying you left the stove on, fear of germs, or a disturbing image that keeps popping into your head — even when you don\'t want to think about it?',
    example: 'e.g. "I keep thinking I might have hurt someone even though I know I didn\'t"',
    options: [
      { value: 0, label: 'Never',         desc: 'I don\'t really have these kinds of thoughts' },
      { value: 1, label: 'Rarely',         desc: 'Less than 1 hour a day — they come and go quickly' },
      { value: 2, label: 'Sometimes',      desc: '1–3 hours a day — noticeable but manageable' },
      { value: 3, label: 'Often',          desc: '3–8 hours a day — takes up a big part of my day' },
      { value: 4, label: 'Almost always',  desc: 'More than 8 hours — nearly constant' },
    ],
  },
  {
    sub: 'Obsessions',
    emoji: '😟',
    title: 'Do these thoughts get in the way of your daily life?',
    body: 'Do these unwanted thoughts make it hard to focus at work or school, spend time with people, or just get through your day normally?',
    example: 'e.g. "I can\'t concentrate on anything because I keep second-guessing myself"',
    options: [
      { value: 0, label: 'Not at all',     desc: 'My daily life is completely normal' },
      { value: 1, label: 'A little',       desc: 'Slightly annoying but doesn\'t really affect me' },
      { value: 2, label: 'Somewhat',       desc: 'Definitely interferes but I can still manage' },
      { value: 3, label: 'A lot',          desc: 'Causes major problems in my daily life' },
      { value: 4, label: 'Completely',     desc: 'I can barely function because of these thoughts' },
    ],
  },
  {
    sub: 'Obsessions',
    emoji: '😰',
    title: 'How much distress or anxiety do these thoughts cause?',
    body: 'When these unwanted thoughts show up, how upset, anxious, or uncomfortable do they make you feel? Think about the worst moment when one of these thoughts hits you.',
    example: 'e.g. "My heart races and I feel sick when I think I might have contaminated something"',
    options: [
      { value: 0, label: 'None',           desc: 'They don\'t bother me at all' },
      { value: 1, label: 'Mild',           desc: 'A little uncomfortable but I shake it off easily' },
      { value: 2, label: 'Moderate',       desc: 'Quite distressing but I can still cope' },
      { value: 3, label: 'Severe',         desc: 'Very upsetting — hard to handle' },
      { value: 4, label: 'Extreme',        desc: 'Overwhelming anxiety — one of the worst feelings I have' },
    ],
  },
  {
    sub: 'Obsessions',
    emoji: '🛑',
    title: 'Do you try to push these thoughts away?',
    body: 'When an unwanted thought pops up, do you actively try to ignore it, distract yourself, or replace it with something else? How hard do you try?',
    example: 'e.g. "I try to think about something else or tell myself to stop"',
    options: [
      { value: 0, label: 'Always try',     desc: 'I always make an effort to dismiss the thought' },
      { value: 1, label: 'Usually try',    desc: 'I try most of the time' },
      { value: 2, label: 'Sometimes try',  desc: 'I make some effort but not always' },
      { value: 3, label: 'Rarely try',     desc: 'I mostly give in to the thought' },
      { value: 4, label: 'Never try',      desc: 'I completely give in — I don\'t even attempt to resist' },
    ],
  },
  {
    sub: 'Obsessions',
    emoji: '🎮',
    title: 'How much control do you have over these thoughts?',
    body: 'When an unwanted thought comes, can you stop it or move on from it? Or does it feel like the thought has a life of its own and you can\'t get rid of it no matter what?',
    example: 'e.g. "Once the thought starts I can\'t stop it — it just keeps going"',
    options: [
      { value: 0, label: 'Full control',   desc: 'I can stop or redirect the thought whenever I want' },
      { value: 1, label: 'Good control',   desc: 'Usually able to stop it with some effort' },
      { value: 2, label: 'Some control',   desc: 'Sometimes I can stop it, sometimes I can\'t' },
      { value: 3, label: 'Little control', desc: 'Rarely able to stop it — it usually runs its course' },
      { value: 4, label: 'No control',     desc: 'Completely unable to stop or control the thought' },
    ],
  },
  {
    sub: 'Compulsions',
    emoji: '🔁',
    title: 'How much time do you spend on repetitive behaviors or rituals?',
    body: 'Do you do things over and over to feel "safe" or "right" — like checking locks multiple times, washing hands repeatedly, counting, arranging things perfectly, or silently repeating phrases in your head?',
    example: 'e.g. "I check the door lock 10 times before I can leave the house"',
    options: [
      { value: 0, label: 'Never',          desc: 'I don\'t do any repetitive behaviors like this' },
      { value: 1, label: 'Rarely',         desc: 'Less than 1 hour a day — very occasional' },
      { value: 2, label: 'Sometimes',      desc: '1–3 hours a day — it\'s become a noticeable habit' },
      { value: 3, label: 'Often',          desc: '3–8 hours a day — takes up a lot of my time' },
      { value: 4, label: 'Almost always',  desc: 'More than 8 hours — it dominates my day' },
    ],
  },
  {
    sub: 'Compulsions',
    emoji: '🚧',
    title: 'Do these behaviors get in the way of your daily life?',
    body: 'Do your rituals or repetitive behaviors make you late, stop you from doing things you want to do, or cause problems with work, school, or relationships?',
    example: 'e.g. "I\'m always late because I can\'t leave until everything feels right"',
    options: [
      { value: 0, label: 'Not at all',     desc: 'No impact on my daily life' },
      { value: 1, label: 'A little',       desc: 'Slightly inconvenient but doesn\'t really affect me' },
      { value: 2, label: 'Somewhat',       desc: 'Definitely causes some problems but I manage' },
      { value: 3, label: 'A lot',          desc: 'Significantly disrupts my daily life' },
      { value: 4, label: 'Completely',     desc: 'I can barely function — it controls my life' },
    ],
  },
  {
    sub: 'Compulsions',
    emoji: '😣',
    title: 'How would you feel if you couldn\'t do your ritual?',
    body: 'Imagine something stops you from completing your usual ritual or behavior. How anxious or distressed would you feel? Think about the last time you were interrupted mid-ritual.',
    example: 'e.g. "If someone stops me from re-checking, I feel panicked until I can do it"',
    options: [
      { value: 0, label: 'Fine',           desc: 'I wouldn\'t feel anxious at all' },
      { value: 1, label: 'A little uneasy', desc: 'Slightly uncomfortable but I\'d get over it quickly' },
      { value: 2, label: 'Quite anxious',  desc: 'Noticeably distressed but I could manage' },
      { value: 3, label: 'Very anxious',   desc: 'Severely distressed — very hard to cope' },
      { value: 4, label: 'Extremely anxious', desc: 'Overwhelming panic — I\'d do almost anything to complete it' },
    ],
  },
  {
    sub: 'Compulsions',
    emoji: '💪',
    title: 'Do you try to stop yourself from doing these behaviors?',
    body: 'When you feel the urge to check, wash, count, or repeat something — do you try to resist doing it? Or do you just go ahead and do it?',
    example: 'e.g. "I try to stop myself from checking but the urge is too strong"',
    options: [
      { value: 0, label: 'Always resist',  desc: 'I always try to stop myself from doing it' },
      { value: 1, label: 'Usually resist', desc: 'I try to resist most of the time' },
      { value: 2, label: 'Sometimes resist', desc: 'I make some effort to resist but not always' },
      { value: 3, label: 'Rarely resist',  desc: 'I mostly just go ahead and do it' },
      { value: 4, label: 'Never resist',   desc: 'I always give in immediately without trying to stop' },
    ],
  },
  {
    sub: 'Compulsions',
    emoji: '🎯',
    title: 'How much control do you have over these behaviors?',
    body: 'Even if you try to stop yourself, can you actually do it? Or does the urge feel so powerful that you end up doing the behavior anyway?',
    example: 'e.g. "Even when I tell myself not to check, I end up doing it anyway"',
    options: [
      { value: 0, label: 'Full control',   desc: 'I can stop myself whenever I decide to' },
      { value: 1, label: 'Good control',   desc: 'Usually able to stop with some effort' },
      { value: 2, label: 'Some control',   desc: 'Sometimes I can stop, sometimes I can\'t' },
      { value: 3, label: 'Little control', desc: 'Rarely able to stop — the urge usually wins' },
      { value: 4, label: 'No control',     desc: 'Completely unable to stop — I always end up doing it' },
    ],
  },
]

const OPTION_COLORS = ['#22d3a0', '#5b8def', '#f59e0b', '#f06b6b', '#dc2626']

export default function OCDTest() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast() || {}

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(Array(10).fill(null))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const q = QUESTIONS[step]
  const isObsession = q.sub === 'Obsessions'
  const percent = Math.round((step / QUESTIONS.length) * 100)

  function setAnswer(value) {
    const next = [...answers]
    next[step] = value
    setAnswers(next)
    setError('')
  }

  function next() {
    if (answers[step] === null) { setError('Please select an option to continue'); return }
    setError('')
    if (step < QUESTIONS.length - 1) setStep(s => s + 1)
    else submit()
  }

  function prev() { setError(''); setStep(s => Math.max(0, s - 1)) }

  async function submit() {
    setSubmitting(true)
    try {
      // Call ML model (HF API or rule-based fallback)
      const result = await predictOCD(answers)

      const session = {
        id: crypto.randomUUID(),
        test: 'OCD Assessment (Y-BOCS)',
        date: new Date().toISOString(),
        answers,
        score: result.total_score,
        severity: result.severity,
        details: {
          obsessionScore:      result.obs_total,
          compulsionScore:     result.comp_total,
          obsessionSeverity:   result.obs_total <= 3 ? 'Subclinical' : result.obs_total <= 7 ? 'Mild' : result.obs_total <= 11 ? 'Moderate' : result.obs_total <= 15 ? 'Severe' : 'Extreme',
          compulsionSeverity:  result.comp_total <= 3 ? 'Subclinical' : result.comp_total <= 7 ? 'Mild' : result.comp_total <= 11 ? 'Moderate' : result.comp_total <= 15 ? 'Severe' : 'Extreme',
          ocd_detected:        result.ocd_detected,
          ocd_confidence:      result.ocd_confidence,
          severity_probabilities: result.severity_probabilities,
          model_source:        result.source,
        }
      }

      addSession(user.email, session)
      showToast?.('OCD Assessment completed', 'success')
      navigate(`/ocd-results/${session.id}`)
    } catch {
      showToast?.('Error saving result', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="ocd-test">

      {/* Header */}
      <div className="ocd-header">
        <div className="ocd-badge">Y-BOCS · OCD Screening</div>
        <h1 className="ocd-title">OCD Self-Assessment</h1>
        <p className="ocd-subtitle">
          Answer honestly based on the <strong>past week</strong>. There are no right or wrong answers —
          this helps understand your experience with unwanted thoughts and repetitive behaviors.
        </p>
      </div>

      {/* Subscale indicator */}
      <div className="ocd-subscale-bar">
        <div className={`ocd-subscale-tab ${isObsession ? 'active' : ''}`}>
          <span>🧠</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Part 1: Unwanted Thoughts</div>
            <div style={{ fontSize: 11, opacity: .7 }}>Questions 1–5</div>
          </div>
        </div>
        <div className="ocd-subscale-divider">→</div>
        <div className={`ocd-subscale-tab ${!isObsession ? 'active' : ''}`}>
          <span>�</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Part 2: Repetitive Behaviors</div>
            <div style={{ fontSize: 11, opacity: .7 }}>Questions 6–10</div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="ocd-progress-wrap">
        <div className="ocd-progress-track">
          <div
            className="ocd-progress-fill"
            style={{
              width: percent + '%',
              background: isObsession
                ? 'linear-gradient(90deg,#5b8def,#7c5cfc)'
                : 'linear-gradient(90deg,#f59e0b,#f06b6b)'
            }}
          />
        </div>
        <span className="ocd-progress-label">Question {step + 1} of {QUESTIONS.length}</span>
      </div>

      {/* Question card */}
      <div className={`ocd-question-card ${isObsession ? 'obsession' : 'compulsion'}`}>

        <div className="ocd-q-meta">
          <span className={`ocd-q-tag ${isObsession ? 'tag-obs' : 'tag-comp'}`}>
            {q.sub === 'Obsessions' ? '🧠 Unwanted Thoughts' : '🔁 Repetitive Behaviors'}
          </span>
        </div>

        {/* Big emoji + title */}
        <div className="ocd-q-emoji">{q.emoji}</div>
        <div className="ocd-q-title">{q.title}</div>
        <div className="ocd-q-body">{q.body}</div>
        {q.example && (
          <div className="ocd-q-example">{q.example}</div>
        )}

        {/* Options */}
        <div className="ocd-options">
          {q.options.map((opt, i) => (
            <button
              key={opt.value}
              className={`ocd-option ${answers[step] === opt.value ? 'selected' : ''}`}
              style={{ '--opt-color': OPTION_COLORS[i] }}
              onClick={() => setAnswer(opt.value)}
            >
              <span className="ocd-opt-score">{opt.value}</span>
              <div className="ocd-opt-content">
                <span className="ocd-opt-label">{opt.label}</span>
                <span className="ocd-opt-desc">{opt.desc}</span>
              </div>
              {answers[step] === opt.value && <span className="ocd-opt-check">✓</span>}
            </button>
          ))}
        </div>

        {error && <div className="ocd-error">{error}</div>}
      </div>

      {/* Live mini-scores */}
      <div className="ocd-mini-scores">
        <div className="ocd-mini-score">
          <span className="ocd-mini-label">Unwanted Thoughts</span>
          <span className="ocd-mini-val obs">
            {answers.slice(0, 5).reduce((s, v) => s + (v ?? 0), 0)}/20
          </span>
        </div>
        <div className="ocd-mini-score">
          <span className="ocd-mini-label">Repetitive Behaviors</span>
          <span className="ocd-mini-val comp">
            {answers.slice(5).reduce((s, v) => s + (v ?? 0), 0)}/20
          </span>
        </div>
        <div className="ocd-mini-score">
          <span className="ocd-mini-label">Total Score</span>
          <span className="ocd-mini-val total">
            {answers.reduce((s, v) => s + (v ?? 0), 0)}/40
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="ocd-nav">
        {step > 0 && (
          <button className="ocd-btn ghost" onClick={prev}>← Back</button>
        )}
        <button className="ocd-btn primary" onClick={next} disabled={submitting}>
          {submitting ? 'Saving…' : step === QUESTIONS.length - 1 ? 'See My Results →' : 'Next Question →'}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="ocd-info-box">
        <span>🔒</span>
        <p>
          Your answers are private and stored only on your device. This is a screening tool based on the
          Yale-Brown Obsessive Compulsive Scale (Y-BOCS) — it is <strong>not a diagnosis</strong>.
          If you're concerned about your results, please speak with a mental health professional.
        </p>
      </div>

    </div>
  )
}
