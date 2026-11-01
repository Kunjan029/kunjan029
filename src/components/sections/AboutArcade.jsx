import { useRef, useState } from 'react'
import { BookOpen, Gamepad2 } from 'lucide-react'
import TetrisGame from './TetrisGame.jsx'
import CreativeArchive from './CreativeArchive.jsx'
import './AboutArcade.css'

// Two separate experiences, one at a time. Switching unmounts the other, so nothing keeps running in the background.
const MODES = [
  { id: 'break', label: 'Creative Break', sub: 'Play a round of Tetris', Icon: Gamepad2 },
  { id: 'journey', label: 'The Creative Journey', sub: 'Open the Creative Archive', Icon: BookOpen },
]

export default function AboutArcade() {
  const [mode, setMode] = useState('break')
  const refs = useRef([])

  // Tabs pattern: arrow keys move between the two modes
  const onKeyDown = (e, i) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
    e.preventDefault()
    const n = e.key === 'Home' ? 0 : e.key === 'End' ? MODES.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + MODES.length) % MODES.length
    setMode(MODES[n].id)
    refs.current[n]?.focus()
  }

  return (
    <div className="block arcade">
      <p className="arcade__label">CHOOSE YOUR EXPERIENCE</p>
      <div className="arcade__tabs" role="tablist" aria-label="Choose an experience">
        {MODES.map(({ id, label, sub, Icon }, i) => (
          <button
            key={id}
            ref={(el) => { refs.current[i] = el }}
            type="button"
            role="tab"
            id={`arcade-tab-${id}`}
            aria-selected={mode === id}
            aria-controls="arcade-panel"
            tabIndex={mode === id ? 0 : -1}
            className={`arcade__tab${mode === id ? ' is-on' : ''}`}
            onClick={() => setMode(id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            data-cursor
          >
            <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
            <span className="arcade__tab-t">{label}</span>
            <span className="arcade__tab-s">{sub}</span>
          </button>
        ))}
      </div>

      <div id="arcade-panel" role="tabpanel" aria-labelledby={`arcade-tab-${mode}`} className="arcade__panel" key={mode}>
        {mode === 'break' ? <TetrisGame /> : <CreativeArchive />}
      </div>
    </div>
  )
}
