import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowDown, ArrowLeft, ArrowRight, ChevronsDown, Pause, Play, RotateCcw, RotateCw } from 'lucide-react'
import Button from '../ui/Button.jsx'
import Reveal from '../ui/Reveal.jsx'
import {
  COLS, ROWS, COLORS, SHAPES, createGame, move, rotate, softDrop, hardDrop, stepDown, lock, clearRows, ghostY, dropInterval,
} from './tetris.js'
import './TetrisGame.css'

gsap.registerPlugin(ScrollTrigger)

const STORAGE_KEY = 'kunjan-portfolio:tetris-best'
const CLEAR_MS = 200
const CALLOUTS = ['', '', 'DOUBLE', 'TRIPLE', 'TETRIS!']

// localStorage can be missing or blocked (private mode): never let it break the game
const readBest = () => { try { return parseInt(window.localStorage.getItem(STORAGE_KEY), 10) || 0 } catch { return 0 } }
const writeBest = (n) => { try { window.localStorage.setItem(STORAGE_KEY, String(n)) } catch { /* in-memory only */ } }
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function cell(ctx, x, y, s, color, alpha = 1) {
  const p = Math.max(1, s * 0.05)
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath(); ctx.roundRect(x + p, y + p, s - p * 2, s - p * 2, s * 0.14); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.beginPath(); ctx.roundRect(x + p, y + p, s - p * 2, (s - p * 2) * 0.38, [s * 0.14, s * 0.14, 0, 0]); ctx.fill()
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  ctx.fillRect(x + p, y + s - p - (s - p * 2) * 0.16, s - p * 2, (s - p * 2) * 0.16)
  ctx.globalAlpha = 1
}

function sizeCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = canvas.clientWidth, h = canvas.clientHeight
  if (!w || !h) return null
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
  }
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, w, h }
}

