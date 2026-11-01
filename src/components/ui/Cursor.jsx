import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './Cursor.css'

// What the cursor reacts to. A label can be forced with data-cursor-label="VIEW".
const TARGETS = '[data-cursor-label], a[href], button, [role="button"], summary, label[for], input, textarea, select, .char, [data-cursor]'
const TEXT_FIELD = 'input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]), textarea'
const supportsPopover = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype

// -> mode: '' (default ring) | 'soft' (grown ring) | 'label' (filled ring + text) | 'text' (native I-beam)
function read(t) {
  if (!t) return { mode: '', label: '' }
  if (t.matches(TEXT_FIELD)) return { mode: 'text', label: '' }
  if (t.matches(':disabled, [aria-disabled="true"]')) return { mode: '', label: '' }
  const custom = t.getAttribute('data-cursor-label')
  if (custom) return { mode: 'label', label: custom }
  if (t.matches('a[href]')) return { mode: 'label', label: (t.getAttribute('href') || '').startsWith('#') ? 'GO' : 'OPEN' }
  if (t.matches('button, [role="button"], summary, label[for], input, select')) return { mode: 'label', label: 'CLICK' }
  return { mode: 'soft', label: '' }
}

// Is the surface under the cursor light? (lime, peach, off-white...) Then the cursor flips to black so it stays visible.
const toneCache = new WeakMap()
function isLight(el) {
  for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
    if (toneCache.has(n)) return toneCache.get(n)
    const m = getComputedStyle(n).backgroundColor.match(/rgba?\(([^)]+)\)/)
    if (!m) continue
    const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number)
    if (a < 0.6) continue
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
    const light = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.4
    toneCache.set(n, light)
    return light
  }
  return false // page background is dark
}

// Desktop, fine pointer, motion allowed only. Everywhere else the system cursor is left completely alone.
export default function Cursor() {
  const layerRef = useRef(null)
  const ringRef = useRef(null)
  const dotRef = useRef(null)
  const labelRef = useRef(null)

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const layer = layerRef.current
      const ring = ringRef.current
      const dot = dotRef.current
      const labelEl = labelRef.current
      const root = document.documentElement

      // Cursor lives in the top layer so it stays visible above the project modal (a native <dialog>)
      const promote = () => {
        if (!supportsPopover) return
        try { layer.hidePopover() } catch { /* not open yet */ }
        try { layer.showPopover() } catch { /* unsupported */ }
      }
      promote()

      gsap.set([ring, dot], { xPercent: -50, yPercent: -50 })
      const rx = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3' })
      const ry = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3' })
      const dx = gsap.quickTo(dot, 'x', { duration: 0.06, ease: 'none' })
      const dy = gsap.quickTo(dot, 'y', { duration: 0.06, ease: 'none' })

      let last = null
      let lastRaw = null
      let px = 0
      let py = 0
      const setTarget = (el) => {
        if (el !== lastRaw) {
          lastRaw = el
          layer.dataset.tone = el && isLight(el) ? 'light' : 'dark'
        }
        const t = el?.closest?.(TARGETS) ?? null
        if (t === last) return
        last = t
        const { mode, label } = read(t)
        if (label) labelEl.textContent = label
        layer.dataset.mode = mode
      }

      const onMove = (e) => {
        if (e.pointerType === 'touch') return
        px = e.clientX
        py = e.clientY
        rx(px); ry(py); dx(px); dy(py)
        if (!layer.classList.contains('is-visible')) {
          layer.classList.add('is-visible')
          if (supportsPopover) root.classList.add('cc') // hide the system arrow only when ours is guaranteed visible
        }
        setTarget(e.target)
      }
      const onLeave = () => layer.classList.remove('is-visible')

      const ripple = (x, y) => {
        const r = document.createElement('span')
        r.className = 'cursor__ripple'
        layer.appendChild(r)
        gsap.set(r, { x, y, xPercent: -50, yPercent: -50, scale: 0.3, opacity: 0.7 })
        gsap.to(r, { scale: 2.4, opacity: 0, duration: 0.55, ease: 'power2.out', onComplete: () => r.remove() })
      }
      const onDown = (e) => {
        if (e.pointerType === 'touch') return
        layer.classList.add('is-down')
        ripple(e.clientX, e.clientY)
      }
      const onUp = () => layer.classList.remove('is-down')

      // Keyboard users: step aside and give the system cursor back until the mouse moves again
      const onKey = (e) => {
        if (e.key !== 'Tab') return
        layer.classList.remove('is-visible')
        root.classList.remove('cc')
      }

      // The element under a still pointer changes while scrolling
      let raf = 0
      const onScroll = () => {
        if (raf || !layer.classList.contains('is-visible')) return
        raf = requestAnimationFrame(() => { raf = 0; setTarget(document.elementFromPoint(px, py)) })
      }

      // A dialog opened after the cursor was mounted would sit above it: bring the cursor back on top
      const obs = new MutationObserver((list) => {
        if (list.some((m) => m.target.matches?.('dialog[open]'))) promote()
      })
      obs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] })

      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('pointerdown', onDown, { passive: true })
      window.addEventListener('pointerup', onUp, { passive: true })
      window.addEventListener('pointercancel', onUp, { passive: true })
      window.addEventListener('keydown', onKey)
      window.addEventListener('scroll', onScroll, { passive: true })
      root.addEventListener('pointerleave', onLeave)
      return () => {
        obs.disconnect()
        cancelAnimationFrame(raf)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerdown', onDown)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        window.removeEventListener('keydown', onKey)
        window.removeEventListener('scroll', onScroll)
        root.removeEventListener('pointerleave', onLeave)
        root.classList.remove('cc')
        layer.classList.remove('is-visible', 'is-down')
        layer.dataset.mode = ''
        layer.dataset.tone = 'dark'
        layer.querySelectorAll('.cursor__ripple').forEach((r) => r.remove())
        if (supportsPopover) { try { layer.hidePopover() } catch { /* already closed */ } }
      }
    })
    return () => mm.revert()
  }, [])

  return (
    <div ref={layerRef} className="cursor-layer" popover="manual" aria-hidden="true" data-mode="" data-tone="dark">
      <div ref={ringRef} className="cursor">
        <span className="cursor__ring"><span ref={labelRef} className="cursor__label" /></span>
      </div>
      <span ref={dotRef} className="cursor__dot" />
    </div>
  )
}
