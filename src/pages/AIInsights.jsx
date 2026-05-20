import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { loadSessions } from '../services/storage'
import { chatWithAI, getDashboardInsight, computeWellnessIndex, scoreTrend } from '../services/gemini'
import { Link } from 'react-router-dom'
import '../styles/ai-insights.css'

const SUGGESTED = [
  'What do my recent scores suggest?',
  'How can I improve my sleep?',
  'What is OCD and how is it measured?',
  'Is my stress level concerning?',
  'What does a PHQ-9 score of 12 mean?',
  'How can I reduce anxiety naturally?',
]

export default function AIInsights() {
  const { user } = useAuth()
  const sessions = user ? loadSessions(user.email) : []

  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Hi ${user?.displayName?.split(' ')[0] || 'there'} 👋 I'm your SoulSync AI assistant. I can analyze your mental health data, explain your scores, and answer questions about mental wellness. What would you like to know?`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState(null)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [overviewError, setOverviewError] = useState('')
  const bottomRef = useRef(null)

  const wellnessIndex = computeWellnessIndex(sessions)
  const trend = scoreTrend(sessions)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text) {
    const q = text || input.trim()
    if (!q) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: q }])
    setLoading(true)

    try {
      // Build context from recent sessions
      const recent = sessions.slice(-5)
      const ctx = recent.length
        ? recent.map(s => `${s.test} on ${new Date(s.date).toLocaleDateString()}: score=${s.score}, severity=${s.severity}`).join('; ')
        : null

      const reply = await chatWithAI(q, ctx)
      setMessages(m => [...m, { role: 'ai', text: reply }])
    } catch (e) {
      setMessages(m => [...m, {
        role: 'ai',
        text: e.message?.includes('No Gemini')
          ? '⚠️ AI is not configured. Add your VITE_GEMINI_KEY to the .env file to enable this feature.'
          : '⚠️ Unable to reach AI right now. Please try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  async function loadOverview() {
    setOverviewLoading(true)
    setOverviewError('')
    try {
      const text = await getDashboardInsight(user, sessions)
      setOverview(text)
    } catch (e) {
      setOverviewError(e.message?.includes('No Gemini')
        ? 'Add VITE_GEMINI_KEY to .env to enable AI overview.'
        : 'AI overview unavailable.')
    } finally {
      setOverviewLoading(false)
    }
  }

  const trendMeta = {
    improving:    { icon: '📉', label: 'Improving', color: '#22d3a0' },
    worsening:    { icon: '📈', label: 'Worsening', color: '#f06b6b' },
    stable:       { icon: '➡️', label: 'Stable',    color: '#f59e0b' },
    insufficient: { icon: '📊', label: 'Not enough data', color: '#6b85a8' },
  }
  const tm = trendMeta[trend]

  const wiColor = wellnessIndex == null ? '#6b85a8'
    : wellnessIndex >= 70 ? '#22d3a0'
    : wellnessIndex >= 45 ? '#f59e0b'
    : '#f06b6b'

  return (
    <div className="ai-page">

      {/* Header */}
      <div className="ai-header">
        <div className="ai-header-left">
          <div className="ai-badge">AI</div>
          <div>
            <h1 className="ai-title">AI Mental Health Insights</h1>
            <p className="ai-subtitle">Powered by Google Gemini · Personalized analysis of your data</p>
          </div>
        </div>
      </div>

      <div className="ai-layout">

        {/* LEFT — stats + overview */}
        <div className="ai-sidebar">

          {/* Wellness Index */}
          <div className="ai-stat-card">
            <div className="ai-stat-label">Mental Wellness Index</div>
            <div className="ai-stat-value" style={{ color: wiColor }}>
              {wellnessIndex ?? '—'}
              {wellnessIndex != null && <span className="ai-stat-unit">/100</span>}
            </div>
            {wellnessIndex != null && (
              <div className="ai-wi-bar">
                <div className="ai-wi-fill" style={{ width: wellnessIndex + '%', background: wiColor }} />
              </div>
            )}
            <div className="ai-stat-sub">
              {wellnessIndex == null ? 'Complete assessments to calculate'
                : wellnessIndex >= 70 ? 'Good overall wellness'
                : wellnessIndex >= 45 ? 'Moderate — room to improve'
                : 'Low — consider seeking support'}
            </div>
          </div>

          {/* Trend */}
          <div className="ai-stat-card">
            <div className="ai-stat-label">Score Trend</div>
            <div className="ai-trend-row">
              <span className="ai-trend-icon">{tm.icon}</span>
              <span className="ai-trend-label" style={{ color: tm.color }}>{tm.label}</span>
            </div>
            <div className="ai-stat-sub">Based on last 8 assessments</div>
          </div>

          {/* Session count */}
          <div className="ai-stat-card">
            <div className="ai-stat-label">Total Sessions</div>
            <div className="ai-stat-value" style={{ color: '#5b8def' }}>{sessions.length}</div>
            <div className="ai-stat-sub">
              PHQ-9: {sessions.filter(s => s.test?.includes('PHQ') || s.test?.includes('Assessment') || s.test?.includes('Depression')).length} ·
              OCD: {sessions.filter(s => s.test?.includes('OCD')).length}
            </div>
          </div>

          {/* AI Overview */}
          <div className="ai-overview-card">
            <div className="ai-overview-header">
              <span>🤖</span>
              <span>AI Overview</span>
            </div>
            {!overview && !overviewLoading && (
              <button className="ai-overview-btn" onClick={loadOverview}>
                Generate AI Overview
              </button>
            )}
            {overviewLoading && (
              <div className="ai-loading-row">
                <div className="ai-spinner" /> Analyzing your data…
              </div>
            )}
            {overviewError && <div className="ai-err">{overviewError}</div>}
            {overview && <p className="ai-overview-text">{overview}</p>}
          </div>

          {/* Quick links */}
          <div className="ai-quick-links">
            <Link to="/ocd" className="ai-quick-link ocd">
              <span>🔄</span> Take OCD Assessment
            </Link>
            <Link to="/tests" className="ai-quick-link phq">
              <span>🧠</span> Take PHQ-9 Assessment
            </Link>
            <Link to="/dashboard" className="ai-quick-link dash">
              <span>📊</span> View Dashboard
            </Link>
          </div>
        </div>

        {/* RIGHT — chat */}
        <div className="ai-chat">
          <div className="ai-chat-header">
            <div className="ai-chat-dot" />
            <span>AI Assistant</span>
            <span className="ai-chat-model">Gemini 1.5 Flash</span>
          </div>

          <div className="ai-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>
                {m.role === 'ai' && <div className="ai-msg-avatar">🤖</div>}
                <div className="ai-msg-bubble">{m.text}</div>
                {m.role === 'user' && (
                  <div className="ai-msg-avatar user-av">
                    {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="ai-msg ai">
                <div className="ai-msg-avatar">🤖</div>
                <div className="ai-msg-bubble ai-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested questions */}
          <div className="ai-suggestions">
            {SUGGESTED.map(s => (
              <button key={s} className="ai-suggestion" onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="ai-input-row">
            <input
              className="ai-input"
              placeholder="Ask anything about your mental health data…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={loading}
            />
            <button
              className="ai-send"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              {loading ? '…' : '↑'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
