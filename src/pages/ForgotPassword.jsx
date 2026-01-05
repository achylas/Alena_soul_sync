import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ToastProvider'
import * as auth from '../services/auth'
import '../styles/auth.css'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast() || {}
  const [email, setEmail] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  function loadQuestion() {
    setError('')
    const u = auth.getUserByEmail(email)
    if (!u) {
      setError('Account not found')
      setLoaded(false)
      return
    }
    showToast && showToast('Reset link sent. Check your email.', 'success')
    navigate('/login')
  }
  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await resetPassword(email, answer, newPassword)
      navigate('/login')
    } catch (err) {
      setError(err.message || 'Reset failed')
    }
  }
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-title">Reset Password</div>
        {error && <div className="auth-error">{error}</div>}
        <div className="stack">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <button className="btn primary" onClick={loadQuestion}>Continue</button>
        </div>
        {loaded && (
          <form onSubmit={onSubmit}>
            <label>Security question</label>
            <input value={question} readOnly />
            <label>Answer</label>
            <input value={answer} onChange={e => setAnswer(e.target.value)} required />
            <label>New password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            <button className="btn primary" type="submit">Reset</button>
          </form>
        )}
        <div className="auth-links">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  )
}
