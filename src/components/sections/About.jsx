import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Layers, Palette, Shapes, Sparkles } from 'lucide-react'
import Container from '../ui/Container.jsx'
import Availability from '../ui/Availability.jsx'
import Reveal from '../ui/Reveal.jsx'
import './About.css'

gsap.registerPlugin(ScrollTrigger)

const INDUSTRIES = ['E-commerce', 'Skincare & wellness', 'Fashion & clothing', 'Perfume', 'Real estate', 'Events', 'Tech expos', 'Travel']

// Compact journey: one line per milestone
const MILESTONES = [
  { when: '2009', title: 'Started with Photoshop' },
  { when: '2011', title: 'Designing professionally: wedding albums, banners, print' },
  { when: '2019', title: 'Brand and campaign work at a graphics-focused IT company' },
  { when: 'Today', title: 'Freelance projects and ongoing collaborations' },
]

const STATS = [
  { name: 'Photoshop', rank: 'EXPERT', fill: 1, quip: 'Home turf.' },
  { name: 'Illustrator', rank: 'ADVANCED', fill: 0.8, quip: 'Vectors, logos, done.' },
  { name: 'Premiere Pro', rank: 'INTERMEDIATE', fill: 0.5, quip: 'Cutting it together.' },
  { name: 'Figma', rank: 'ADVANCED', fill: 0.7, quip: 'Frames, flows, done.' },
  { name: 'Canva', rank: 'ADVANCED', fill: 0.8, quip: 'Fast, clean, on brand.' },
  { name: 'Visual Creativity', rank: 'HIGH', fill: 0.8, quip: 'Pixels, but make it loud.' },
  { name: 'Attention to Detail', rank: 'HIGH', fill: 0.8, quip: 'Will spot that 1px misalignment.' },
  { name: 'Problem Solving', rank: 'HIGH', fill: 0.8, quip: 'Brief in, solution out.' },
  { name: 'Time Management', rank: 'ALWAYS ON', fill: 1, quip: 'Deadlines never wait.', live: true },
  { name: 'Creative Thinking', rank: 'ALWAYS ON', fill: 1, quip: 'There is no off switch.', live: true },
]

// Two halves of the card: the software on the left, the mindset on the right
const STAT_GROUPS = [
  { label: 'Tools', items: STATS.slice(0, 5) },
  { label: 'Traits', items: STATS.slice(5) },
]

const FACTS = [
  { v: 'year', icon: Layers, hook: '2009', fact: 'Photoshop has been part of my life since 2009.' },
  { v: 'lab', icon: Palette, hook: 'Style lab', fact: 'I love experimenting with visual styles.' },
  { v: 'morph', icon: Shapes, hook: 'Complex in, simple out', fact: 'I enjoy turning complex ideas into simple visuals.' },
  { v: 'spark', icon: Sparkles, hook: 'Still curious', fact: 'I’m always curious about new creative tools and workflows.' },
]

