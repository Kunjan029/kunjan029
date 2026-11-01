import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import { ArrowUpRight, Images } from 'lucide-react'
import Container from '../ui/Container.jsx'
import Reveal from '../ui/Reveal.jsx'
import ProjectVisual, { imageCount } from '../ui/ProjectVisual.jsx'
import ProjectModal from '../ui/ProjectModal.jsx'
import { CATEGORIES, METHODS, PROJECTS, HAS_REAL_WORK } from '../../data/projects.js'
import './Work.css'

gsap.registerPlugin(ScrollTrigger, Flip)

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const pad = (n) => String(n).padStart(3, '0')

// With real work, only offer filters that actually have projects behind them
const used = (key) => (o) => o.id === 'all' || !HAS_REAL_WORK || PROJECTS.some((p) => p[key] === o.id)
const CATS = CATEGORIES.filter(used('category'))
const METHS = METHODS.filter(used('method'))

// "GOOD": the second O flips into the 👌 emoji once when the line scrolls in, and again on hover.
function GoodWord() {
  const ref = useRef(null)
  const [ok, setOk] = useState(false)
  const timer = useRef(0)
  const play = () => {
    clearTimeout(timer.current)
    setOk(true)
    timer.current = setTimeout(() => setOk(false), 2200)
  }
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return
    let t
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      t = setTimeout(play, 500)
    }, { threshold: 0.8 })
    io.observe(el)
    return () => { io.disconnect(); clearTimeout(t); clearTimeout(timer.current) }
  }, [])
  return (
    <span ref={ref} className={`good${ok ? ' is-ok' : ''}`} onPointerEnter={(e) => e.pointerType === 'mouse' && !ok && play()} aria-label="GOOD">
      <span aria-hidden="true">GO</span>
      <span className="good__slot" aria-hidden="true">
        <span className="good__o">O</span>
        <span className="good__e">👌</span>
      </span>
      <span aria-hidden="true">D</span>
    </span>
  )
}

