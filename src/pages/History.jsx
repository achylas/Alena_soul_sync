import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loadSessions } from '../services/storage'
import '../styles/history.css'

export default function History() {
  const { user } = useAuth()
  const sessions = useMemo(() => user ? loadSessions(user.email).slice().reverse() : [], [user])
  return (
    <div className="history">
      <div className="history-title">History</div>
      <div className="table">
        <div className="thead">
          <div>Test</div>
          <div>Date</div>
          <div>Score</div>
          <div>Severity</div>
        </div>
        <div className="tbody">
          {sessions.length === 0 && <div className="muted">No history</div>}
          {sessions.map(s => (
            <Link to={`/results/${s.id}`} className="tr" key={s.id}>
              <div>{s.test}</div>
              <div>{new Date(s.date).toLocaleString()}</div>
              <div>{s.score}</div>
              <div>{s.severity || 'Pending'}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
