import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'

const savedTheme = localStorage.getItem('mh_theme')
if (savedTheme === 'light') {
  document.body.classList.add('theme-light')
}
const savedMotion = localStorage.getItem('mh_motion')
if (savedMotion === 'reduced') {
  document.body.classList.add('reduced-motion')
}
const savedContrast = localStorage.getItem('mh_contrast')
if (savedContrast === 'high') {
  document.body.classList.add('high-contrast')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
