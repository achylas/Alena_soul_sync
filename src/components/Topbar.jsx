import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import GlobalSearch from './GlobalSearch'
import '../styles/topbar.css'

export default function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function onLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="topbar">
      {/* LEFT: BRAND */}
      <div className="topbar-left">
        <div className="brand-icon">🧠</div>
        <div className="top-title">
           <span>SoulSync</span>
        </div>
      </div>

      {/* CENTER: SEARCH */}
      <div className="topbar-center">
        <GlobalSearch />
      </div>

      {/* RIGHT: USER */}
      <div className="topbar-right">
        <div className="user-chip">
          <div className="avatar">
            {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
          </div>
          <span className="user-name">
            {user?.displayName || user?.email}
          </span>
        </div>

        <button className="btn logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}
