import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

const QUESTIONS = [
  'What is your favorite color?',
  'What city were you born in?',
  'What is your pet’s name?',
  'What is your mother’s maiden name?'
]

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [question, setQuestion] = useState(QUESTIONS[0])
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    try {
      await signup({ email, password, displayName, question, answer })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Signup failed')
    }
  }
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-title">Sign Up</div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={onSubmit}>
          <label>Full name</label>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} required />
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <label>Confirm password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          <label>Security question</label>
          <select value={question} onChange={e => setQuestion(e.target.value)}>
            {QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
          <label>Security answer</label>
          <input value={answer} onChange={e => setAnswer(e.target.value)} required />
          <button className="btn primary" type="submit">Create account</button>
        </form>
        <div className="auth-links">
          <Link to="/login">Already have an account</Link>
        </div>
      </div>
    </div>
  )
}
