import { useEffect, useRef } from 'react'

// Small helpers shared by the retro mini games (Racing, Tank, Brick Breaker).

// Calls cb(dt seconds) every animation frame while `on` is true.
export function useRaf(on, cb) {
  const ref = useRef(cb)
  ref.current = cb
  useEffect(() => {
    if (!on) return undefined
    let id, last = performance.now()
    const loop = (t) => { const dt = Math.min(0.05, (t - last) / 1000); last = t; ref.current(dt); id = requestAnimationFrame(loop) }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [on])
}

// Pause when the tab is hidden
export function useAutoPause(playing, pause) {
  const ref = useRef(pause)
  ref.current = pause
  useEffect(() => {
    if (!playing) return undefined
    const on = () => { if (document.hidden) ref.current() }
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [playing])
}

// Draws in a fixed W x H coordinate space, scaled to the canvas element's size.
export function fitCanvas(c, W, H) {
  if (!c) return null
  const w = c.clientWidth
  if (!w) return null
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const pw = Math.round(w * dpr), ph = Math.round((w * H / W) * dpr)
  if (c.width !== pw || c.height !== ph) { c.width = pw; c.height = ph }
  const ctx = c.getContext('2d')
  ctx.setTransform(pw / W, 0, 0, pw / W, 0, 0)
  return ctx
}

const GAME_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd'])
const ALIAS = { w: 'ArrowUp', a: 'ArrowLeft', s: 'ArrowDown', d: 'ArrowRight' }

// Held-key tracking for the board (keyboard) and the on-screen pad (touch)
export function useKeys() {
  const keys = useRef(new Set())
  const norm = (e) => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; return GAME_KEYS.has(k) ? (ALIAS[k] || k) : null }
  return {
    keys: keys.current,
    down: (e) => { const k = norm(e); if (!k) return null; e.preventDefault(); if (!e.repeat) keys.current.add(k); return k },
    up: (e) => { const k = norm(e); if (k) keys.current.delete(k) },
    clear: () => keys.current.clear(),
    hold: (k) => ({
      onPointerDown: (e) => { e.preventDefault(); keys.current.add(k) },
      onPointerUp: () => keys.current.delete(k),
      onPointerLeave: () => keys.current.delete(k),
      onPointerCancel: () => keys.current.delete(k),
    }),
  }
}

export function overlayFor({ phase, name, tagline, best, score, newBest, start, resume, extra }) {
  if (phase === 'ready') return { k: name.toUpperCase(), t: 'Ready when you are.', s: best ? `Your best: ${best}` : tagline, cta: 'START GAME', onClick: start }
  if (phase === 'over') return { k: 'GAME OVER', score, s: `${newBest ? 'NEW BEST! ' : ''}Best: ${Math.max(best, score)}${extra ? ` · ${extra}` : ''}`, cta: 'PLAY AGAIN', onClick: start }
  if (phase === 'paused') return { k: 'PAUSED', t: 'Take your time.', cta: 'RESUME', onClick: resume }
  return null
}
