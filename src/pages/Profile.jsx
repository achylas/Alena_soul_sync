import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { loadSessions } from '../services/storage'
import { useToast } from '../components/ToastProvider'
import '../styles/profile.css'

export default function Profile() {
  const { user, deleteAccount, updateProfile } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast() || {}
  const sessions = user ? loadSessions(user.email) : []

  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [saving, setSaving] = useState(false)

  // Stats
  const ocdCount = sessions.filter(s => s.test?.includes('OCD') || s.test?.includes('Y-BOCS')).length
  const phqCount = sessions.filter(s => !s.test?.includes('OCD') && !s.test?.includes('Y-BOCS')).length
  const lastSession = sessions[sessions.length - 1]

  async function onSave() {
    if (!displayName.trim()) return
    setSaving(true)
    try {
      await updateProfile({ displayName: displayName.trim() })
      showToast?.('Profile updated', 'success')
      setEditing(false)
    } catch {
      showToast?.('Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!user) return
    const ok = window.confirm('Delete your account and all local data? This cannot be undone.')
    if (!ok) return
    try {
      await deleteAccount()
      showToast?.('Account deleted', 'success')
      navigate('/signup')
    } catch (e) {
      showToast?.('Error deleting account: ' + e.message, 'error')
    }
  }

  return (
    <div className="profile-page">

      {/* Avatar + name header */}
      <div className="profile-hero">
        <div className="profile-avatar">
          {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
        </div>
        <div className="profile-hero-body">
          {editing ? (
            <div className="profile-edit-row">
              <input
                className="profile-name-input"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your display name"
                autoFocus
              />
              <button className="profile-btn save" onClick={onSave} disabled={saving}>
                {saving ? 'Saving…' : '✓ Save'}
              </button>
              <button className="profile-btn cancel" onClick={() => { setEditing(false); setDisplayName(user?.displayName || '') }}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="profile-edit-row">
              <h2 className="profile-name">{user?.displayName || 'No name set'}</h2>
              <button className="profile-btn edit" onClick={() => setEditing(true)}>
                ✏️ Edit
              </button>
            </div>
          )}
          <div className="profile-email">{user?.email}</div>
          <div className="profile-joined">
            Member since {user?.metadata?.creationTime
              ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : 'Unknown'}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="profile-stats">
        <div className="profile-stat">
          <div className="profile-stat-val">{sessions.length}</div>
          <div className="profile-stat-label">Total Sessions</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-val" style={{ color: '#5b8def' }}>{phqCount}</div>
          <div className="profile-stat-label">PHQ-9 Tests</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-val" style={{ color: '#f59e0b' }}>{ocdCount}</div>
          <div className="profile-stat-label">OCD Assessments</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-val" style={{ color: '#22d3a0' }}>
            {lastSession ? lastSession.score ?? '—' : '—'}
          </div>
          <div className="profile-stat-label">Last Score</div>
        </div>
      </div>

      {/* Info cards */}
      <div className="profile-info-grid">
        <div className="profile-info-card">
          <div className="profile-info-icon">📧</div>
          <div className="profile-info-body">
            <div className="profile-info-label">Email Address</div>
            <div className="profile-info-val">{user?.email || 'N/A'}</div>
          </div>
        </div>
        <div className="profile-info-card">
          <div className="profile-info-icon">🔐</div>
          <div className="profile-info-body">
            <div className="profile-info-label">Authentication</div>
            <div className="profile-info-val">Firebase Auth</div>
          </div>
        </div>
        <div className="profile-info-card">
          <div className="profile-info-icon">💾</div>
          <div className="profile-info-body">
            <div className="profile-info-label">Data Storage</div>
            <div className="profile-info-val">Local Device</div>
          </div>
        </div>
        <div className="profile-info-card">
          <div className="profile-info-icon">🧠</div>
          <div className="profile-info-body">
            <div className="profile-info-label">Last Assessment</div>
            <div className="profile-info-val">
              {lastSession
                ? new Date(lastSession.date).toLocaleDateString()
                : 'None yet'}
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="profile-danger-zone">
        <div className="profile-danger-title">⚠️ Danger Zone</div>
        <div className="profile-danger-body">
          <div>
            <div style={{ fontWeight: 600, color: '#e8edf5', fontSize: 14 }}>Delete Account</div>
            <div style={{ fontSize: 12, color: '#6b85a8', marginTop: 2 }}>
              Permanently deletes your account and all local session data. This cannot be undone.
            </div>
          </div>
          <button className="profile-delete-btn" onClick={onDelete}>
            Delete Account
          </button>
        </div>
      </div>

    </div>
  )
}
