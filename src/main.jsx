import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { initClarity } from './utils/clarity.js'
import { initTrack } from './utils/track.js'

initClarity()
initTrack()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
