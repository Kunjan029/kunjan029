import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import MiniShell from './MiniShell.jsx'
import useBest from './useBest.js'
import { fitCanvas, overlayFor, useAutoPause, useKeys, useRaf } from './arcadeKit.js'
import { registerPlay, reportGameOver } from '../../utils/plays.js'

const W = 300, H = 400, PW = 66, PH = 10, PY = H - 30, R = 6
const COLS = 8, ROWS = 5, BW = (W - 20) / COLS, BH = 14
const ROW_COLORS = ['#F2F0EA', '#C6FF4D', '#aee443', '#85ac2b', '#5d7424']
const bricks = () => Array.from({ length: ROWS * COLS }, (_, i) => ({ c: i % COLS, r: Math.floor(i / COLS), alive: true }))
const fresh = () => ({ px: W / 2 - PW / 2, bx: W / 2, by: PY - R - 1, vx: 0, vy: 0, wait: 0.8, bricks: bricks(), score: 0, lives: 3, level: 1 })
const speedFor = (lvl) => 230 + (lvl - 1) * 25

export default function BrickBreaker({ onClose }) {
  const canvasRef = useRef(null)
  const boardRef = useRef(null)
  const gRef = useRef(fresh())
  const phaseRef = useRef('ready')
  const [phase, setPhase] = useState('ready')
  const [hud, setHud] = useState({ score: 0, lives: 3 })
  const [newBest, setNewBest] = useState(false)
  const [best, submitBest] = useBest('bricks')
  const k = useKeys()
  const set = (p) => { phaseRef.current = p; setPhase(p) }
  const sync = () => { const g = gRef.current; setHud((h) => (h.score === g.score && h.lives === g.lives ? h : { score: g.score, lives: g.lives })) }

  const draw = () => {
    const ctx = fitCanvas(canvasRef.current, W, H)
    if (!ctx) return
    const g = gRef.current
    ctx.fillStyle = '#0B0B0D'; ctx.fillRect(0, 0, W, H)
    g.bricks.forEach((b) => {
      if (!b.alive) return
      ctx.fillStyle = ROW_COLORS[b.r]
      ctx.beginPath(); ctx.roundRect(10 + b.c * BW + 1.5, 40 + b.r * (BH + 4), BW - 3, BH, 3); ctx.fill()
    })
    ctx.fillStyle = '#C6FF4D'; ctx.beginPath(); ctx.roundRect(g.px, PY, PW, PH, 5); ctx.fill()
    ctx.fillStyle = '#F2F0EA'; ctx.beginPath(); ctx.arc(g.bx, g.by, R, 0, Math.PI * 2); ctx.fill()
  }

  const start = () => {
    gRef.current = fresh(); sync(); setNewBest(false); set('playing'); registerPlay('bricks'); k.clear()
    boardRef.current?.focus({ preventScroll: true }); draw()
  }
  const end = () => { set('over'); setNewBest(submitBest(gRef.current.score)); reportGameOver('bricks', gRef.current.score) }
  const togglePause = () => {
    if (phaseRef.current === 'playing') { set('paused'); k.clear() }
    else if (phaseRef.current === 'paused') { set('playing'); boardRef.current?.focus({ preventScroll: true }) }
  }
  const launch = (g) => { const a = (Math.random() * 0.6 - 0.3); const s = speedFor(g.level); g.vx = Math.sin(a) * s; g.vy = -Math.cos(a) * s }

  useRaf(phase === 'playing', (dt) => {
    const g = gRef.current
    if (k.keys.has('ArrowLeft')) g.px -= 340 * dt
    if (k.keys.has('ArrowRight')) g.px += 340 * dt
    g.px = Math.max(0, Math.min(W - PW, g.px))
    if (g.wait > 0) {
      g.wait -= dt; g.bx = g.px + PW / 2; g.by = PY - R - 1
      if (g.wait <= 0) launch(g)
      draw(); return
    }
    // move in small steps so the ball can't tunnel through a brick
    const steps = Math.ceil((Math.hypot(g.vx, g.vy) * dt) / 4) || 1
    for (let i = 0; i < steps; i++) {
      g.bx += (g.vx * dt) / steps; g.by += (g.vy * dt) / steps
      if (g.bx < R) { g.bx = R; g.vx = Math.abs(g.vx) } else if (g.bx > W - R) { g.bx = W - R; g.vx = -Math.abs(g.vx) }
      if (g.by < R) { g.by = R; g.vy = Math.abs(g.vy) }
      if (g.vy > 0 && g.by + R >= PY && g.by + R <= PY + PH + 6 && g.bx >= g.px - R && g.bx <= g.px + PW + R) {
        const off = (g.bx - (g.px + PW / 2)) / (PW / 2) // -1 .. 1
        const a = off * 1.05, s = Math.hypot(g.vx, g.vy)
        g.vx = Math.sin(a) * s; g.vy = -Math.abs(Math.cos(a) * s); g.by = PY - R
      }
      const b = g.bricks.find((q) => {
        if (!q.alive) return false
        const x = 10 + q.c * BW + 1.5, y = 40 + q.r * (BH + 4)
        return g.bx + R > x && g.bx - R < x + BW - 3 && g.by + R > y && g.by - R < y + BH
      })
      if (b) {
        const x = 10 + b.c * BW + 1.5, y = 40 + b.r * (BH + 4)
        const ox = Math.min(g.bx + R - x, x + BW - 3 - (g.bx - R)), oy = Math.min(g.by + R - y, y + BH - (g.by - R))
        if (ox < oy) g.vx = -g.vx; else g.vy = -g.vy
        b.alive = false; g.score += 10 * (ROWS - b.r); sync()
        if (g.bricks.every((q) => !q.alive)) { g.level += 1; g.bricks = bricks(); g.wait = 0.8; g.vx = g.vy = 0; break }
      }
      if (g.by - R > H) {
        g.lives -= 1; sync()
        if (g.lives <= 0) { draw(); end(); return }
        g.wait = 0.9; g.vx = g.vy = 0; break
      }
    }
    draw()
  })
  useAutoPause(phase === 'playing', () => { set('paused'); k.clear() })

  const onKeyDown = (e) => {
    if (e.key === 'p' || e.key === 'P') { e.preventDefault(); togglePause(); return }
    k.down(e)
  }
  const onPointerMove = (e) => {
    if (phaseRef.current !== 'playing') return
    const r = boardRef.current.getBoundingClientRect()
    gRef.current.px = Math.max(0, Math.min(W - PW, ((e.clientX - r.left) / r.width) * W - PW / 2))
  }

  return (
    <MiniShell
      name="Brick Breaker" lead="Bounce the ball off your paddle and break every brick. Move with the arrow keys or just slide your mouse or finger."
      stats={[['SCORE', hud.score], ['LIVES', hud.lives], ['BEST', Math.max(best, hud.score)]]}
      onClose={onClose}
      boardRef={boardRef} boardClass="mg__board--tall" boardLabel="Brick Breaker board. Left and right arrows move the paddle, P pauses."
      onKeyDown={onKeyDown} onKeyUp={k.up} onBlur={k.clear} onPointerMove={onPointerMove} onPointerDown={onPointerMove}
      overlay={overlayFor({ phase, name: 'Brick Breaker', tagline: 'Don’t let the ball drop.', best, score: hud.score, newBest, start, resume: togglePause })}
      onPause={togglePause} paused={phase === 'paused'} canPause={phase === 'playing' || phase === 'paused'} onRestart={start}
      keys={<><li><kbd>←</kbd><kbd>→</kbd> Move paddle</li><li>Mouse or touch: slide on the board</li><li><kbd>P</kbd> Pause</li></>}
      pad={<div className="mg__dpad mg__dpad--h" role="group" aria-label="On-screen controls">
        <button type="button" className="pad mg__pad-left" aria-label="Left" {...k.hold('ArrowLeft')}><ArrowLeft size={26} aria-hidden="true" /></button>
        <button type="button" className="pad mg__pad-right" aria-label="Right" {...k.hold('ArrowRight')}><ArrowRight size={26} aria-hidden="true" /></button>
      </div>}
    >
      <canvas ref={canvasRef} className="mg__canvas" aria-hidden="true" />
    </MiniShell>
  )
}
