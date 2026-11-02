import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react'
import MiniShell from './MiniShell.jsx'
import useBest from './useBest.js'
import { registerPlay, reportGameOver } from '../../utils/plays.js'

const N = 16
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' }
const fresh = () => ({ snake: [[8, 8], [7, 8], [6, 8]], dir: 'right', queue: [], food: [12, 8], score: 0 })

function placeFood(snake) {
  const free = []
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!snake.some(([sx, sy]) => sx === x && sy === y)) free.push([x, y])
  return free[Math.floor(Math.random() * free.length)] || [0, 0]
}

export default function SnakeGame() {
  const canvasRef = useRef(null)
  const boardRef = useRef(null)
  const gRef = useRef(fresh())
  const phaseRef = useRef('ready')
  const touchRef = useRef(null)
  const [phase, setPhaseS] = useState('ready')
  const [score, setScore] = useState(0)
  const [best, submitBest] = useBest('snake')
  const [newBest, setNewBest] = useState(false)
  const setPhase = (p) => { phaseRef.current = p; setPhaseS(p) }

  const draw = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = c.clientWidth
    if (!w) return
    if (c.width !== Math.round(w * dpr)) { c.width = c.height = Math.round(w * dpr) }
    const ctx = c.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const s = w / N
    const g = gRef.current
    ctx.fillStyle = '#0B0B0D'; ctx.fillRect(0, 0, w, w)
    ctx.strokeStyle = 'rgba(242,240,234,0.05)'; ctx.lineWidth = 1; ctx.beginPath()
    for (let i = 1; i < N; i++) { ctx.moveTo(Math.round(i * s) + 0.5, 0); ctx.lineTo(Math.round(i * s) + 0.5, w); ctx.moveTo(0, Math.round(i * s) + 0.5); ctx.lineTo(w, Math.round(i * s) + 0.5) }
    ctx.stroke()
    // food
    ctx.fillStyle = '#F2F0EA'; ctx.beginPath(); ctx.arc((g.food[0] + 0.5) * s, (g.food[1] + 0.5) * s, s * 0.28, 0, Math.PI * 2); ctx.fill()
    // snake
    g.snake.forEach(([x, y], i) => {
      ctx.fillStyle = i === 0 ? '#C6FF4D' : `rgba(198,255,77,${Math.max(0.35, 0.9 - i * 0.025)})`
      ctx.beginPath(); ctx.roundRect(x * s + s * 0.07, y * s + s * 0.07, s * 0.86, s * 0.86, s * 0.22); ctx.fill()
    })
  }, [])

  const turn = useCallback((d) => {
    const g = gRef.current
    const last = g.queue.length ? g.queue[g.queue.length - 1] : g.dir
    const [ax, ay] = DIRS[last], [bx, by] = DIRS[d]
    if (ax + bx === 0 && ay + by === 0) return // no reversing into yourself
    if (d === last || g.queue.length >= 2) return
    g.queue.push(d)
  }, [])

  const start = () => {
    gRef.current = fresh(); setScore(0); setNewBest(false); setPhase('playing'); registerPlay(); draw()
    boardRef.current?.focus({ preventScroll: true })
  }

  const end = useCallback(() => {
    setPhase('over')
    setNewBest(submitBest(gRef.current.score)); reportGameOver('snake', gRef.current.score)
  }, [submitBest])

  // game loop: speeds up as the snake eats
  useEffect(() => {
    if (phase !== 'playing') return undefined
    let id
    const tick = () => {
      const g = gRef.current
      if (g.queue.length) g.dir = g.queue.shift()
      const [dx, dy] = DIRS[g.dir]
      const head = [g.snake[0][0] + dx, g.snake[0][1] + dy]
      const eats = head[0] === g.food[0] && head[1] === g.food[1]
      const body = eats ? g.snake : g.snake.slice(0, -1)
      if (head[0] < 0 || head[1] < 0 || head[0] >= N || head[1] >= N || body.some(([x, y]) => x === head[0] && y === head[1])) { draw(); end(); return }
      g.snake = [head, ...body]
      if (eats) { g.score += 10; setScore(g.score); g.food = placeFood(g.snake) }
      draw()
      id = setTimeout(tick, Math.max(74, 158 - g.score * 0.8))
    }
    id = setTimeout(tick, 158)
    return () => clearTimeout(id)
  }, [phase, draw, end])

  useEffect(() => { draw(); const on = () => draw(); window.addEventListener('resize', on); return () => window.removeEventListener('resize', on) }, [draw])

  // pause when the tab is hidden
  useEffect(() => {
    const on = () => { if (document.hidden && phaseRef.current === 'playing') setPhase('paused') }
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])

  const onKeyDown = (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
    if (k === 'p') { e.preventDefault(); togglePause(); return }
    const d = KEYMAP[k]
    if (!d) return
    e.preventDefault()
    if (phaseRef.current === 'ready' || phaseRef.current === 'over') return
    if (phaseRef.current === 'paused') setPhase('playing')
    turn(d)
  }
  const togglePause = () => {
    if (phaseRef.current === 'playing') setPhase('paused')
    else if (phaseRef.current === 'paused') { setPhase('playing'); boardRef.current?.focus({ preventScroll: true }) }
  }

  // swipe on the board
  const onPointerDown = (e) => { touchRef.current = [e.clientX, e.clientY] }
  const onPointerUp = (e) => {
    const t = touchRef.current; touchRef.current = null
    if (!t || phaseRef.current !== 'playing') return
    const dx = e.clientX - t[0], dy = e.clientY - t[1]
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'))
  }
  const dpad = (d, Icon, label) => (
    <button type="button" className={`pad mg__pad-${d}`} aria-label={label} onPointerDown={(e) => { e.preventDefault(); if (phaseRef.current === 'playing') turn(d) }}><Icon size={26} aria-hidden="true" /></button>
  )

  const overlay = phase === 'ready' ? { k: 'SNAKE', t: 'Ready when you are.', s: best ? `Your best: ${best}` : 'Eat the dots, avoid the walls and yourself.', cta: 'START GAME', onClick: start }
    : phase === 'over' ? { k: 'GAME OVER', score, s: `${newBest ? 'NEW BEST! ' : ''}Best: ${Math.max(best, score)}`, cta: 'PLAY AGAIN', onClick: start }
    : phase === 'paused' ? { k: 'PAUSED', t: 'Take your time.', cta: 'RESUME', onClick: togglePause } : null

  return (
    <MiniShell
      name="Snake" lead="Guide the snake, eat the dots and don’t bite yourself. It gets faster as you grow."
      stats={[['SCORE', score], ['BEST', Math.max(best, score)]]}
      boardRef={boardRef} boardClass="mg__board--sq" boardLabel="Snake board. Use the arrow keys or W A S D to steer, P to pause."
      onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerUp={onPointerUp}
      overlay={overlay} onPause={togglePause} paused={phase === 'paused'} canPause={phase === 'playing' || phase === 'paused'} onRestart={start}
      keys={<><li><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> Steer</li><li><kbd>P</kbd> Pause</li></>}
      pad={<div className="mg__dpad" role="group" aria-label="On-screen controls">{dpad('up', ArrowUp, 'Up')}{dpad('left', ArrowLeft, 'Left')}{dpad('down', ArrowDown, 'Down')}{dpad('right', ArrowRight, 'Right')}</div>}
    >
      <canvas ref={canvasRef} className="mg__canvas" aria-hidden="true" />
    </MiniShell>
  )
}
