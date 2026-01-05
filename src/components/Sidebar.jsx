import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/sidebar.css'


export default function Sidebar() {
  const { user } = useAuth()
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">SS</div>
        <span className="label">SoulSync MH Tracker</span>
      </div>
      <nav>
        <NavLink to="/dashboard" data-label="Dashboard" className={({ isActive }) => isActive ? 'nav active' : 'nav'}>
          <span className="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 13h8V3H3v10zm10 8h8V3h-8v18zm-10 0h8v-6H3v6z" fill="currentColor"/></svg>
          </span>
          <span className="label">Dashboard</span>
        </NavLink>
        <NavLink to="/testhub" data-label="Tests Hub" className={({ isActive }) => isActive ? 'nav active' : 'nav'}>
          <span className="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 4h10v2H7V4zm0 14h10v2H7v-2zM4 8h16v2H4V8zm0 4h16v2H4v-2z" fill="currentColor"/></svg>
          </span>
          <span className="label">Tests</span>
        </NavLink>
        <NavLink to="/tracking" data-label="Tracking" className={({ isActive }) => isActive ? 'nav active' : 'nav'}>
          <span className="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 17l6-6 4 4 7-7v6h2V5h-9v2h6l-6 6-4-4L1 15l2 2z" fill="currentColor"/></svg>
          </span>
          <span className="label">Tracking</span>
        </NavLink>
        <NavLink to="/history" data-label="History" className={({ isActive }) => isActive ? 'nav active' : 'nav'}>
          <span className="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 8v5h5v-2h-3V8h-2zm0-7C6.48 1 2 5.48 2 11H0l3.89 3.89.11.23L8 11H5c0-3.86 3.14-7 7-7s7 3.14 7 7-3.14 7-7 7c-1.93 0-3.68-.78-4.94-2.06l-1.42 1.42C7.54 19.91 9.65 21 12 21c5.52 0 10-4.48 10-10S17.52 1 12 1z" fill="currentColor"/></svg>
          </span>
          <span className="label">History</span>
        </NavLink>
        <NavLink to="/profile" data-label="Profile" className={({ isActive }) => isActive ? 'nav active' : 'nav'}>
          <span className="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" fill="currentColor"/></svg>
          </span>
          <span className="label">Profile</span>
        </NavLink>
        <NavLink to="/settings" data-label="Settings" className={({ isActive }) => isActive ? 'nav active' : 'nav'}>
          <span className="icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.07 7.07 0 00-1.63-.94l-.36-2.54a.5.5 0 00-.5-.42h-3.84a.5.5 0 00-.5.42l-.36 2.54c-.59.23-1.14.54-1.63.94l-2.39-.96a.5.5 0 00-.6.22L2.71 7.84a.5.5 0 00.12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 00-.12.64l1.92 3.32a.5.5 0 00.6.22l2.39-.96c.49.4 1.04.71 1.63.94l.36 2.54a.5.5 0 00.5.42h3.84a.5.5 0 00.5-.42l.36-2.54c.59-.23 1.14-.54 1.63-.94l2.39.96a.5.5 0 00.6-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" fill="currentColor"/></svg>
          </span>
          <span className="label">Settings</span>
        </NavLink>
      </nav>
      <div className="sidebar-footer">{user ? user.displayName || user.email : ''}</div>
    </aside>
  )
}
