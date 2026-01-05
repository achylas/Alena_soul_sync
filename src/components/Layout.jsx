import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import ErrorBoundary from './ErrorBoundary'
import { ToastProvider } from './ToastProvider'
import SidebarControls from './SidebarControls'
import CommandPalette from './CommandPalette'
import '../styles/layout.css'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(localStorage.getItem('mh_sidebar_collapsed') === 'true')
  useEffect(() => { localStorage.setItem('mh_sidebar_collapsed', collapsed ? 'true' : 'false') }, [collapsed])
  useEffect(() => {
    function onKey(e) {
      if (e.ctrlKey && e.key.toLowerCase() === 'b' && !e.shiftKey) {
        e.preventDefault()
        setCollapsed(c => !c)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div className={`app-shell${collapsed ? ' collapsed' : ''}`}>
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <div className="app-content">
          <ToastProvider>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </ToastProvider>
        </div>
        <SidebarControls
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
        />
        <CommandPalette
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
        />
      </div>
    </div>
  )
}
