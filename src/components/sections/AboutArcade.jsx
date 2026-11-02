import { useRef, useState } from 'react'
import { BookOpen, Gamepad2 } from 'lucide-react'
import TetrisGame from './TetrisGame.jsx'
import SnakeGame from './SnakeGame.jsx'
import RacingGame from './RacingGame.jsx'
import TankGame from './TankGame.jsx'
import BrickBreaker from './BrickBreaker.jsx'
import Leaderboard from './Leaderboard.jsx'
import './MiniGames.css'
import CreativeArchive from './CreativeArchive.jsx'
import './AboutArcade.css'

// Two separate experiences, one at a time. Switching unmounts the other, so nothing keeps running in the background.
const MODES = [
  { id: 'break', label: 'Creative Break', sub: 'Five retro classics, take a few minutes off', Icon: Gamepad2 },
  { id: 'journey', label: 'The Creative Journey', sub: 'Open the Creative Archive', Icon: BookOpen },
]

const INTRO = 'Forget the stress. Live your childhood once again for a few minutes.'
const GAMES = [{ id: 'tetris', label: 'Tetris' }, { id: 'snake', label: 'Snake' }, { id: 'racing', label: 'Racing' }, { id: 'tank', label: 'Tank' }, { id: 'bricks', label: 'Brick Breaker' }]

export default function AboutArcade() {
  const [game, setGame] = useState('tetris')
  const [mode, setMode] = useState('break') // 'break' | 'journey' | null (closed)
  const refs = useRef([])
  const closeGames = () => { setMode(null); refs.current[0]?.focus() }

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
            tabIndex={mode === id || (mode === null && i === 0) ? 0 : -1}
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

      {mode && (
        <div id="arcade-panel" role="tabpanel" aria-labelledby={`arcade-tab-${mode}`} className="arcade__panel" key={mode}>
          {mode === 'break' ? (
            <>
              <p className="gpick__intro" aria-label={INTRO}>
                {INTRO.split(' ').map((w, i) => <span key={i} className="gpick__w" style={{ '--i': i }} aria-hidden="true">{w === 'childhood' ? <>childh<span className="cd__oo">oo</span>d</> : w}{' '}</span>)}
              </p>
              <div className="gpick" role="group" aria-label="Pick a game">
                <span className="gpick__k">PICK A GAME</span>
                {GAMES.map((g, i) => (
                  <button key={g.id} type="button" style={{ '--i': i }} className={`gpick__btn${game === g.id ? ' is-on' : ''}`} aria-pressed={game === g.id} onClick={() => setGame(g.id)} data-cursor>{g.label}</button>
                ))}
              </div>
              {game === 'tetris' && <TetrisGame key="tetris" onClose={closeGames} />}
              {game === 'snake' && <SnakeGame key="snake" onClose={closeGames} />}
              {game === 'racing' && <RacingGame key="racing" onClose={closeGames} />}
              {game === 'tank' && <TankGame key="tank" onClose={closeGames} />}
              {game === 'bricks' && <BrickBreaker key="bricks" onClose={closeGames} />}
              <Leaderboard key={`lb-${game}`} game={game} />
            </>
          ) : <CreativeArchive />}
        </div>
      )}
    </div>
  )
}