export default function About() {
  const rootRef = useRef(null)
  const burstRef = useRef(null)
  const [active, setActive] = useState(null) // inspected stat (touch-friendly)
  const [flipped, setFlipped] = useState({})
  const [more, setMore] = useState(false) // fun stuff (stats + fun facts) is collapsed by default

  const flip = (i, on) => setFlipped((f) => ({ ...f, [i]: on ?? !f[i] }))

  // Easter egg: press the K badge
  function burst(e) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const layer = burstRef.current
    const badge = e.currentTarget
    gsap.fromTo(badge, { rotation: 0 }, { rotation: 360, duration: 0.8, ease: 'back.out(1.7)' })
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('i')
      layer.appendChild(s)
      const a = (i / 14) * Math.PI * 2
      const d = gsap.utils.random(40, 90)
      gsap.fromTo(s, { x: 0, y: 0, scale: 1, opacity: 1 }, {
        x: Math.cos(a) * d, y: Math.sin(a) * d, scale: 0, opacity: 0, rotation: gsap.utils.random(-180, 180),
        duration: gsap.utils.random(0.6, 1.1), ease: 'power3.out', onComplete: () => s.remove(),
      })
    }
  }

  useLayoutEffect(() => {
    const root = rootRef.current
    const mm = gsap.matchMedia(root)
    const st = (trigger, start = 'top 82%') => ({ trigger, start, once: true })

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.about__label', { y: 16, opacity: 0, duration: 0.7, scrollTrigger: st('.about__intro') })
      gsap.from('.about__title .rv__in', { yPercent: 115, duration: 1, ease: 'power4.out', stagger: 0.07, scrollTrigger: st('.about__title') })
      gsap.from('.about__lead', { y: 24, opacity: 0, duration: 0.8, delay: 0.3, scrollTrigger: st('.about__title') })
      gsap.from('.about__marks li', { y: 16, opacity: 0, duration: 0.7, delay: 0.5, stagger: 0.1, scrollTrigger: st('.about__title') })

      gsap.from('.snap__col', { y: 24, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: st('.snap') })

      gsap.from('.stat', { y: 24, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out', scrollTrigger: st('.stats__cols') })
      gsap.fromTo('.stat__fill', { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'power3.out', stagger: 0.12, delay: 0.3, scrollTrigger: st('.stats__cols') })
      gsap.from('.fact', { y: 70, opacity: 0, rotation: () => gsap.utils.random(-5, 5), duration: 0.9, ease: 'power3.out', stagger: 0.12, scrollTrigger: st('.facts__grid') })

      document.fonts?.ready.then(() => ScrollTrigger.refresh())
    })

    // Mouse-only lift on fact cards
    mm.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
      const cards = [...root.querySelectorAll('.fact')]
      const off = cards.map((c) => {
        const over = () => gsap.to(c, { y: -10, rotation: gsap.utils.random(-2, 2), duration: 0.4, ease: 'power3.out', overwrite: 'auto' })
        const out = () => gsap.to(c, { y: 0, rotation: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' })
        c.addEventListener('pointerenter', over)
        c.addEventListener('pointerleave', out)
        return () => { c.removeEventListener('pointerenter', over); c.removeEventListener('pointerleave', out) }
      })
      return () => off.forEach((f) => f())
    })

    return () => { mm.revert(); burstRef.current?.replaceChildren() }
  }, [])

  return (
    <section id="about" className="about" ref={rootRef}>
      <Container>
        {/* ---------- Intro ---------- */}
        <div className="about__intro">
          <p className="about__label">BEHIND THE PIXELS</p>
          <h2 className="about__title">
            <span className="line"><Reveal text="NOT JUST A DESIGNER." accentDots /></span>
            <span className="line"><Reveal text="A CREATIVE MIND." accentDots /></span>
          </h2>
          <p className="about__lead">Every pixel has a purpose. Every project has a story. I bring that care, and a strong eye for visual communication, to every freelance client project.</p>
          <ul className="about__marks" role="list">
            <li>Photoshop expert, since 2009</li>
          </ul>
          <p className="about__alsolabel">Also working with</p>
          <ul className="about__marks about__tools" role="list" aria-label="Also working with">
            {[['Illustrator', 'Vectors & logos'], ['Figma', 'Frames & flows'], ['Canva', 'Fast turnarounds'], ['Premiere Pro', 'Motion & reels']].map(([t, q]) => (
              <li key={t} data-q={q}><span className="tl__n">{t}</span><span className="tl__q" aria-hidden="true">{q}</span></li>
            ))}
          </ul>
        </div>

        {/* ---------- Snapshot: journey + industries, compact ---------- */}
        <div className="snap">
          <div className="snap__col">
            <h3 className="snap__title">My creative journey</h3>
            <ol className="snap__tl" role="list">
              {MILESTONES.map((m) => (
                <li key={m.when}><b>{m.when}</b><span>{m.title}</span></li>
              ))}
            </ol>
          </div>
          <div className="snap__col">
            <h3 className="snap__title">Industries</h3>
            <ul className="snap__tags" role="list">
              {INDUSTRIES.map((t) => <li key={t}>{t}</li>)}
            </ul>
            <p className="snap__cm">
              <b>Community:</b> founder of Pixelverse, a design community in Ahmedabad, and a volunteer with GDG Ahmedabad, GDG Cloud Ahmedabad and Echai. 500+ events volunteered.
            </p>
          </div>
        </div>

        <div className="about__morewrap">
          <button type="button" className="chip about__morebtn" aria-expanded={more} aria-controls="about-more" onClick={() => { setMore((v) => !v); setTimeout(() => ScrollTrigger.refresh(), 50) }} data-cursor>
            {more ? 'Hide the fun stuff' : 'Show the fun stuff: character stats & fun facts'}
          </button>
        </div>

        <div id="about-more" hidden={!more}>
        {/* ---------- Block 3: Character stats ---------- */}
        <div className="block stats">
          <div className="stats__intro">
            <h3 className="block__title">Character stats</h3>
            <p>Tap or hover a stat to inspect it. Try pressing the K badge too.</p>
          </div>
          <div className="stats__card">
            <div className="stats__head">
              <span className="stats__avatar-wrap">
                <button type="button" className="stats__avatar" onClick={burst} aria-label="K badge. Press for a surprise.">K</button>
                <span className="burst-layer" ref={burstRef} aria-hidden="true" />
              </span>
              <div>
                <p className="stats__name">Kunjan</p>
                <p className="stats__class">Class: Graphic Designer</p>
              </div>
              <Availability label="Online" className="stats__status" />
            </div>
            <div className="stats__cols">
              {STAT_GROUPS.map((g) => (
                <div key={g.label} className="stats__col">
                  <h4 className="stats__label">{g.label}</h4>
                  <ul className="stats__list" role="list">
              {g.items.map((s) => (
                <li key={s.name}>
                  <button
                    type="button"
                    className={`stat${s.live ? ' is-live' : ''}${active === s.name ? ' is-active' : ''}`}
                    aria-pressed={active === s.name}
                    onClick={() => setActive(active === s.name ? null : s.name)}
                    data-cursor
                  >
                    <span className="stat__top">
                      <span className="stat__name">{s.name}</span>
                      <span className="stat__rank">{s.rank}</span>
                    </span>
                    <span className="stat__bar"><span className="stat__fill" style={{ width: `${s.fill * 100}%` }} /></span>
                    <span className="stat__quip">{s.quip}</span>
                  </button>
                </li>
              ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---------- Block 4: Fun facts ---------- */}
        <div className="block">
          <h3 className="block__title">Fun facts</h3>
          <p className="block__hint">Hover or tap a card to flip it.</p>
          <div className="facts__grid">
            {FACTS.map(({ v, icon: Icon, hook, fact }, i) => (
              <button
                key={v}
                type="button"
                className={`fact fact--${v}${flipped[i] ? ' is-flipped' : ''}`}
                aria-pressed={!!flipped[i]}
                onClick={() => flip(i)}
                onPointerEnter={(e) => e.pointerType === 'mouse' && flip(i, true)}
                onPointerLeave={(e) => e.pointerType === 'mouse' && flip(i, false)}
                data-cursor
              >
                <span className="fact__inner">
                  <span className="fact__face fact__front">
                    <span className="fact__deco" aria-hidden="true" />
                    <Icon size={26} strokeWidth={1.75} aria-hidden="true" />
                    <span className="fact__hook">{hook}</span>
                  </span>
                  <span className="fact__face fact__back">{fact}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        </div>

      </Container>
    </section>
  )
}
