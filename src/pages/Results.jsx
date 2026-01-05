import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSession } from '../services/storage'
import { getResult } from '../services/api'
import '../styles/results.css'
import Skeleton from '../components/ui/Skeleton'

export default function Results() {
  const { id } = useParams()
  const { user } = useAuth()
  const localSession = useMemo(() => user ? getSession(user.email, id) : null, [user, id])
  const [remote, setRemote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const BACKEND_ENABLED = import.meta.env.VITE_ENABLE_BACKEND === 'true'
  useEffect(() => {
    let active = true
    async function run() {
      setLoading(true)
      setError('')
      if (!BACKEND_ENABLED) {
        if (active) setLoading(false)
        return
      }
      try {
        const r = await getResult(id)
        if (active) setRemote(r)
      } catch (e) {
        if (active) setError('Unable to fetch details from backend')
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => { active = false }
  }, [id, BACKEND_ENABLED])
  const base = localSession || remote
  if (!base) return <div className="results"><div className="error">Result not found</div></div>
  const severity = base.severity || (typeof base.score === 'number' ? (base.score <= 9 ? 'Low' : base.score <= 19 ? 'Moderate' : 'High') : 'Pending')
  const details = remote?.details || base.details || {
    summary: 'Provisional analysis (offline)',
    stress: base.details?.stress ?? null,
    sleepHours: base.details?.sleepHours ?? null,
    notes: base.details?.notes ?? ''
  }
  return (
    <div className="results">
      <div className="results-title">{base.test} Result</div>
      <div className="results-meta">
        <div>{loading && BACKEND_ENABLED ? <Skeleton width="80%" height={16} /> : <>Date: {new Date(base.date).toLocaleString()}</>}</div>
        <div>{loading && BACKEND_ENABLED ? <Skeleton width="60%" height={16} /> : <>Score: {typeof base.score === 'number' ? base.score : 'N/A'}</>}</div>
        <div>{loading && BACKEND_ENABLED ? <Skeleton width="40%" height={16} /> : <>Severity: {severity}</>}</div>
      </div>
      <div className="results-body">
        {loading && BACKEND_ENABLED && <div className="muted">Loading details from backend...</div>}
        {error && BACKEND_ENABLED && <div className="error">{error}</div>}
        {!loading && (
          <div>
            <div className="muted">{BACKEND_ENABLED ? 'Details' : 'Details (offline):'}</div>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(details, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
