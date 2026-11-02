import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import Reveal from '../ui/Reveal.jsx'
import { BOOKS, examplesFor } from './archiveData.js'
import { CoverArt, PlaceholderArt } from './ArchiveArt.jsx'
import './CreativeArchive.css'

gsap.registerPlugin(ScrollTrigger)

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const CLOSE_MS = 700

const bookVars = (b) => ({ '--hue': b.hue, '--h': b.h, '--t': b.t })

// One cover design per book, drawn from the same pieces so they read as a set
function Cover({ book }) {
  return (
    <span className={`cover cover--${book.cover}`} style={{ '--hue': book.hue }}>
      <span className="cover__bind" aria-hidden="true" />
      <CoverArt kind={book.cover} />
      <span className="cover__top"><span>BOOK {book.num}</span>{book.year && <span>{book.year}</span>}</span>
      <span className="cover__title">{book.title}</span>
    </span>
  )
}

// The inside-cover page: number, title, year
function TitlePage({ book }) {
  return (
    <div className="tp" style={{ '--hue': book.hue }}>
      <span className="tp__art" aria-hidden="true"><CoverArt kind={book.cover} /></span>
      <p className="tp__k">BOOK {book.num} OF {String(BOOKS.length).padStart(2, '0')}</p>
      <p className="tp__num" aria-hidden="true">{book.num}</p>
      <h3 className="tp__title">{book.title}</h3>
      {book.year && <p className="tp__year"><span>{book.year}</span></p>}
    </div>
  )
}

function Example({ ex, hue }) {
  return (
    <figure className="ex" style={{ '--hue': hue }}>
      {ex.placeholder ? (
        <div className="ex__frame ex__frame--ph"><PlaceholderArt kind={ex.art} /></div>
      ) : (
        <div className="ex__frame"><img src={ex.src} alt={ex.alt || ex.label} loading="lazy" style={{ objectFit: ex.fit || 'cover', objectPosition: ex.focus || 'center' }} /></div>
      )}
      <figcaption>{ex.label}</figcaption>
    </figure>
  )
}

