import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getUserByEmail } from '../services/auth'
import { useToast } from '../components/ToastProvider'
import '../styles/auth.css'

export default function Profile() {
  const { user, deleteAccount } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast() || {}
  const record = user ? getUserByEmail(user.email) : null
  const q = record?.question || 'Not set'
  const answerSet = !!record?.answerHash
  async function onDelete() {
    if (!user) return
    const ok = window.confirm('Delete account and all local sessions? This cannot be undone.')
    if (!ok) return
    await deleteAccount()
    showToast && showToast('Account deleted', 'success')
    navigate('/signup')
  }
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-title">Profile</div>
        <form onSubmit={e => e.preventDefault()}>
          <label>Full name</label>
          <input value={user?.displayName || ''} disabled />
          <label>Email</label>
          <input value={user?.email || ''} disabled />
          <label>Security question</label>
          <input value={q} disabled />
          <label>Security answer</label>
          <input value={answerSet ? 'Stored' : 'Not set'} disabled />
          <div className="auth-links">
            <button type="button" className="btn danger" onClick={onDelete}>Delete account</button>
          </div>
        </form>
      </div>
    </div>
  )
}
