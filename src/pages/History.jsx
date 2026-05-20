import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loadSessions } from '../services/storage'
import '../styles/history.css'

const SEV_COLOR = {
  minimal: '#22d3a0', none: '#22d3a0', low: '#22d3a0',
  mild: '#22d3a0',
  moderate: '#f59e0b',
  'moderately severe': '#f06b6b',
  high: '#f06b6b', severe: '#f06b6b', extreme: '#dc2626',
}

function resultLink(s) {
  if (s.test?.includes('OCD') || s.test?.includes('Y-BOCS')) return `/ocd-results/${s.id}`
  return `/results/${s.id}`
}

export default function History() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('all')
  const all = useMemo(() => user ? loadSessions(user.email).slice().reverse() : [], [user])

  const sessions = useMemo(() => {
    if (filter === 'all') return all
    if (filter === 'ocd') return all.filter(s => s.test?.includes('OCD') || s.test?.includes('Y-BOCS'))
    if (filter === 'phq') return all.filter(s => !s.test?.includes('OCD') && !s.test?.includes('Y-BOCS'))
    return all
  }, [all, filter])

  const ocdCount = all.filter(s => s.test?.includes('OCD') || s.test?.includes('Y-BOCS')).length
  const phqCount = all.filter(s => !s.test?.includes('OCD') && !s.test?.includes('Y-BOCS')).length

  return (
    <div className="history">
      <div className="history-header">
        <div>
          <div className="history-title">Assessment History</div>
          <div className="history-sub">{all.length} total sessions</div>
        </div>
        <div className="history-filters">
          <button className={`hf-btn${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
            All ({all.length})
          </button>
          <button className={`hf-btn${filter === 'phq' ? ' active' : ''}`} onClick={() => setFilter('phq')}>
            PHQ-9 ({phqCount})
          </button>
          <button className={`hf-btn${filter === 'ocd' ? ' active' : ''}`} onClick={() => setFilter('ocd')}>
            OCD ({ocdCount})
          </button>
        </div>
      </div>

      <div className="table">
        <div className="thead">
          <div>Test</div>
          <div>Date</div>
          <div>Score</div>
          <div>Severity</div>
          <div>Action</div>
        </div>
        <div className="tbody">
          {sessions.length === 0 && (
            <div className="history-empty">
              <span>📋</span>
              <p>No sessions found. Take an assessment to get started.</p>
            </div>
          )}
          {sessions.map(s => {
            const sevKey = (s.severity || '').toLowerCase()
            const sevColor = SEV_COLOR[sevKey] || '#6b85a8'
            const isOCD = s.test?.includes('OCD') || s.test?.includes('Y-BOCS')
            return (
              <div className="tr" key={s.id}>
                <div className="tr-test">
                  <span className={`tr-badge ${isOCD ? 'ocd' : 'phq'}`}>
                    {isOCD ? '🔄' : '🧠'}
                  </span>
                  {s.test}
                </div>
                <div className="tr-date">{new Date(s.date).toLocaleString()}</div>
                <div className="tr-score">{s.score ?? '—'}</div>
                <div className="tr-sev" style={{ color: sevColor, background: sevColor + '18' }}>
                  {s.severity || 'Pending'}
                </div>
                <div>
                  <Link to={resultLink(s)} className="tr-link">View →</Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
