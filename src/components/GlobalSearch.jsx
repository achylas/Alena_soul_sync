import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loadSessions } from '../services/storage'
import '../styles/search.css'

export default function GlobalSearch() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  useEffect(() => {
    function onKey(e) {
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current && inputRef.current.focus(), 0)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const sessions = useMemo(() => user ? loadSessions(user.email) : [], [user])
  const results = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return []
    return sessions.filter(s => {
      const note = (s.details?.notes || '').toLowerCase()
      const t = (s.test || '').toLowerCase()
      const sev = (s.severity || '').toLowerCase()
      return note.includes(query) || t.includes(query) || sev.includes(query)
    }).slice(-8).reverse()
  }, [q, sessions])
  function go(r) {
    setOpen(false)
    setQ('')
    navigate(`/results/${r.id}`)
  }
  return (
    <div className="search">
      <input
        ref={inputRef}
        className="search-input"
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search sessions (Ctrl+/)"
      />
      {open && results.length > 0 && (
        <div className="search-list">
          {results.map(r => (
            <button key={r.id} className="search-item" onClick={() => go(r)}>
              <div className="search-item-top">
                <span className="pill">{r.test}</span>
                <span className="pill">{r.severity || 'Pending'}</span>
              </div>
              <div className="muted">{new Date(r.date).toLocaleString()}</div>
              <div className="muted">{(r.details?.notes || '').slice(0, 60)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
