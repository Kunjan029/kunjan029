import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import MiniShell from './MiniShell.jsx'
import useBest from './useBest.js'
import { fitCanvas, overlayFor, useAutoPause, useRaf } from './arcadeKit.js'
import { registerPlay, reportGameOver } from '../../utils/plays.js'

const W = 240, H = 360, LANE = W / 3, CAR_W = 38, CAR_H = 64, PY = H - 84
const lx = (lane) => lane * LANE + LANE / 2
const fresh = () => ({ lane: 1, cars: [], score: 0, spawn: 0.6, stripe: 0, speed: 130 })

function car(ctx, cx, y, color, up) {
  ctx.fillStyle = color
  ctx.beginPath(); ctx.roundRect(cx - CAR_W / 2, y, CAR_W, CAR_H, 8); ctx.fill()
  ctx.fillStyle = 'rgba(11,11,13,0.75)'
  const wy = up ? y + 16 : y + CAR_H - 30
  ctx.beginPath(); ctx.roundRect(cx - CAR_W / 2 + 6, wy, CAR_W - 12, 14, 3); ctx.fill()
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ;[y + 6, y + CAR_H - 16].forEach((wy2) => { ctx.fillRect(cx - CAR_W / 2 - 3, wy2, 4, 10); ctx.fillRect(cx + CAR_W / 2 - 1, wy2, 4, 10) })
}

export default function RacingGame({ onClose }) {
  const canvasRef = useRef(null)
  const boardRef = useRef(null)
  const gRef = useRef(fresh())
  const touchRef = useRef(null)
  const [phase, setPhase] = useState('ready')
  const [score, setScore] = useState(0)
  const [newBest, setNewBest] = useState(false)
  const [best, submitBest] = useBest('racing')
  const phaseRef = useRef('ready')
  const set = (p) => { phaseRef.current = p; setPhase(p) }

  const draw = () => {
    const ctx = fitCanvas(canvasRef.current, W, H)
    if (!ctx) return
    const g = gRef.current
    ctx.fillStyle = '#0B0B0D'; ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = 'rgba(242,240,234,0.18)'
    for (let l = 1; l < 3; l++) for (let y = -40 + (g.stripe % 40); y < H; y += 40) ctx.fillRect(l * LANE - 1.5, y, 3, 22)
    g.cars.forEach((c) => car(ctx, lx(c.lane), c.y, '#F2F0EA', false))
    car(ctx, lx(g.lane), PY, '#C6FF4D', true)
  }

  const start = () => {
    gRef.current = fresh(); setScore(0); setNewBest(false); set('playing'); registerPlay()
    boardRef.current?.focus({ preventScroll: true }); draw()
  }
  const end = () => { set('over'); setNewBest(submitBest(gRef.current.score)); reportGameOver('racing', gRef.current.score) }
  const togglePause = () => {
    if (phaseRef.current === 'playing') set('paused')
    else if (phaseRef.current === 'paused') { set('playing'); boardRef.current?.focus({ preventScroll: true }) }
  }
  const steer = (d) => { if (phaseRef.current === 'playing') gRef.current.lane = Math.max(0, Math.min(2, gRef.current.lane + d)) }

  useRaf(phase === 'playing', (dt) => {
    const g = gRef.current
    g.speed = 130 + Math.min(230, g.score * 5)
    g.stripe += g.speed * dt
    g.spawn -= dt
    if (g.spawn <= 0) {
      const a = Math.floor(Math.random() * 3)
      g.cars.push({ lane: a, y: -CAR_H, passed: false })
      if (Math.random() < 0.35) g.cars.push({ lane: (a + 1 + Math.floor(Math.random() * 2)) % 3, y: -CAR_H, passed: false }) // never all three lanes
      g.spawn = (190 + Math.random() * 90) / g.speed
    }
    let hit = false
    g.cars.forEach((c) => {
      c.y += g.speed * dt
      if (!c.passed && c.y > PY + CAR_H) { c.passed = true; g.score += 1; setScore(g.score) }
      if (c.lane === g.lane && c.y + CAR_H - 8 > PY + 8 && c.y + 8 < PY + CAR_H) hit = true
    })
    g.cars = g.cars.filter((c) => c.y < H + 10)
    draw()
    if (hit) end()
  })
  useAutoPause(phase === 'playing', () => set('paused'))

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); steer(-1) }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); steer(1) }
    else if (e.key === 'p' || e.key === 'P') { e.preventDefault(); togglePause() }
    else if (e.key.startsWith('Arrow') || e.key === ' ') e.preventDefault()
  }
  const onPointerDown = (e) => { touchRef.current = e.clientX }
  const onPointerUp = (e) => {
    const x0 = touchRef.current; touchRef.current = null
    if (x0 === null) return
    const dx = e.clientX - x0
    if (Math.abs(dx) > 24) steer(dx > 0 ? 1 : -1)
    else if (phaseRef.current === 'playing') { const r = boardRef.current.getBoundingClientRect(); steer(e.clientX < r.left + r.width / 2 ? -1 : 1) } // tap a side
  }

  return (
    <MiniShell
      name="Racing" lead="Switch lanes, dodge the traffic and see how long you can keep driving. It speeds up as you go."
      onClose={onClose}
      stats={[['SCORE', score], ['LEVEL', Math.floor(score / 10) + 1], ['BEST', Math.max(best, score)]]}
      boardRef={boardRef} boardClass="mg__board--rc" boardLabel="Racing board. Left and right arrows or A and D change lane, P pauses."
      onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerUp={onPointerUp}
      overlay={overlayFor({ phase, name: 'Racing', tagline: 'Dodge the cars coming at you.', best, score, newBest, start, resume: togglePause })}
      onPause={togglePause} paused={phase === 'paused'} canPause={phase === 'playing' || phase === 'paused'} onRestart={start}
      keys={<><li><kbd>←</kbd><kbd>→</kbd> Change lane</li><li><kbd>P</kbd> Pause</li></>}
      pad={<div className="mg__dpad mg__dpad--h" role="group" aria-label="On-screen controls">
        <button type="button" className="pad mg__pad-left" aria-label="Left" onPointerDown={(e) => { e.preventDefault(); steer(-1) }}><ArrowLeft size={26} aria-hidden="true" /></button>
        <button type="button" className="pad mg__pad-right" aria-label="Right" onPointerDown={(e) => { e.preventDefault(); steer(1) }}><ArrowRight size={26} aria-hidden="true" /></button>
      </div>}
    >
      <canvas ref={canvasRef} className="mg__canvas" aria-hidden="true" />
    </MiniShell>
  )
}
