import { useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Crosshair } from 'lucide-react'
import MiniShell from './MiniShell.jsx'
import useBest from './useBest.js'
import { fitCanvas, overlayFor, useAutoPause, useKeys, useRaf } from './arcadeKit.js'
import { registerPlay, reportGameOver } from '../../utils/plays.js'

const S = 300, T = 22
const DIRS = { up: [0, -1, 0], right: [1, 0, 90], down: [0, 1, 180], left: [-1, 0, 270] }
const KEY2DIR = { ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left' }
const WALLS = [[50, 70, 60, 16], [190, 70, 60, 16], [120, 120, 60, 16], [50, 170, 16, 50], [234, 170, 16, 50], [100, 200, 100, 16]]
const SPAWNS = [[20, 10], [140, 10], [258, 10]]
const fresh = () => ({ p: { x: 139, y: S - T - 10, dir: 'up', cool: 0, inv: 1.5 }, enemies: [], bullets: [], score: 0, lives: 3, spawn: 0.6 })

const hitsWall = (x, y) => x < 0 || y < 0 || x + T > S || y + T > S || WALLS.some(([wx, wy, ww, wh]) => x < wx + ww && x + T > wx && y < wy + wh && y + T > wy)
const rnd = (a, b) => a + Math.random() * (b - a)

function tank(ctx, t, color) {
  ctx.save(); ctx.translate(t.x + T / 2, t.y + T / 2); ctx.rotate((DIRS[t.dir][2] * Math.PI) / 180)
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(-T / 2, -T / 2, T, T, 4); ctx.fill()
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-T / 2 - 2, -T / 2, 5, T); ctx.fillRect(T / 2 - 3, -T / 2, 5, T)
  ctx.fillStyle = color; ctx.fillRect(-2.5, -T / 2 - 6, 5, T / 2 + 6)
  ctx.fillStyle = 'rgba(11,11,13,0.55)'; ctx.beginPath(); ctx.arc(0, 1, 5, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

export default function TankGame() {
  const canvasRef = useRef(null)
  const boardRef = useRef(null)
  const gRef = useRef(fresh())
  const phaseRef = useRef('ready')
  const [phase, setPhase] = useState('ready')
  const [hud, setHud] = useState({ score: 0, lives: 3 })
  const [newBest, setNewBest] = useState(false)
  const [best, submitBest] = useBest('tank')
  const k = useKeys()
  const set = (p) => { phaseRef.current = p; setPhase(p) }
  const sync = () => { const g = gRef.current; setHud((h) => (h.score === g.score && h.lives === g.lives ? h : { score: g.score, lives: g.lives })) }

  const draw = () => {
    const ctx = fitCanvas(canvasRef.current, S, S)
    if (!ctx) return
    const g = gRef.current
    ctx.fillStyle = '#0B0B0D'; ctx.fillRect(0, 0, S, S)
    ctx.fillStyle = '#4a5a24'
    WALLS.forEach(([x, y, w, h]) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, 3); ctx.fill() })
    ctx.fillStyle = 'rgba(11,11,13,0.45)'
    WALLS.forEach(([x, y, w, h]) => { for (let i = 8; i < Math.max(w, h); i += 8) { if (w > h) ctx.fillRect(x + i, y, 1.5, h); else ctx.fillRect(x, y + i, w, 1.5) } })
    g.enemies.forEach((e) => tank(ctx, e, '#F2F0EA'))
    if (g.p.inv <= 0 || Math.floor(g.p.inv * 10) % 2 === 0) tank(ctx, g.p, '#C6FF4D')
    ctx.fillStyle = '#F2F0EA'
    g.bullets.forEach((b) => { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill() })
  }

  const start = () => {
    gRef.current = fresh(); sync(); setNewBest(false); set('playing'); registerPlay(); k.clear()
    boardRef.current?.focus({ preventScroll: true }); draw()
  }
  const end = () => { set('over'); setNewBest(submitBest(gRef.current.score)); reportGameOver('tank', gRef.current.score) }
  const togglePause = () => {
    if (phaseRef.current === 'playing') { set('paused'); k.clear() }
    else if (phaseRef.current === 'paused') { set('playing'); boardRef.current?.focus({ preventScroll: true }) }
  }
  const shoot = (t, own) => {
    const [dx, dy] = DIRS[t.dir]
    gRef.current.bullets.push({ x: t.x + T / 2 + dx * (T / 2 + 2), y: t.y + T / 2 + dy * (T / 2 + 2), dx, dy, own })
  }

  useRaf(phase === 'playing', (dt) => {
    const g = gRef.current, p = g.p
    p.cool -= dt; p.inv -= dt

    // player: last pressed arrow wins
    let want = null
    k.keys.forEach((key) => { if (KEY2DIR[key]) want = KEY2DIR[key] })
    if (want) {
      p.dir = want
      const [dx, dy] = DIRS[want]
      const nx = p.x + dx * 95 * dt, ny = p.y + dy * 95 * dt
      if (!hitsWall(nx, p.y)) p.x = nx
      if (!hitsWall(p.x, ny)) p.y = ny
    }
    if (k.keys.has(' ') && p.cool <= 0) { shoot(p, 'p'); p.cool = 0.4 }

    // enemies
    g.spawn -= dt
    const cap = Math.min(4, 2 + Math.floor(g.score / 600))
    if (g.spawn <= 0 && g.enemies.length < cap) {
      const [sx, sy] = SPAWNS[Math.floor(Math.random() * 3)]
      if (!g.enemies.some((e) => Math.abs(e.x - sx) < T && Math.abs(e.y - sy) < T)) g.enemies.push({ x: sx, y: sy, dir: 'down', t: 0.5, cool: rnd(0.6, 1.6) })
      g.spawn = 2.2
    }
    const names = Object.keys(DIRS)
    g.enemies.forEach((e) => {
      e.t -= dt; e.cool -= dt
      const [dx, dy] = DIRS[e.dir]
      const nx = e.x + dx * 55 * dt, ny = e.y + dy * 55 * dt
      if (e.t <= 0 || hitsWall(nx, ny)) {
        e.dir = Math.random() < 0.4 ? (Math.abs(p.x - e.x) > Math.abs(p.y - e.y) ? (p.x > e.x ? 'right' : 'left') : (p.y > e.y ? 'down' : 'up')) : names[Math.floor(Math.random() * 4)]
        e.t = rnd(0.5, 1.4)
      } else { e.x = nx; e.y = ny }
      if (e.cool <= 0) { shoot(e, 'e'); e.cool = rnd(1, 2.2) }
    })

    // bullets
    const alive = []
    for (const b of g.bullets) {
      b.x += b.dx * 230 * dt; b.y += b.dy * 230 * dt
      if (b.x < 0 || b.y < 0 || b.x > S || b.y > S || WALLS.some(([x, y, w, h]) => b.x > x && b.x < x + w && b.y > y && b.y < y + h)) continue
      if (b.own === 'p') {
        const i = g.enemies.findIndex((e) => b.x > e.x && b.x < e.x + T && b.y > e.y && b.y < e.y + T)
        if (i >= 0) { g.enemies.splice(i, 1); g.score += 100; sync(); continue }
      } else if (p.inv <= 0 && b.x > p.x && b.x < p.x + T && b.y > p.y && b.y < p.y + T) {
        g.lives -= 1; sync(); g.bullets = []
        if (g.lives <= 0) { draw(); end(); return }
        Object.assign(p, { x: 139, y: S - T - 10, dir: 'up', inv: 1.8 })
        draw(); return
      }
      alive.push(b)
    }
    g.bullets = alive
    draw()
  })
  useAutoPause(phase === 'playing', () => { set('paused'); k.clear() })

  const onKeyDown = (e) => {
    if (e.key === 'p' || e.key === 'P') { e.preventDefault(); togglePause(); return }
    k.down(e)
  }
  const pad = (key, Icon, label, cls) => <button type="button" className={`pad ${cls}`} aria-label={label} {...k.hold(key)}><Icon size={26} aria-hidden="true" /></button>

  return (
    <MiniShell
      name="Tank Battle" lead="Move, aim and fire. Take out the enemy tanks and don’t let them hit you."
      stats={[['SCORE', hud.score], ['LIVES', hud.lives], ['BEST', Math.max(best, hud.score)]]}
      boardRef={boardRef} boardClass="mg__board--sq" boardLabel="Tank battle board. Arrow keys move, space fires, P pauses."
      onKeyDown={onKeyDown} onKeyUp={k.up} onBlur={k.clear}
      overlay={overlayFor({ phase, name: 'Tank Battle', tagline: 'Destroy every enemy tank.', best, score: hud.score, newBest, start, resume: togglePause })}
      onPause={togglePause} paused={phase === 'paused'} canPause={phase === 'playing' || phase === 'paused'} onRestart={start}
      keys={<><li><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> Move</li><li><kbd>Space</kbd> Fire</li><li><kbd>P</kbd> Pause</li></>}
      pad={<div className="mg__dpad mg__dpad--tank" role="group" aria-label="On-screen controls">
        {pad('ArrowUp', ArrowUp, 'Up', 'mg__pad-up')}{pad('ArrowLeft', ArrowLeft, 'Left', 'mg__pad-left')}{pad('ArrowDown', ArrowDown, 'Down', 'mg__pad-down')}{pad('ArrowRight', ArrowRight, 'Right', 'mg__pad-right')}
        <button type="button" className="pad mg__pad-fire pad--hd" aria-label="Fire" {...k.hold(' ')}><Crosshair size={26} aria-hidden="true" /><span>Fire</span></button>
      </div>}
    >
      <canvas ref={canvasRef} className="mg__canvas" aria-hidden="true" />
    </MiniShell>
  )
}