export default function CreativeArchive() {
  const rootRef = useRef(null)
  const dlgRef = useRef(null)
  const closeTimer = useRef(0)
  const [open, setOpen] = useState(null) // index of the book being read, or null
  const [swung, setSwung] = useState(false) // cover swung open
  const [status, setStatus] = useState('')
  const isOpen = open !== null
  const book = isOpen ? BOOKS[open] : null

  // Show the dialog once it has rendered, then swing the cover open on the next frames
  useEffect(() => {
    if (!isOpen) return
    const d = dlgRef.current
    if (d && !d.open) d.showModal()
    document.body.style.overflow = 'hidden'
    let raf2
    const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => setSwung(true)) })
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2) }
  }, [isOpen])

  useEffect(() => () => { clearTimeout(closeTimer.current); document.body.style.overflow = '' }, [])

  const openBook = (i) => {
    clearTimeout(closeTimer.current)
    setSwung(false)
    setOpen(i)
    setStatus(`Opened book ${BOOKS[i].num}, ${BOOKS[i].title}.`)
  }

  const closeBook = () => {
    if (!isOpen) return
    setSwung(false) // cover swings shut first
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => {
      dlgRef.current?.close() // focus returns to the book that was clicked
      document.body.style.overflow = ''
      setOpen(null)
      setStatus('Back to the library.')
    }, reduceMotion() ? 0 : CLOSE_MS)
  }

  const go = (step) => {
    const n = open + step
    if (n < 0 || n >= BOOKS.length) return
    setOpen(n)
    setStatus(`Book ${BOOKS[n].num}, ${BOOKS[n].title}.`)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
  }

  // Scroll entrance for the heading and the books (skipped with reduced motion)
  useLayoutEffect(() => {
    const root = rootRef.current
    const mm = gsap.matchMedia(root)
    const st = (trigger, start = 'top 82%') => ({ trigger, start, once: true })
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.arc__label', { y: 16, opacity: 0, duration: 0.7, scrollTrigger: st('.arc__intro') })
      gsap.from('.arc__title .rv__in', { yPercent: 115, duration: 1, ease: 'power4.out', stagger: 0.05, scrollTrigger: st('.arc__title') })
      gsap.from('.arc__lead', { y: 24, opacity: 0, duration: 0.8, delay: 0.2, scrollTrigger: st('.arc__title') })
      gsap.from('.lib__slot', { y: 60, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12, scrollTrigger: st('.lib', 'top 88%') })
      document.fonts?.ready.then(() => ScrollTrigger.refresh())
    })
    return () => mm.revert()
  }, [])

  const examples = book ? examplesFor(book) : []

  return (
    <div className="block arc" ref={rootRef}>
      <div className="arc__intro">
        <p className="arc__label">THE CREATIVE ARCHIVE</p>
        <h3 className="arc__title">
          <span className="line"><Reveal text="PICK A BOOK." accentDots /></span>
          <span className="line"><Reveal text="READ THE STORY." accentDots /></span>
        </h3>
        <p className="arc__lead">Four chapters of my design journey, kept in one small archive. Tap or click a book to open it.</p>
      </div>

      <ul className="lib" aria-label="Library of four books">
        {BOOKS.map((b, i) => (
          <li key={b.id} className="lib__slot">
            <button type="button" className="bk" style={bookVars(b)} onClick={() => openBook(i)} aria-label={`Open book ${b.num}: ${b.title}${b.year ? `, ${b.year}` : ''}`} data-cursor>
              <span className="bk__scene" aria-hidden="true">
                <span className="bk__body">
                  <span className="bk__face bk__front"><Cover book={b} /></span>
                  <span className="bk__face bk__spine"><span className="bk__spine-n">{b.num}</span><span className="bk__spine-t">{b.title}</span></span>
                  <span className="bk__face bk__pages" />
                  <span className="bk__face bk__back" />
                </span>
                <span className="bk__shadow" />
              </span>
              <span className="bk__cap"><b>{b.num}</b> {b.title}{b.year ? <i> · {b.year}</i> : null}</span>
            </button>
          </li>
        ))}
      </ul>

      {isOpen && (
        <dialog
          ref={dlgRef}
          className="rd"
          aria-label={`Book ${book.num} of ${BOOKS.length}: ${book.title}`}
          onCancel={(e) => { e.preventDefault(); closeBook() }}
          onClick={(e) => { if (e.target === dlgRef.current) closeBook() }}
          onKeyDown={onKeyDown}
          style={{ '--hue': book.hue }}
        >
          <div className="rd__wrap">
            <div className="rd__bar">
              <p className="rd__count">BOOK {book.num} <span>/ {String(BOOKS.length).padStart(2, '0')}</span></p>
              <button type="button" className="rd__close" onClick={closeBook} data-cursor autoFocus><X size={18} aria-hidden="true" /> Back to library</button>
            </div>

            <div className="rd__stage">
            <button type="button" className="rd__arrow rd__arrow--prev" onClick={() => go(-1)} disabled={open === 0} aria-label="Previous book" data-cursor><ArrowLeft size={26} aria-hidden="true" /></button>
            <div className={`rd__book${swung ? ' is-open' : ''}`}>
              <div className="rd__page rd__page--base" aria-hidden="true" />
              <div className="rd__page rd__page--l"><TitlePage book={book} /></div>

              <div className="rd__page rd__page--r">
                <div className="story" key={book.id}>
                  <p className="story__k">THE STORY</p>
                  <p className="story__t">{book.story}</p>
                  <p className="story__k story__k--ex">{examples[0]?.placeholder ? 'WHAT THIS CHAPTER COVERS' : 'FROM THE PORTFOLIO'}</p>
                  <div className={`story__grid story__grid--${Math.min(examples.length, 4)}`}>
                    {examples.map((ex) => <Example key={ex.label} ex={ex} hue={book.hue} />)}
                  </div>
                </div>
              </div>

              <div className="rd__cover" aria-hidden="true">
                <div className="rd__face rd__face--front"><Cover book={book} /></div>
                <div className="rd__face rd__face--back"><TitlePage book={book} /></div>
              </div>
              <span className="rd__crease" aria-hidden="true" />
            </div>
            <button type="button" className="rd__arrow rd__arrow--next" onClick={() => go(1)} disabled={open === BOOKS.length - 1} aria-label="Next book" data-cursor><ArrowRight size={26} aria-hidden="true" /></button>
            </div>

            <nav className="rd__nav" aria-label="Books">
              <button type="button" className="rd__step" aria-label="Previous book" onClick={() => go(-1)} disabled={open === 0} data-cursor>
                <ArrowLeft size={18} aria-hidden="true" /><span><small>Previous</small>{open > 0 ? BOOKS[open - 1].title : ''}</span>
              </button>
              <ol className="rd__dots">
                {BOOKS.map((b, i) => (
                  <li key={b.id}><button type="button" className={`rd__dot${i === open ? ' is-on' : ''}`} style={{ '--hue': b.hue }} onClick={() => setOpen(i)} aria-label={`Book ${b.num}: ${b.title}`} aria-current={i === open ? 'true' : undefined} data-cursor>{b.num}</button></li>
                ))}
              </ol>
              <button type="button" className="rd__step rd__step--next" aria-label="Next book" onClick={() => go(1)} disabled={open === BOOKS.length - 1} data-cursor>
                <span><small>Next</small>{open < BOOKS.length - 1 ? BOOKS[open + 1].title : ''}</span><ArrowRight size={18} aria-hidden="true" />
              </button>
            </nav>
          </div>
        </dialog>
      )}

      <p className="sr-only" role="status" aria-live="polite">{status}</p>
    </div>
  )
}
