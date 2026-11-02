import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, RotateCcw, X } from 'lucide-react'
import './ZoomLightbox.css'

// Opens any image enlarged. Anything on the page can call openZoom({ src, alt }).
export const openZoom = (detail) => { try { window.dispatchEvent(new CustomEvent('kp-zoom', { detail })) } catch { /* ignore */ } }

const MIN = 1
const MAX = 5

export default function ZoomLightbox() {
  const ref = useRef(null)
  const drag = useRef(null)
  const [img, setImg] = useState(null)
  const [z, setZ] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const on = (e) => { setImg(e.detail); setZ(1); setPos({ x: 0, y: 0 }) }
    window.addEventListener('kp-zoom', on)
    return () => window.removeEventListener('kp-zoom', on)
  }, [])
  useEffect(() => { if (img && ref.current && !ref.current.open) ref.current.showModal() }, [img])

  const stageRef = useRef(null)
  const imgRef = useRef(null)
  // Keeps the enlarged image inside reach: you can scroll to every edge but never lose it off-screen
  const clamp = (p, zoom) => {
    const st = stageRef.current, im = imgRef.current
    if (!st || !im) return p
    const mx = Math.max(0, (im.offsetWidth * zoom - st.clientWidth) / 2) + 40
    const my = Math.max(0, (im.offsetHeight * zoom - st.clientHeight) / 2) + 90
    return { x: Math.min(mx, Math.max(-mx, p.x)), y: Math.min(my, Math.max(-my, p.y)) }
  }
  const set = (next) => {
    const v = Math.min(MAX, Math.max(MIN, next))
    setZ(v)
    setPos((p) => (v === 1 ? { x: 0, y: 0 } : clamp(p, v)))
  }
  const panBy = (dx, dy) => setPos((p) => clamp({ x: p.x + dx, y: p.y + dy }, z))
  const zRef = useRef(1); zRef.current = z
  useEffect(() => {
    const st = stageRef.current
    if (!st) return
    // Wheel / trackpad scrolls the enlarged image; Ctrl + wheel (or a trackpad pinch) zooms it
    const wheel = (e) => {
      e.preventDefault()
      if (e.ctrlKey) setZ((v) => { const n = Math.min(MAX, Math.max(MIN, v - e.deltaY * 0.01)); if (n === 1) setPos({ x: 0, y: 0 }); return n })
      else if (zRef.current > 1) setPos((p) => clamp({ x: p.x - e.deltaX, y: p.y - e.deltaY }, zRef.current))
    }
    st.addEventListener('wheel', wheel, { passive: false })
    return () => st.removeEventListener('wheel', wheel)
  }, [img])
  const reset = () => { setZ(1); setPos({ x: 0, y: 0 }) }
  const down = (e) => { if (z <= 1) return; drag.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }; e.currentTarget.setPointerCapture?.(e.pointerId) }
  const move = (e) => { if (drag.current) setPos(clamp({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }, z)) }
  const up = () => { drag.current = null }

  return (
    <dialog
      ref={ref}
      className="zl"
      aria-label="Enlarged image"
      onClose={() => { setImg(null); drag.current = null }}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === '+' || e.key === '=') set(z + 0.5)
        if (e.key === '-') set(z - 0.5)
        if (z > 1 && e.key.startsWith('Arrow')) { e.preventDefault(); panBy(e.key === 'ArrowLeft' ? 80 : e.key === 'ArrowRight' ? -80 : 0, e.key === 'ArrowUp' ? 80 : e.key === 'ArrowDown' ? -80 : 0) }
      }}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      {img && (
        <>
          <div
            ref={stageRef}
            className={`zl__stage${z > 1 ? ' is-zoomed' : ''}`}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
            onDoubleClick={() => (z > 1 ? reset() : set(2.5))}
          >
            <img ref={imgRef} src={img.src} alt={img.alt || ''} draggable={false} style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${z})` }} />
          </div>
          <div className="zl__bar" role="group" aria-label="Zoom controls">
            <button type="button" onClick={() => set(z - 0.5)} disabled={z <= MIN} aria-label="Zoom out"><Minus size={18} /></button>
            <span aria-live="polite">{Math.round(z * 100)}%</span>
            <button type="button" onClick={() => set(z + 0.5)} disabled={z >= MAX} aria-label="Zoom in"><Plus size={18} /></button>
            <button type="button" onClick={reset} disabled={z === 1} aria-label="Reset zoom"><RotateCcw size={16} /></button>
          </div>
          <button type="button" className="zl__close" onClick={() => ref.current.close()} aria-label="Close enlarged image"><X size={20} /></button>
        </>
      )}
    </dialog>
  )
}
