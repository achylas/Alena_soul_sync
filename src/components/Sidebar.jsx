import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/sidebar.css'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    color: '#5b8def',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M3 13h8V3H3v10zm10 8h8V3h-8v18zm-10 0h8v-6H3v6z"/>
      </svg>
    ),
  },
  {
    to: '/testhub',
    label: 'Tests',
    color: '#7c5cfc',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
      </svg>
    ),
  },
  {
    to: '/ocd',
    label: 'OCD Assessment',
    color: '#f59e0b',
    badge: 'NEW',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
      </svg>
    ),
  },
  {
    to: '/ai',
    label: 'AI Insights',
    color: '#a78bfa',
    badge: 'AI',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 010 2h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 010-2h1a7 7 0 017-7h1V5.73A2 2 0 0110 4a2 2 0 012-2M7.5 13A4.5 4.5 0 003 17.5V18h18v-.5A4.5 4.5 0 0016.5 13h-9z"/>
      </svg>
    ),
  },
  {
    to: '/tracking',
    label: 'Tracking',
    color: '#22d3a0',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M3 17l6-6 4 4 7-7v6h2V5h-9v2h6l-6 6-4-4L1 15l2 2z"/>
      </svg>
    ),
  },
  {
    to: '/history',
    label: 'History',
    color: '#fbbf24',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M12 8v5h5v-2h-3V8h-2zm0-7C6.48 1 2 5.48 2 11H0l3.89 3.89.11.23L8 11H5c0-3.86 3.14-7 7-7s7 3.14 7 7-3.14 7-7 7c-1.93 0-3.68-.78-4.94-2.06l-1.42 1.42C7.54 19.91 9.65 21 12 21c5.52 0 10-4.48 10-10S17.52 1 12 1z"/>
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    color: '#f472b6',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z"/>
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    color: '#94a3b8',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.07 7.07 0 00-1.63-.94l-.36-2.54a.5.5 0 00-.5-.42h-3.84a.5.5 0 00-.5.42l-.36 2.54c-.59.23-1.14.54-1.63.94l-2.39-.96a.5.5 0 00-.6.22L2.71 7.84a.5.5 0 00.12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 00-.12.64l1.92 3.32a.5.5 0 00.6.22l2.39-.96c.49.4 1.04.71 1.63.94l.36 2.54a.5.5 0 00.5.42h3.84a.5.5 0 00.5-.42l.36-2.54c.59-.23 1.14-.54 1.63-.94l2.39.96a.5.5 0 00.6-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const { user } = useAuth()
  const initials = (user?.displayName || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <aside className="sidebar">

      {/* Brand */}
      <div className="sb-brand">
        <div className="sb-logo">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
            <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
          </svg>
        </div>
        <div className="sb-brand-text">
          <span className="sb-brand-name">SoulSync</span>
          <span className="sb-brand-sub">MH Tracker</span>
        </div>
      </div>

      {/* Nav section label */}
      <div className="sb-section-label">Navigation</div>

      {/* Nav links */}
      <nav className="sb-nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            data-label={item.label}
            className={({ isActive }) => `sb-link${isActive ? ' active' : ''}`}
            style={{ '--item-color': item.color }}
          >
            <span className="sb-icon">{item.icon}</span>
            <span className="sb-label">{item.label}</span>
            {item.badge && <span className="sb-nav-badge">{item.badge}</span>}
            <span className="sb-active-dot" />
          </NavLink>
        ))}
      </nav>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Report quick link */}
      <NavLink
        to="/report"
        data-label="Report"
        className={({ isActive }) => `sb-link sb-link-report${isActive ? ' active' : ''}`}
        style={{ '--item-color': '#34d399' }}
      >
        <span className="sb-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 17h8v-1H8v1zm0-3h8v-1H8v1zm0-3h5v-1H8v1z"/>
          </svg>
        </span>
        <span className="sb-label">Report</span>
        <span className="sb-active-dot" />
      </NavLink>

      {/* User footer */}
      <div className="sb-footer">
        <div className="sb-avatar">{initials}</div>
        <div className="sb-user-info">
          <div className="sb-user-name">{user?.displayName || 'User'}</div>
          <div className="sb-user-email">{user?.email || ''}</div>
        </div>
        <div className="sb-online-dot" title="Online" />
      </div>

    </aside>
  )
}
