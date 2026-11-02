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

  const set = (next) => {
    const v = Math.min(MAX, Math.max(MIN, next))
    setZ(v)
    if (v === 1) setPos({ x: 0, y: 0 })
  }
  const reset = () => { setZ(1); setPos({ x: 0, y: 0 }) }
  const down = (e) => { if (z <= 1) return; drag.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }; e.currentTarget.setPointerCapture?.(e.pointerId) }
  const move = (e) => { if (drag.current) setPos({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }) }
  const up = () => { drag.current = null }

  return (
    <dialog
      ref={ref}
      className="zl"
      aria-label="Enlarged image"
      onClose={() => { setImg(null); drag.current = null }}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === '+' || e.key === '=') set(z + 0.5); if (e.key === '-') set(z - 0.5) }}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      {img && (
        <>
          <div
            className={`zl__stage${z > 1 ? ' is-zoomed' : ''}`}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
            onWheel={(e) => set(z - e.deltaY * 0.002)}
            onDoubleClick={() => (z > 1 ? reset() : set(2.5))}
          >
            <img src={img.src} alt={img.alt || ''} draggable={false} style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${z})` }} />
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