export default function Work() {
  const rootRef = useRef(null)
  const gridRef = useRef(null)
  const stateRef = useRef(null)
  const flipRef = useRef(null)
  const [filter, setFilter] = useState('all')
  const [method, setMethod] = useState('all')
  const [selected, setSelected] = useState(null)

  const matches = (p) => (filter === 'all' || p.category === filter) && (method === 'all' || p.method === method)
  const shown = PROJECTS.filter(matches).length

  // Art direction, computed on the VISIBLE order so every filter keeps its composition:
  //   1st card        -> lead   (full-width featured showcase)
  //   then in pairs   -> big (dominant) + sm (supporting), mirrored on every other pair
  //   a lone last one -> wide   (cinematic full-width closer)
  // One typographic statement sits after the first pair, only if more work follows it.
  const roleOf = {}
  const visible = PROJECTS.filter(matches)
  visible.forEach((p, v) => {
    if (v === 0) roleOf[p.id] = 'lead'
    else {
      const k = v - 1
      roleOf[p.id] = ((k >> 1) + (k & 1)) % 2 === 0 ? 'big' : 'sm'
    }
  })
  const last = visible.length - 1
  if (last >= 1 && (last - 1) % 2 === 0) roleOf[visible[last].id] = 'wide'
  const breakAfterId = visible.length > 3 ? visible[2].id : null

  // How many projects each chip would show given the OTHER active filter
  const catCount = (id) => PROJECTS.filter((p) => (id === 'all' || p.category === id) && (method === 'all' || p.method === method)).length
  const methodCount = (id) => PROJECTS.filter((p) => (id === 'all' || p.method === id) && (filter === 'all' || p.category === filter)).length

  function capture() {
    if (reduceMotion()) return
    flipRef.current?.progress(1) // finish a running transition before measuring
    stateRef.current = Flip.getState(gridRef.current.querySelectorAll('.work-card'))
  }

  function change(setter, current, id) {
    if (id === current) return
    capture()
    setter(id)
  }

  function reset() {
    if (filter === 'all' && method === 'all') return
    capture()
    setFilter('all')
    setMethod('all')
  }

  // Animate the layout change after React has toggled which cards are hidden
  useLayoutEffect(() => {
    const state = stateRef.current
    if (!state) return
    stateRef.current = null
    flipRef.current = Flip.from(state, {
      duration: 0.8,
      ease: 'power3.inOut',
      absolute: true,
      stagger: 0.05,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, delay: 0.25, ease: 'power3.out' }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.35, ease: 'power2.in' }),
    })
    ScrollTrigger.refresh()
  }, [filter, method])

  // A blurred extension of the same artwork fills the side areas, only on cards where the artwork does not already fill its frame
  useLayoutEffect(() => {
    const frames = [...rootRef.current.querySelectorAll('.work-card__media.has-img')]
    const update = (m) => {
      const im = m.querySelector('.pv__img--card')
      if (!im) return
      m.classList.toggle('has-mat', im.clientWidth > 0 && (im.clientWidth < m.clientWidth - 3 || im.clientHeight < m.clientHeight - 3))
    }
    const ro = new ResizeObserver((entries) => entries.forEach((e) => update(e.target.closest('.work-card__media') || e.target)))
    frames.forEach((m) => {
      const im = m.querySelector('.pv__img--card')
      ro.observe(m)
      if (im) { ro.observe(im); im.addEventListener('load', () => update(m)) }
      update(m)
    })
    return () => ro.disconnect()
  }, [])

  // Scroll entrances + image parallax
  useLayoutEffect(() => {
    const root = rootRef.current
    const mm = gsap.matchMedia(root)
    const st = (trigger, start = 'top 82%') => ({ trigger, start, once: true })
    const cleanups = []

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.work__label', { y: 16, opacity: 0, duration: 0.7, scrollTrigger: st('.work__intro') })
      gsap.from('.work__title .rv__in', { yPercent: 115, duration: 1, ease: 'power4.out', stagger: 0.07, scrollTrigger: st('.work__title') })
      gsap.from('.work__lead', { y: 24, opacity: 0, duration: 0.8, delay: 0.3, scrollTrigger: st('.work__title') })
      gsap.from('.work__filters .chip', { opacity: 0, scale: 0.92, duration: 0.5, stagger: 0.06, clearProps: 'all', scrollTrigger: st('.work__filters', 'top 90%') })

      // Projects fade in and rise 20px as they enter; cards entering together are staggered slightly
      const cards = gsap.utils.toArray('.work-card', root)
      gsap.set(cards, { y: 20, opacity: 0 })
      const io = new IntersectionObserver((entries) => {
        const hit = entries.filter((e) => e.isIntersecting).map((e) => e.target)
        if (!hit.length) return
        hit.forEach((c) => io.unobserve(c))
        gsap.to(hit, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', stagger: 0.09, clearProps: 'transform,opacity' })
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 })
      cards.forEach((c) => io.observe(c))
      cleanups.push(() => io.disconnect())
      document.fonts?.ready.then(() => ScrollTrigger.refresh())
      return () => cleanups.forEach((f) => f())
    })

    return () => { mm.revert(); flipRef.current?.kill() }
  }, [])

  return (
    <section id="work" className="work" ref={rootRef}>
      <Container>
        <div className="work__intro">
          <p className="work__label">SELECTED WORK / 001</p>
          <h2 className="work__title">
            <span className="line"><Reveal text="LESS TALK." accentDots /></span>
            <span className="line"><Reveal text="MORE GOOD DESIGN." accentDots /></span>
          </h2>
          <p className="work__lead">A collection of visuals, campaigns and creative experiments designed to make brands stand out.</p>
        </div>

        <div className="work__bar">
          <div className="work__controls">
          {CATS.length > 2 && (
            <div className="work__filters" role="group" aria-label="Filter projects by category">
              {CATS.map((c) => {
                const n = catCount(c.id)
                return (
                  <button key={c.id} type="button" className={`chip${filter === c.id ? ' is-on' : ''}`} aria-pressed={filter === c.id} disabled={n === 0 && filter !== c.id} onClick={() => change(setFilter, filter, c.id)}>
                    {c.label}<span className="chip__n" aria-hidden="true">{n}</span>
                    <span className="sr-only"> ({n})</span>
                  </button>
                )
              })}
            </div>
          )}
          {METHS.length > 2 && (
            <div className="work__methods" role="group" aria-label="Filter projects by how they were made">
              <span className="work__methods-label">Made with</span>
              <div className="seg">
                {METHS.map((m) => {
                  const n = methodCount(m.id)
                  return (
                    <button key={m.id} type="button" className={method === m.id ? 'is-on' : ''} aria-pressed={method === m.id} disabled={n === 0 && method !== m.id} onClick={() => change(setMethod, method, m.id)}>
                      {m.label}<span className="seg__n" aria-hidden="true">{n}</span>
                      <span className="sr-only"> ({n})</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          </div>
          <p className="work__count" aria-live="polite">
            <span className="sr-only">Showing </span>{String(shown).padStart(2, '0')} {shown === 1 ? 'project' : 'projects'}
          </p>
        </div>

        <div className="work__grid" ref={gridRef}>
          {PROJECTS.map((p, i) => {
            const n = imageCount(p)
            const cat = CATEGORIES.find((c) => c.id === p.category)?.label
            const role = roleOf[p.id] || 'sm'
            return (
              <Fragment key={p.id}>
                <article className={`work-card work-card--${role}${matches(p) ? '' : ' is-hidden'}`}>
                  <button type="button" className={`work-card__media${p.cover?.src && !p.tall ? ' has-img' : ''}${p.tall ? ' is-tall' : ''}`} onClick={() => setSelected(p)} aria-label={`Explore ${p.title}`} data-cursor data-cursor-label="VIEW">
                    {p.cover?.src && <img className="work-card__bg" src={p.cover.src} alt="" aria-hidden="true" draggable={false} loading="lazy" decoding="async" />}
                    <span className="work-card__fill"><ProjectVisual project={p} index={0} number={i + 1} /></span>
                    {role === 'lead' && <span className="work-card__flag">Featured Project</span>}
                    {n > 1 && <span className="work-card__count"><Images size={14} aria-hidden="true" />{n}</span>}
                    {p.method && <span className={`work-card__method is-${p.method}`}>{METHODS.find((m) => m.id === p.method)?.label}</span>}
                    <span className="work-card__pill">Explore Project <ArrowUpRight size={16} aria-hidden="true" /></span>
                  </button>
                  <div className="work-card__meta">
                    <p className="work-card__cat">
                      <span className="work-card__no">{pad(i + 1)}</span>
                      <span>{cat}</span>
                      {p.year ? <span>{p.year}</span> : null}
                    </p>
                    <h3>{p.title}</h3>
                    <div className="work-card__side">
                      {(p.description || p.placeholder) && <p className="work-card__desc">{p.description || 'Short description goes here.'}</p>}
                      {p.tags.length > 0 && (
                        <ul className="work-card__tags" role="list">
                          {p.tags.slice(0, 4).map((t) => <li key={t}>{t}</li>)}
                        </ul>
                      )}
                      <button type="button" className="work-card__link" onClick={() => setSelected(p)} data-cursor data-cursor-label="VIEW">
                        Explore Project <ArrowUpRight size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
                {p.id === breakAfterId && (
                  <p className="work__break">
                    <span className="work__break-a"><GoodWord /> DESIGN<i>.</i></span>
                    <span className="work__break-b">LOUD IDEAS<i>.</i></span>
                  </p>
                )}
              </Fragment>
            )
          })}
        </div>

        {shown === 0 && (
          <div className="work__empty">
            <p>Nothing matches these filters yet.</p>
            <button type="button" className="chip" onClick={reset}>Show all work</button>
          </div>
        )}
      </Container>

      <ProjectModal project={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
