import { Pause, Play, RotateCcw } from 'lucide-react'
import Button from '../ui/Button.jsx'
import './MiniGames.css'

// Shared frame for the small games: stats, board with overlay, tools and key hints.
export default function MiniShell({ name, lead, stats, boardClass = '', boardRef, onKeyDown, onKeyUp, onBlur, onPointerDown, onPointerUp, onPointerMove, boardLabel, overlay, children, onPause, paused, canPause, onRestart, keys, pad }) {
  return (
    <div className="block mg">
      <p className="mg__label">{name.toUpperCase()}</p>
      <p className="mg__lead">{lead}</p>
      <div className="mg__card">
        <div className="mg__stats" role="group" aria-label="Game stats">
          {stats.map(([k, v]) => <div className="tstat" key={k}><span className="tstat__k">{k}</span><span className="tstat__v">{v}</span></div>)}
        </div>
        <div
          ref={boardRef}
          className={`mg__board ${boardClass}`}
          tabIndex={0}
          role="group"
          aria-label={boardLabel}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onBlur={onBlur}
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {children}
          {overlay && (
            <div className="tet__overlay">
              <p className="tet__ov-k">{overlay.k}</p>
              {overlay.score !== undefined ? <p className="tet__ov-score">{overlay.score}</p> : <p className="tet__ov-t">{overlay.t}</p>}
              {overlay.s && <p className="tet__ov-s">{overlay.s}</p>}
              <Button size="lg" onClick={overlay.onClick} data-cursor>{overlay.cta}</Button>
            </div>
          )}
        </div>
        <div className="mg__tools">
          {onPause && (
            <button type="button" className="tool" onClick={onPause} disabled={!canPause} data-cursor>
              {paused ? <Play size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" />}
              {paused ? 'Resume' : 'Pause'}
            </button>
          )}
          <button type="button" className="tool" onClick={onRestart} data-cursor><RotateCcw size={18} aria-hidden="true" /> Restart</button>
        </div>
        <ul className="tet__keys mg__keys" aria-label="Controls">{keys}</ul>
        {pad}
      </div>
    </div>
  )
}
