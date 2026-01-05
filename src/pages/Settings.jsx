import { useEffect, useState } from 'react'
import { useToast } from '../components/ToastProvider'
import '../styles/settings.css'

function applyTheme(theme) {
  const isLight = theme === 'light'
  document.body.classList.toggle('theme-light', isLight)
  localStorage.setItem('mh_theme', isLight ? 'light' : 'dark')
}

function applyMotion(reduced) {
  document.body.classList.toggle('reduced-motion', reduced)
  localStorage.setItem('mh_motion', reduced ? 'reduced' : 'full')
}

function applyContrast(high) {
  document.body.classList.toggle('high-contrast', high)
  localStorage.setItem('mh_contrast', high ? 'high' : 'normal')
}

export default function Settings() {
  const [theme, setTheme] = useState(localStorage.getItem('mh_theme') || 'dark')
  const [motion, setMotion] = useState(localStorage.getItem('mh_motion') || 'full')
  const [smoothing, setSmoothing] = useState(() => {
    const raw = localStorage.getItem('mh_chart_smoothing')
    return raw ? Number(raw) : 0.35
  })
  const [contrast, setContrast] = useState(localStorage.getItem('mh_contrast') || 'normal')
  const { showToast } = useToast() || {}
  useEffect(() => { applyTheme(theme) }, [theme])
  useEffect(() => { applyMotion(motion === 'reduced') }, [motion])
  useEffect(() => { localStorage.setItem('mh_chart_smoothing', String(smoothing)) }, [smoothing])
  useEffect(() => { applyContrast(contrast === 'high') }, [contrast])
  return (
    <div className="settings">
      <div className="settings-title">Settings</div>
      <div className="settings-grid">
        <div className="settings-card">
          <div className="settings-card-title">Theme</div>
          <div className="field">
            <label>Appearance</label>
            <select value={theme} onChange={e => { setTheme(e.target.value); showToast && showToast('Theme updated', 'success') }}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
        <div className="settings-card">
          <div className="settings-card-title">Motion</div>
          <div className="field">
            <label>Animations</label>
            <select value={motion} onChange={e => { setMotion(e.target.value); showToast && showToast('Motion preference saved', 'success') }}>
              <option value="full">On</option>
              <option value="reduced">Reduced</option>
            </select>
          </div>
        </div>
        <div className="settings-card">
          <div className="settings-card-title">Charts</div>
          <div className="field">
            <label>Smoothing</label>
            <input type="range" min="0" max="0.8" step="0.05" value={smoothing} onChange={e => { setSmoothing(Number(e.target.value)); showToast && showToast('Chart smoothing adjusted', 'success') }} />
            <div className="muted">Value: {smoothing.toFixed(2)}</div>
          </div>
        </div>
        <div className="settings-card">
          <div className="settings-card-title">Accessibility</div>
          <div className="field">
            <label>High Contrast</label>
            <select value={contrast} onChange={e => { setContrast(e.target.value); showToast && showToast('Contrast updated', 'success') }}>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
