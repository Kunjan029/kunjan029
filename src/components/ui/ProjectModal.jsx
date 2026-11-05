import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import { openZoom } from './ZoomLightbox.jsx'
import Button from './Button.jsx'
import ProjectVisual, { imageCount } from './ProjectVisual.jsx'
import Presentation, { hasContext } from './presentation/index.jsx'
import { CATEGORIES, METHODS } from '../../data/projects.js'
import './ProjectModal.css'

const SWIPE = 50 // px of horizontal drag that counts as a swipe

// Native <dialog>: focus trap, Escape and focus return come for free.
export default function ProjectModal({ project, onClose }) {
  const ref = useRef(null)
  const startX = useRef(null)
  const [idx, setIdx] = useState(0)
  const [mode, setMode] = useState('context') // context = real-world presentation, viewer = original image viewer
  const modeRef = useRef('context')
  modeRef.current = mode
  const ctx = hasContext(project)
  const showCtx = ctx && mode === 'context'
  const count = project ? imageCount(project) : 0

  useEffect(() => {
    const d = ref.current
    if (!project || !d) return
    setIdx(0)
    setMode('context')
    if (!d.open) d.showModal()
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (hasContext(project) && modeRef.current === 'context') return
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % count)
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + count) % count)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      if (d.open) d.close()
    }
  }, [project, count])

  const cat = project && CATEGORIES.find((c) => c.id === project.category)?.label
  const go = (step) => setIdx((i) => (i + step + count) % count)

  const onPointerDown = (e) => { startX.current = e.clientX }
  const onPointerUp = (e) => {
    if (startX.current == null || count < 2) return
    const dx = e.clientX - startX.current
    startX.current = null
    if (Math.abs(dx) >= SWIPE) go(dx < 0 ? 1 : -1)
  }

  const caption = project?.images?.[idx]?.caption
  const facts = project
    ? [
        project.client && ['Client', project.client],
        project.role && ['Role', project.role],
        project.tools?.length && ['Tools', project.tools.join(', ')],
      ].filter(Boolean)
    : []
  const paragraphs = project?.details ? project.details.split(/\n\s*\n/) : []

  return (
    <dialog
      ref={ref}
      className={`pm${showCtx ? ' pm--ctx' : ''}${project?.wide ? ' pm--wide' : ''}`}
      aria-label={project ? `${project.title} project details` : undefined}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      {project && (
        <div className="pm__body">
          <button type="button" className="pm__close" onClick={() => ref.current.close()} aria-label="Close project" data-cursor-label="CLOSE">
            <X size={20} />
          </button>

          {showCtx ? (
            <div className="pm__context">
              <Presentation project={project} onOpen={(i) => { setIdx(i); setMode('viewer') }} />
            </div>
          ) : (
            <div className="pm__gallery">
              {ctx && (
                <button type="button" className="pm__back" onClick={() => setMode('context')}><ArrowLeft size={16} aria-hidden="true" /> Back to preview</button>
              )}
            <div className="pm__stage" data-cursor-label={count > 1 ? 'DRAG' : undefined} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { startX.current = null }}>
              <ProjectVisual key={idx} project={project} index={idx} variant="full" eager />
              {count > 1 && (
                <>
                  <button type="button" className="pm__nav pm__nav--prev" onClick={() => go(-1)} aria-label="Previous image" data-cursor-label="PREV"><ChevronLeft size={22} /></button>
                  <button type="button" className="pm__nav pm__nav--next" onClick={() => go(1)} aria-label="Next image" data-cursor-label="NEXT"><ChevronRight size={22} /></button>
                </>
              )}
              {project.images?.[idx]?.src && (
                <button type="button" className="zoom-btn" onPointerDown={(e) => e.stopPropagation()} onClick={() => openZoom({ src: project.images[idx].src, alt: project.images[idx].alt })} aria-label="Enlarge image" data-cursor-label="ZOOM"><Maximize2 size={16} aria-hidden="true" /></button>
              )}
              <span className="pm__counter">{String(idx + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</span>
            </div>
            {caption && <p className="pm__caption">{caption}</p>}
            {count > 1 && (
              <ul className="pm__thumbs" role="list">
                {Array.from({ length: count }, (_, i) => (
                  <li key={i}>
                    <button type="button" className={`pm__thumb${i === idx ? ' is-on' : ''}`} onClick={() => setIdx(i)} aria-label={`Show image ${i + 1}`} aria-current={i === idx}>
                      <ProjectVisual project={project} index={i} variant="thumb" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            </div>
          )}

          {!showCtx && (<div className="pm__info">
            <p className="pm__meta">{[cat, METHODS.find((m) => m.id === project.method)?.label, project.year].filter(Boolean).join(' / ')}</p>
            <h3>{project.title}</h3>
            {(project.description || project.placeholder) && (
              <p className="pm__desc">{project.description || 'Short description goes here.'}</p>
            )}
            {paragraphs.map((t, i) => <p key={i} className="pm__desc pm__desc--detail">{t}</p>)}
            {project.story && (
              <div className="pm__story">
                <h4 className="pm__storyhead">How I solved it</h4>
                {[['Problem', project.story.problem], ['Approach', project.story.approach], ['Outcome', project.story.outcome]].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="pm__storyrow"><span>{k}</span><p>{v}</p></div>
                ))}
              </div>
            )}
            {facts.length > 0 && (
              <dl className="pm__facts">
                {facts.map(([k, v]) => (
                  <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
            )}
            {project.tags.length > 0 && (
              <ul className="pm__tags" role="list">
                {project.tags.map((t) => <li key={t}>{t}</li>)}
              </ul>
            )}
            {project.link && <Button href={project.link} target="_blank" rel="noopener noreferrer">View case study</Button>}
          </div>)}
        </div>
      )}
    </dialog>
  )
}
