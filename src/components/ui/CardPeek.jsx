import { useEffect, useRef, useState } from 'react'
import './CardPeek.css'

// Quick look at a project's other images right on the card:
// desktop -> flips through them while the pointer rests on the card
// touch   -> flips through them while the card sits in the middle of the screen
// Extra images only load once the card is first activated. Off with reduced motion.
const STEP = 1100

export default function CardPeek({ project }) {
  const ref = useRef(null)
  const [frames] = useState(() => (project.images || []).filter((im) => im?.src && im.src !== project.cover?.src))
  const [armed, setArmed] = useState(false)
  const [idx, setIdx] = useState(-1) // -1 = cover showing

  useEffect(() => {
    if (!frames.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const media = ref.current?.closest('.work-card__media')
    if (!media) return
    let timer = 0
    const start = () => {
      setArmed(true)
      clearInterval(timer)
      // first step a touch sooner so the effect is noticed, then a steady rhythm
      let i = -1
      const tick = () => { i = i + 1 >= frames.length ? -1 : i + 1; setIdx(i) }
      timer = setTimeout(() => { tick(); timer = setInterval(tick, STEP) }, 450)
    }
    const stop = () => { clearTimeout(timer); clearInterval(timer); setIdx(-1) }

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (fine) {
      media.addEventListener('pointerenter', start)
      media.addEventListener('pointerleave', stop)
      media.addEventListener('focus', start)
      media.addEventListener('blur', stop)
      return () => {
        stop()
        media.removeEventListener('pointerenter', start)
        media.removeEventListener('pointerleave', stop)
        media.removeEventListener('focus', start)
        media.removeEventListener('blur', stop)
      }
    }
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: '-30% 0px -30% 0px' })
    io.observe(media)
    return () => { stop(); io.disconnect() }
  }, [frames])

  if (!frames.length) return null
  const fit = project.fit || 'contain'
  return (
    <span ref={ref} className={`peek${idx >= 0 ? ' is-on' : ''}`} aria-hidden="true">
      {armed && frames.map((im, i) => (
        <span key={im.src} className={`peek__f${i === idx ? ' is-cur' : ''}`}>
          {fit === 'contain' && <img className="peek__bg" src={im.src} alt="" draggable={false} decoding="async" />}
          <img className="peek__img" src={im.src} alt="" draggable={false} decoding="async" style={{ objectFit: fit, objectPosition: project.focus }} />
        </span>
      ))}
      <span className="peek__dots">
        {[-1, ...frames.map((_, i) => i)].map((i) => <i key={i} className={i === idx ? 'is-cur' : ''} />)}
      </span>
    </span>
  )
}
