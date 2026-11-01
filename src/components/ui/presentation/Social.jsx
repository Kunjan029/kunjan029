import { useRef, useState } from 'react'
import { Bookmark, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, User } from 'lucide-react'
import { Art, Pager } from './shared.jsx'

const SWIPE = 50

// Instagram-inspired shell: media first, then profile row, action icons and caption on narrow screens;
// media left and a side panel on wide ones. No likes, comments or follower numbers are ever shown.
function IgShell({ project, media, sponsored = false, phone = null }) {
  const name = project.client || 'Your brand'
  return (
    <article className={`ig${phone ? ' ig--phone' : ''}`}>
      <div className="ig__media">{media}</div>
      <div className="ig__side">
        <header className="ig__head">
          <span className="ig__av" aria-hidden="true"><User size={16} /></span>
          <span className="ig__who"><b>{name}</b>{sponsored && <small>Sponsored</small>}</span>
        </header>
        <div className="ig__actions" aria-hidden="true">
          <span><Heart size={22} /><MessageCircle size={22} /><Send size={22} /></span>
          <Bookmark size={22} />
        </div>
        {project.description && <p className="ig__caption"><b>{name}</b> {project.description}</p>}
      </div>
      {phone && (
        <aside className="ig__phone" aria-hidden="true">
          <div className="ig__screen">
            <span className="ig__notch" />
            <div className="ig__head ig__head--feed">
              <span className="ig__av"><User size={14} /></span>
              <span className="ig__who"><b>{name}</b>{sponsored && <small>Sponsored</small>}</span>
            </div>
            <img className="ig__feedimg" src={phone.src} alt="" draggable={false} />
            <div className="ig__actions ig__actions--feed">
              <span><Heart size={20} /><MessageCircle size={20} /><Send size={20} /></span>
              <Bookmark size={20} />
            </div>
            {project.description && <p className="ig__caption ig__caption--feed"><b>{name}</b> {project.description}</p>}
            <span className="ig__home" />
          </div>
          <p className="ig__phone-note">How it looks in a phone feed</p>
        </aside>
      )}
    </article>
  )
}

// One post, or a chooser when several separate posts were supplied
export function InstagramPost({ project, onOpen, sponsored = false }) {
  const [i, setI] = useState(0)
  const image = project.images[i]
  return (
    <>
      <IgShell project={project} sponsored={sponsored} phone={image} media={<Art key={i} image={image} index={i} onOpen={onOpen} eager className="ig__art" />} />
      <Pager count={project.images.length} index={i} onChange={setI} label="Post" />
    </>
  )
}

// Carousel: one slide at a time, arrows on desktop, swipe on touch, position counter. Order is exactly as supplied.
export function InstagramCarousel({ project, onOpen }) {
  const slides = project.images
  const [i, setI] = useState(0)
  const [ratio, setRatio] = useState(null)
  const drag = useRef(null)
  const moved = useRef(false)
  const go = (d) => setI((v) => Math.min(slides.length - 1, Math.max(0, v + d)))

  const onPointerDown = (e) => { drag.current = e.clientX; moved.current = false }
  const onPointerMove = (e) => { if (drag.current != null && Math.abs(e.clientX - drag.current) > 8) moved.current = true }
  const onPointerUp = (e) => {
    if (drag.current == null) return
    const dx = e.clientX - drag.current
    drag.current = null
    if (Math.abs(dx) >= SWIPE) go(dx < 0 ? 1 : -1)
  }
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); go(1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); go(-1) }
  }

  const media = (
    <div
      className="igc"
      role="group"
      aria-roledescription="carousel"
      aria-label={`${project.title}, slide ${i + 1} of ${slides.length}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { drag.current = null }}
      style={ratio ? { '--r': ratio } : undefined}
    >
      <button
        type="button"
        key={i}
        className="igc__slide"
        onClick={() => { if (!moved.current) onOpen?.(i) }}
        aria-label={`Open slide ${i + 1} of ${slides.length} in the original viewer`}
        data-cursor-label="VIEW"
      >
        <img
          src={slides[i].src}
          alt={slides[i].alt}
          draggable={false}
          decoding="async"
          onLoad={(e) => { if (i === 0 && !ratio) setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight) }}
        />
      </button>
      <span className="igc__count" aria-hidden="true">{i + 1}/{slides.length}</span>
      <button type="button" className="igc__nav igc__nav--prev" onClick={() => go(-1)} disabled={i === 0} aria-label="Previous slide"><ChevronLeft size={20} /></button>
      <button type="button" className="igc__nav igc__nav--next" onClick={() => go(1)} disabled={i === slides.length - 1} aria-label="Next slide"><ChevronRight size={20} /></button>
      <span className="igc__dots" aria-hidden="true">{slides.map((_, d) => <i key={d} className={d === i ? 'is-on' : ''} />)}</span>
    </div>
  )
  return (
    <>
      <IgShell project={project} media={media} />
      <p className="sr-only" role="status" aria-live="polite">Slide {i + 1} of {slides.length}</p>
    </>
  )
}