export default function TetrisGame() {
  const rootRef = useRef(null)
  const layoutRef = useRef(null)
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const nextRef = useRef(null)
  const calloutRef = useRef(null)
  const startRef = useRef(null)
  const resumeRef = useRef(null)
  const gRef = useRef(createGame())
  const phaseRef = useRef('ready')
  const rafRef = useRef(0)
  const lastRef = useRef(0)
  const accRef = useRef(0)
  const clearingRef = useRef(null) // { rows, until } while completed rows flash
  const bestRef = useRef(readBest())
  const holdRef = useRef({ t: 0, i: 0 })

  const [phase, setPhaseState] = useState('ready') // ready | playing | paused | over
  const [hud, setHud] = useState({ score: 0, level: 1, lines: 0 })
  const [best, setBest] = useState(bestRef.current)
  const [newBest, setNewBest] = useState(false)
  const [focused, setFocused] = useState(false)
  const [status, setStatus] = useState('')

  const setPhase = (p) => { phaseRef.current = p; setPhaseState(p) }
  const sync = () => { const g = gRef.current; setHud((h) => (h.score === g.score && h.level === g.level && h.lines === g.lines ? h : { score: g.score, level: g.level, lines: g.lines })) }

  // ---------- drawing ----------
  function draw() {
    const canvas = canvasRef.current
    const sized = canvas && sizeCanvas(canvas)
    if (!sized) return
    const { ctx, w: cw, h } = sized
    const g = gRef.current
    // Cells are laid out square by height, then stretched sideways so a wider board gets slightly wider cells
    const s = h / ROWS, w = COLS * s
    ctx.save(); ctx.scale(cw / w, 1)
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0B0B0D'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(242,240,234,0.06)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let x = 1; x < COLS; x++) { ctx.moveTo(Math.round(x * s) + 0.5, 0); ctx.lineTo(Math.round(x * s) + 0.5, h) }
    for (let y = 1; y < ROWS; y++) { ctx.moveTo(0, Math.round(y * s) + 0.5); ctx.lineTo(w, Math.round(y * s) + 0.5) }
    ctx.stroke()

    const clearing = clearingRef.current
    const blink = clearing ? Math.floor((performance.now() % 120) / 60) === 0 : false
    g.board.forEach((row, y) => row.forEach((k, x) => { if (k) cell(ctx, x * s, y * s, s, COLORS[k]) }))
    if (clearing) {
      ctx.fillStyle = blink ? 'rgba(198,255,77,0.95)' : 'rgba(255,255,255,0.85)'
      clearing.rows.forEach((y) => ctx.fillRect(0, y * s, w, s))
    }

    const p = g.piece
    if (p && !g.over) {
      const gy = ghostY(g)
      if (gy !== p.y) {
        ctx.strokeStyle = COLORS[p.kind]; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.5
        p.m.forEach((row, y) => row.forEach((v, x) => { if (v && gy + y >= 0) ctx.strokeRect((p.x + x) * s + 2.5, (gy + y) * s + 2.5, s - 5, s - 5) }))
        ctx.globalAlpha = 1
      }
      p.m.forEach((row, y) => row.forEach((v, x) => { if (v && p.y + y >= 0) cell(ctx, (p.x + x) * s, (p.y + y) * s, s, COLORS[p.kind]) }))
    }    ctx.restore()
  }

  function drawNext() {
    const canvas = nextRef.current
    const sized = canvas && sizeCanvas(canvas)
    if (!sized) return
    const { ctx, w, h } = sized
    ctx.clearRect(0, 0, w, h)
    const kind = gRef.current.next
    const m = SHAPES[kind]
    // centre on the filled cells, not the matrix
    const cells = []
    m.forEach((row, y) => row.forEach((v, x) => { if (v) cells.push([x, y]) }))
    const minX = Math.min(...cells.map((c) => c[0])), maxX = Math.max(...cells.map((c) => c[0]))
    const minY = Math.min(...cells.map((c) => c[1])), maxY = Math.max(...cells.map((c) => c[1]))
    const s = Math.min(w, h) / 4.4
    const ox = (w - (maxX - minX + 1) * s) / 2, oy = (h - (maxY - minY + 1) * s) / 2
    cells.forEach(([x, y]) => cell(ctx, ox + (x - minX) * s, oy + (y - minY) * s, s, COLORS[kind]))
  }

  // ---------- feedback ----------
  function callout(text) {
    const el = calloutRef.current
    if (!el || !text) return
    el.textContent = text
    if (reduceMotion()) { el.style.opacity = 1; setTimeout(() => { el.style.opacity = 0 }, 900); return }
    el.animate([{ opacity: 0, transform: 'translate(-50%, 0.6rem) scale(0.9)' }, { opacity: 1, transform: 'translate(-50%, 0) scale(1)', offset: 0.2 }, { opacity: 1, offset: 0.7 }, { opacity: 0, transform: 'translate(-50%, -0.8rem)' }], { duration: 1000, easing: 'cubic-bezier(0.22,1,0.36,1)' })
  }
  function thud() {
    if (reduceMotion()) return
    wrapRef.current?.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(4px)' }, { transform: 'translateY(0)' }], { duration: 140, easing: 'ease-out' })
  }

  // ---------- game flow ----------
  function endGame() {
    cancelAnimationFrame(rafRef.current)
    const g = gRef.current
    if (g.score > bestRef.current) { bestRef.current = g.score; writeBest(g.score); setBest(g.score); setNewBest(true) }
    sync(); draw()
    setPhase('over')
    setStatus(`Game over. Score ${g.score}, ${g.lines} lines.`)
  }

  function finishClear(rows) {
    const g = gRef.current
    const prevLevel = g.level
    clearRows(g, rows)
    clearingRef.current = null
    sync(); drawNext()
    if (g.over) { endGame(); return }
    if (g.level > prevLevel) { callout(`LEVEL ${g.level}`); setStatus(`Level ${g.level}.`) }
  }

  function lockNow() {
    const g = gRef.current
    const rows = lock(g)
    accRef.current = 0
    if (g.over) { endGame(); return }
    if (rows.length) {
      callout(CALLOUTS[rows.length] || '')
      setStatus(`${rows.length} ${rows.length === 1 ? 'line' : 'lines'} cleared.`)
      if (reduceMotion()) finishClear(rows)
      else clearingRef.current = { rows, until: performance.now() + CLEAR_MS }
    } else {
      finishClear([])
    }
    sync()
  }

  function loop(now) {
    if (phaseRef.current !== 'playing') return
    const g = gRef.current
    const dt = Math.min(100, now - lastRef.current) // a hidden tab must not dump a huge gravity burst
    lastRef.current = now
    const clearing = clearingRef.current
    if (clearing) {
      if (now >= clearing.until) finishClear(clearing.rows)
    } else if (g.piece) {
      accRef.current += dt
      const interval = dropInterval(g.level)
      while (accRef.current >= interval && phaseRef.current === 'playing' && g.piece && !clearingRef.current) {
        accRef.current -= interval
        if (!stepDown(g)) { lockNow(); break }
      }
    }
    if (phaseRef.current === 'playing') {
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }
  }

  function run() {
    cancelAnimationFrame(rafRef.current)
    lastRef.current = performance.now()
    rafRef.current = requestAnimationFrame(loop)
  }

  function start() {
    gRef.current = createGame()
    clearingRef.current = null
    accRef.current = 0
    setNewBest(false)
    setHud({ score: 0, level: 1, lines: 0 })
    setPhase('playing')
    setStatus('Game started.')
    drawNext(); draw(); run()
    wrapRef.current?.focus({ preventScroll: true })
  }

  function pause() {
    if (phaseRef.current !== 'playing') return
    cancelAnimationFrame(rafRef.current)
    setPhase('paused')
    setStatus('Paused.')
  }

  function resume() {
    if (phaseRef.current !== 'paused') return
    setPhase('playing')
    setStatus('Resumed.')
    run()
    wrapRef.current?.focus({ preventScroll: true })
  }

  const togglePause = () => (phaseRef.current === 'playing' ? pause() : resume())

  // ---------- player actions (shared by keyboard and on-screen buttons) ----------
  const live = () => phaseRef.current === 'playing' && !clearingRef.current && gRef.current.piece
  const act = {
    left: () => { if (live() && move(gRef.current, -1)) draw() },
    right: () => { if (live() && move(gRef.current, 1)) draw() },
    rotate: () => { if (live() && rotate(gRef.current, 1)) draw() },
    down: () => { if (live()) { if (softDrop(gRef.current)) { accRef.current = 0; sync() } else lockNow(); draw() } },
    drop: () => { if (live()) { hardDrop(gRef.current); thud(); lockNow(); draw() } },
  }

  function onKeyDown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const k = e.key
    if (k === 'p' || k === 'P') {
      if (phaseRef.current === 'playing' || phaseRef.current === 'paused') { e.preventDefault(); if (!e.repeat) togglePause() }
      return
    }
    if (phaseRef.current !== 'playing') return // overlays keep their native keyboard behaviour
    const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'rotate', ' ': 'drop', Spacebar: 'drop' }
    const name = map[k]
    if (!name) return
    e.preventDefault() // only while the board has focus: the page keeps scrolling normally everywhere else
    if (e.repeat && (name === 'rotate' || name === 'drop')) return
    act[name]()
  }

  // Press-and-hold repeat for the on-screen buttons
  const stopHold = () => { clearTimeout(holdRef.current.t); clearInterval(holdRef.current.i) }
  const pad = (name, repeat = false) => ({
    onPointerDown: (e) => {
      e.preventDefault() // keeps focus where it is and stops long-press menus
      stopHold()
      act[name]()
      if (repeat) holdRef.current.t = setTimeout(() => { holdRef.current.i = setInterval(act[name], 60) }, 220)
    },
    onPointerUp: stopHold, onPointerCancel: stopHold, onPointerLeave: stopHold,
    onClick: (e) => { if (e.detail === 0) act[name]() }, // keyboard activation of the button
    onContextMenu: (e) => e.preventDefault(),
  })
  useEffect(() => stopHold, [])

  // Pause automatically when the tab is hidden or the game scrolls out of view
  useEffect(() => {
    const onVis = () => { if (document.hidden) pause() }
    document.addEventListener('visibilitychange', onVis)
    const io = new IntersectionObserver(([en]) => { if (!en.isIntersecting) pause() }, { threshold: 0 })
    io.observe(rootRef.current)
    return () => { document.removeEventListener('visibilitychange', onVis); io.disconnect(); cancelAnimationFrame(rafRef.current) }
  }, [])

  // Wide layouts: the board is as tall as the side column (stats down to the keys list). Square cells keep the 1:2 shape.
  useLayoutEffect(() => {
    const lay = layoutRef.current
    if (!lay) return
    const fit = () => {
      const top = lay.querySelector('.tet__stats')?.getBoundingClientRect().top
      const bottom = lay.querySelector('.tet__keys')?.getBoundingClientRect().bottom
      if (top != null && bottom > top) lay.style.setProperty('--bh', `${Math.round(bottom - top)}px`)
    }
    fit()
    const ro = new ResizeObserver(fit)
    lay.querySelectorAll('.tet__stats, .tet__tools, .tet__keys').forEach((el) => ro.observe(el))
    window.addEventListener('resize', fit)
    document.fonts?.ready.then(fit)
    return () => { ro.disconnect(); window.removeEventListener('resize', fit) }
  }, [])

  // Keep the canvases crisp on resize
  useEffect(() => {
    const ro = new ResizeObserver(() => { draw(); drawNext() })
    ro.observe(canvasRef.current)
    draw(); drawNext()
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (phase === 'ready') startRef.current?.focus({ preventScroll: true })
    if (phase === 'paused') resumeRef.current?.focus({ preventScroll: true })
    if (phase === 'over') startRef.current?.focus({ preventScroll: true })
  }, [phase])

  // Scroll entrances (skipped with reduced motion)
  useLayoutEffect(() => {
    const root = rootRef.current
    const mm = gsap.matchMedia(root)
    const st = (trigger, start = 'top 82%') => ({ trigger, start, once: true })
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.tet__label', { y: 16, opacity: 0, duration: 0.7, scrollTrigger: st('.tet__intro') })
      gsap.from('.tet__title .rv__in', { yPercent: 115, duration: 1, ease: 'power4.out', stagger: 0.05, scrollTrigger: st('.tet__title') })
      gsap.from('.tet__lead', { y: 24, opacity: 0, duration: 0.8, delay: 0.25, scrollTrigger: st('.tet__title') })
      gsap.from('.tet__card', { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: st('.tet__card', 'top 92%') })
      document.fonts?.ready.then(() => ScrollTrigger.refresh())
    })
    return () => mm.revert()
  }, [])

  const playing = phase === 'playing'
  const active = playing || phase === 'paused'

  return (
    <div className="block tet" ref={rootRef}>
      <div className="tet__intro">
        <p className="tet__label">A LITTLE CREATIVE BREAK</p>
        <h3 className="tet__title">
          <span className="line"><Reveal text="SO, NOW YOU KNOW A LITTLE ABOUT ME." accentDots /></span>
          <span className="line"><Reveal text="HOW ABOUT A LITTLE BREAK?" /></span>
        </h3>
        <p className="tet__lead">Stack the blocks, clear the lines and see how far you get. Classic Tetris, no rush.</p>
      </div>

      <div className="tet__card">
        <div className="tet__layout" ref={layoutRef}>
          <div className="tet__stats" role="group" aria-label="Game stats">
            <div className="tstat tstat--score"><span className="tstat__k">SCORE</span><span className="tstat__v">{hud.score}</span></div>
            <div className="tstat"><span className="tstat__k">LEVEL</span><span className="tstat__v">{hud.level}</span></div>
            <div className="tstat"><span className="tstat__k">LINES</span><span className="tstat__v">{hud.lines}</span></div>
            <div className="tstat tstat--best"><span className="tstat__k">BEST</span><span className="tstat__v">{best}</span></div>
            <div className="tstat tstat--next"><span className="tstat__k">NEXT</span><canvas ref={nextRef} className="next" aria-label="Next piece preview" role="img" /></div>
          </div>

          <div
            ref={wrapRef}
            className={`tet__board${focused ? ' is-focus' : ''}${playing ? ' is-playing' : ''}`}
            tabIndex={0}
            role="group"
            aria-label="Tetris board. Focus here to play with the keyboard: left and right arrows move, up rotates, down soft drops, space hard drops, P pauses."
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false) }}
            onPointerDown={() => { if (phaseRef.current === 'playing') wrapRef.current?.focus({ preventScroll: true }) }}
          >
            <canvas ref={canvasRef} className="tet__canvas" aria-hidden="true" />
            <span className="tet__callout" ref={calloutRef} aria-hidden="true" />

            {phase === 'ready' && (
              <div className="tet__overlay">
                <p className="tet__ov-k">CLASSIC TETRIS</p>
                <p className="tet__ov-t">Ready when you are.</p>
                {best > 0 && <p className="tet__ov-s">Your best: <b>{best}</b></p>}
                <Button ref={startRef} size="lg" onClick={start} data-cursor>START GAME</Button>
              </div>
            )}
            {phase === 'paused' && (
              <div className="tet__overlay">
                <p className="tet__ov-k">PAUSED</p>
                <p className="tet__ov-t">Take your time.</p>
                <Button ref={resumeRef} size="lg" onClick={resume} data-cursor>RESUME</Button>
                <button type="button" className="tet__link" onClick={start} data-cursor>Restart</button>
              </div>
            )}
            {phase === 'over' && (
              <div className="tet__overlay" role="group" aria-label="Game over">
                <p className="tet__ov-k">GAME OVER</p>
                <p className="tet__ov-score">{hud.score}</p>
                <p className="tet__ov-s">{hud.lines} {hud.lines === 1 ? 'line' : 'lines'} · level {hud.level}</p>
                <p className="tet__ov-s">{newBest && <span className="tet__new">NEW BEST! </span>}Best: <b>{best}</b></p>
                <Button ref={startRef} size="lg" onClick={start} data-cursor>PLAY AGAIN</Button>
              </div>
            )}
          </div>

          <div className="tet__tools">
            <button type="button" className="tool" onClick={togglePause} disabled={!active} data-cursor>
              {phase === 'paused' ? <Play size={18} aria-hidden="true" /> : <Pause size={18} aria-hidden="true" />}
              {phase === 'paused' ? 'Resume' : 'Pause'}
            </button>
            <button type="button" className="tool" onClick={start} disabled={phase === 'ready'} data-cursor>
              <RotateCcw size={18} aria-hidden="true" /> Restart
            </button>
          </div>

          <ul className="tet__keys" aria-label="Keyboard controls">
            <li><kbd>←</kbd><kbd>→</kbd> Move</li>
            <li><kbd>↑</kbd> Rotate</li>
            <li><kbd>↓</kbd> Soft drop</li>
            <li><kbd>Space</kbd> Hard drop</li>
            <li><kbd>P</kbd> Pause / resume</li>
            {playing && !focused && <li className="tet__hint">Click the board to use your keyboard.</li>}
          </ul>

          <div className="tet__pad" role="group" aria-label="On-screen controls">
            <button type="button" className="pad pad--l" aria-label="Move left" {...pad('left', true)}><ArrowLeft size={26} aria-hidden="true" /></button>
            <button type="button" className="pad pad--d" aria-label="Soft drop" {...pad('down', true)}><ArrowDown size={26} aria-hidden="true" /></button>
            <button type="button" className="pad pad--r" aria-label="Move right" {...pad('right', true)}><ArrowRight size={26} aria-hidden="true" /></button>
            <button type="button" className="pad pad--rot" aria-label="Rotate" {...pad('rotate')}><RotateCw size={26} aria-hidden="true" /><span>Rotate</span></button>
            <button type="button" className="pad pad--hd" aria-label="Hard drop" {...pad('drop')}><ChevronsDown size={26} aria-hidden="true" /><span>Drop</span></button>
          </div>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">{status}</p>
    </div>
  )
}
