import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import '../styles/command.css'

const COMMANDS = [
  { label: 'Go to Dashboard', action: 'nav', to: '/dashboard' },
  { label: 'Go to Tests', action: 'nav', to: '/tests' },
  { label: 'Go to Tracking', action: 'nav', to: '/tracking' },
  { label: 'Go to History', action: 'nav', to: '/history' },
  { label: 'Go to Settings', action: 'nav', to: '/settings' },
  { label: 'Go to Profile', action: 'nav', to: '/profile' },
  { label: 'Toggle Sidebar Collapse', action: 'toggle_collapse' },
]

export default function CommandPalette({ collapsed, onToggleCollapse }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const inputRef = useRef(null)
  useEffect(() => {
    function onKey(e) {
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current && inputRef.current.focus(), 0)
  }, [open])
  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = COMMANDS.map(c => ({ ...c, match: c.label.toLowerCase().includes(q) }))
    return list.filter(c => (q ? c.match : true))
  }, [query])
  function run(cmd) {
    if (cmd.action === 'nav') navigate(cmd.to)
    if (cmd.action === 'toggle_collapse') onToggleCollapse && onToggleCollapse(!collapsed)
    setOpen(false)
  }
  if (!open) return null
  return createPortal(
    <div className="cmd-overlay" onClick={() => setOpen(false)}>
      <div className="cmd" onClick={e => e.stopPropagation()}>
        <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Type a command..." />
        <div className="cmd-list">
          {items.length === 0 && <div className="cmd-empty">No results</div>}
          {items.map((c, i) => (
            <button key={i} className="cmd-item" onClick={() => run(c)}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="cmd-hints">Ctrl+K to open • Esc to close</div>
      </div>
    </div>,
    document.body
  )
}
