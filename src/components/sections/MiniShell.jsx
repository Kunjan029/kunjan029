import { Pause, Play, RotateCcw, X } from 'lucide-react'
import Button from '../ui/Button.jsx'
import './MiniGames.css'

// Shared frame for the small games: stats, board with overlay, tools and key hints.
export default function MiniShell({ name, lead, stats, boardClass = '', boardRef, onKeyDown, onKeyUp, onBlur, onPointerDown, onPointerUp, onPointerMove, boardLabel, overlay, children, onPause, paused, canPause, onRestart, onClose, keys, pad }) {
  const [first, ...rest] = stats
  return (
    <div className="block mg">
      <p className="mg__label">{name.toUpperCase()}</p>
      <p className="mg__lead">{lead}</p>
      <div className="mg__card">
        <div className="mg__layout">
          <div className="mg__stats" role="group" aria-label="Game stats">
            <div className="tstat tstat--score"><span className="tstat__k">{first[0]}</span><span className="tstat__v">{first[1]}</span></div>
            {rest.map(([k, v]) => <div className="tstat" key={k}><span className="tstat__k">{k}</span><span className="tstat__v">{v}</span></div>)}
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
            <button type="button" className="tool" onClick={onPause} disabled={!canPause} data-cursor>
              {paused ? <Play size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" />}
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button type="button" className="tool" onClick={onRestart} data-cursor><RotateCcw size={18} aria-hidden="true" /> Restart</button>
            {onClose && <button type="button" className="tool" onClick={onClose} data-cursor><X size={18} aria-hidden="true" /> Close</button>}
          </div>
          <ul className="tet__keys mg__keys" aria-label="Controls">{keys}</ul>
          <div className="mg__padwrap">{pad}</div>
        </div>
      </div>
    </div>
  )
}
