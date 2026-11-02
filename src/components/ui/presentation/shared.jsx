import { useEffect, useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { openZoom } from '../ZoomLightbox.jsx'

// Natural pixel size of an image, so presentations can respect original dimensions and ratios
export function useNatural(src) {
  const [size, setSize] = useState(null)
  useEffect(() => {
    if (!src) return
    let live = true
    const im = new Image()
    im.onload = () => live && setSize({ w: im.naturalWidth, h: im.naturalHeight })
    im.src = src
    return () => { live = false }
  }, [src])
  return size
}

// An artwork that opens the original image viewer. Never cropped, never stretched.
export function Art({ image, index, onOpen, className = '', eager = false, label }) {
  return (
    <button
      type="button"
      className={`px-art ${className}`}
      onClick={(e) => { if (e.target.closest?.('.zoom-btn')) { e.stopPropagation(); openZoom({ src: image.src, alt: image.alt }); return } onOpen?.(index) }}
      aria-label={label || `Open image ${index + 1} in the original viewer`}
      data-cursor-label="VIEW"
    >
      <img src={image.src} alt={image.alt} draggable={false} loading={eager ? 'eager' : 'lazy'} decoding="async" />
      <span className="zoom-btn" role="img" aria-label="Enlarge image"><Maximize2 size={16} aria-hidden="true" /></span>
    </button>
  )
}

// Neutral placeholder bars: stand in for page text without inventing any content
export const Bar = ({ w = '100%', h = 10, className = '' }) => <span className={`px-bar ${className}`} style={{ width: w, height: h }} aria-hidden="true" />

// Pager used when a project supplies several independent images or pairs: small image thumbnails (numbers only if no image exists)
export function Pager({ count, index, onChange, label = 'Image', images }) {
  if (count < 2) return null
  return (
    <div className="px-pager" role="group" aria-label={`${label} selector`}>
      {Array.from({ length: count }, (_, i) => {
        const src = images?.[i]?.src
        return (
          <button key={i} type="button" className={`${i === index ? 'is-on' : ''}${src ? ' has-thumb' : ''}`} onClick={() => onChange(i)} aria-label={`${label} ${i + 1}`} aria-current={i === index}>
            {src ? <img src={src} alt="" draggable={false} loading="lazy" decoding="async" /> : String(i + 1).padStart(2, '0')}
          </button>
        )
      })}
    </div>
  )
}

// Browser window chrome for website placements
export function Browser({ children, className = '' }) {
  return (
    <div className={`px-browser ${className}`}>
      <div className="px-browser__bar" aria-hidden="true">
        <i /><i /><i /><span />
      </div>
      <div className="px-browser__page">{children}</div>
    </div>
  )
}
