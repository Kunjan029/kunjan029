import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MapPin, Layers, Lightbulb, PenTool, Palette, Shapes, Sparkles } from 'lucide-react'
import Container from '../ui/Container.jsx'
import Availability from '../ui/Availability.jsx'
import Reveal from '../ui/Reveal.jsx'
import { PROJECTS } from '../../data/projects.js'
import './About.css'

gsap.registerPlugin(ScrollTrigger)

const TILES = [
  { icon: PenTool, kicker: 'Visual', big: 'Storyteller' },
  { icon: MapPin, big: 'Ahmedabad', small: 'India' },
  { icon: Layers, big: '16+', small: 'Years of Graphic Design Experience' },
  { icon: Lightbulb, big: 'Passionate', small: 'About visual communication and creative problem-solving.' },
]

// Quiet line-art behind each card (decorative, dark at low opacity)
const DECO = [
  // pen tool: a bezier curve with anchors and handles
  <svg key="d1" viewBox="0 0 140 100" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 82C34 8 86 8 128 56" />
    <path d="M12 82L34 44M128 56L100 22" strokeDasharray="3 4" />
    <rect x="7" y="77" width="10" height="10" fill="currentColor" stroke="none" />
    <rect x="123" y="51" width="10" height="10" fill="currentColor" stroke="none" />
    <circle cx="34" cy="44" r="4" /><circle cx="100" cy="22" r="4" />
  </svg>,
  // location: ripples around a point
  <svg key="d2" viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="70" cy="70" r="12" /><circle cx="70" cy="70" r="30" strokeDasharray="2 5" /><circle cx="70" cy="70" r="50" /><circle cx="70" cy="70" r="70" strokeDasharray="2 5" />
  </svg>,
  // layers: offset stacked frames
  <svg key="d3" viewBox="0 0 140 120" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="52" y="44" width="76" height="62" rx="10" />
    <rect x="38" y="30" width="76" height="62" rx="10" />
    <rect x="24" y="16" width="76" height="62" rx="10" />
  </svg>,
  // idea: sparks and rays
  <svg key="d4" viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M78 14l6 20 20 6-20 6-6 20-6-20-20-6 20-6z" fill="currentColor" stroke="none" />
    <path d="M34 66l3 10 10 3-10 3-3 10-3-10-10-3 10-3z" fill="currentColor" stroke="none" />
    <path d="M96 78v12M90 84h12M54 20v8M50 24h8" />
    <path d="M18 104c24-6 48-24 70-50" strokeDasharray="2 6" />
  </svg>,
]

// ---------- Headline hover moments ----------
// "ideas" lights a bulb; "visuals" flips through random covers from the portfolio.
// Until real covers exist it shows numbered slots, and swaps to the real work automatically.
const SLOTS = (() => {
  const real = PROJECTS.filter((p) => p.cover?.src).map((p) => ({ src: p.cover.src }))
  return real.length ? real : PROJECTS.slice(0, 6).map((_, i) => ({ slot: i + 1 }))
})()
const pick = (prev) => {
  if (SLOTS.length < 2) return 0
  let n
  do { n = Math.floor(Math.random() * SLOTS.length) } while (n === prev)
  return n
}
const isMouse = (e) => e.pointerType === 'mouse' || e.pointerType === 'pen'
const noHover = () => window.matchMedia('(hover: none)').matches

function IdeasWord() {
  const [on, setOn] = useState(false)
  return (
    <span
      className={`mt__idea${on ? ' is-on' : ''}`}
      onPointerEnter={(e) => isMouse(e) && setOn(true)}
      onPointerLeave={(e) => isMouse(e) && setOn(false)}
      onClick={() => noHover() && setOn((v) => !v)}
    >
      ideas
      <span className="mt__bulb" aria-hidden="true"><Lightbulb size={22} strokeWidth={1.75} /></span>
    </span>
  )
}

function VisualsWord() {
  const [on, setOn] = useState(false)
  const [idx, setIdx] = useState(0)

  // One random cover per hover: it stays put while hovered and changes only on the next hover
  useEffect(() => {
    if (on) setIdx((i) => pick(i))
  }, [on])

  const cur = SLOTS[idx] || SLOTS[0]
  return (
    <span
      className={`mt__vis${on ? ' is-on' : ''}`}
      onPointerEnter={(e) => isMouse(e) && setOn(true)}
      onPointerLeave={(e) => isMouse(e) && setOn(false)}
      onClick={() => noHover() && setOn((v) => !v)}
    >
      visuals
      <span className="mt__peek" aria-hidden="true">
        {cur.src ? <img key={idx} src={cur.src} alt="" draggable={false} /> : <b key={idx}>{String(cur.slot).padStart(2, '0')}</b>}
      </span>
    </span>
  )
}

const INDUSTRIES = [
  'E-commerce & marketplaces',
  'Skincare & wellness',
  'Fashion & clothing',
  'Perfume & fragrance',
  'Real estate',
  'Events & entertainment',
  'Technology & expos',
  'Travel & tourism',
]

const MILESTONES = [
  { when: '2009', title: 'Started exploring Photoshop', text: 'The start of a long relationship with pixels.' },
  { when: '2016 onwards', title: 'Developed graphic design skills', text: 'Explored different creative formats and kept experimenting.' },
  {
    when: 'Professional journey',
    title: 'Real briefs, real brands',
    text: 'Worked across the kinds of visuals brands use every day.',
    tags: ['Social media creatives', 'E-commerce visuals', 'Product presentations', 'Digital campaigns'],
  },
  { when: 'Today', title: 'Open to what’s next', text: 'Open to full-time Graphic Designer and Senior Graphic Designer roles, freelance projects and ongoing design collaborations.' },
]

const STATS = [
  { name: 'Photoshop', rank: 'EXPERT', fill: 1, quip: 'Home turf.' },
  { name: 'Illustrator', rank: 'INTERMEDIATE', fill: 0.6, quip: 'Still levelling up.' },
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

      gsap.from('.meet__hey .rv__in', { yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.025, scrollTrigger: st('.meet') })
      // Lines are masked only while they slide in, so the hover pop-ups can overflow afterwards
      gsap.set('.mt__line', { overflow: 'hidden' })
      gsap.from('.mt__in', { yPercent: 115, duration: 1, ease: 'power4.out', stagger: 0.14, delay: 0.2, scrollTrigger: st('.meet'), onComplete: () => gsap.set('.mt__line', { clearProps: 'overflow' }) })
      gsap.from('.tile', { y: 50, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, clearProps: 'transform,opacity', scrollTrigger: st('.meet__tiles') })
      gsap.to('.meet__bigk', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.meet', scrub: true, start: 'top bottom', end: 'bottom top' } })
      gsap.to('.meet__sticker', { yPercent: 40, rotation: 90, ease: 'none', scrollTrigger: { trigger: '.meet', scrub: true, start: 'top bottom', end: 'bottom top' } })

      gsap.fromTo('.tl__fill', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.tl', start: 'top 65%', end: 'bottom 65%', scrub: 0.4 } })
      root.querySelectorAll('.tl__item').forEach((item, i) => {
        gsap.from(item.querySelector('.tl__card'), {
          x: i % 2 ? 40 : -40, opacity: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { ...st(item, 'top 80%'), onEnter: () => item.classList.add('is-lit') },
        })
      })

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
          <p className="about__lead">Every pixel has a purpose. Every project has a story. I bring that care, and a strong eye for visual communication, to full-time design teams and freelance client projects alike.</p>
          <ul className="about__marks" role="list">
            <li>Adobe Photoshop expertise</li>
            <li>Using Photoshop since 2009</li>
          </ul>
        </div>

        {/* ---------- Block 1: Meet Kunjan ---------- */}
        <div className="meet">
          <span className="meet__bigk" aria-hidden="true">K</span>
          <span className="meet__sticker" aria-hidden="true" />
          <p className="meet__text">
            <span className="meet__hey"><Reveal text="Hey, I’m Kunjan." /></span>{' '}
            <span className="mt__line"><span className="mt__in">An experienced{' '}</span></span>
            <span className="mt__line"><span className="mt__in">graphic designer{' '}</span></span>
            <span className="mt__line"><span className="mt__in">turning <em className="mt__hl"><IdeasWord /> into <VisualsWord /></em>{' '}</span></span>
            <span className="mt__line"><span className="mt__in">that <em className="mt__out">refuse to be ignored.</em></span></span>
          </p>
          <ul className="meet__tiles" role="list">
            {TILES.map(({ icon: Icon, kicker, big, small }, i) => (
              <li key={big} className={`tile tile--${i + 1}`} data-cursor>
                <span className="tile__deco" aria-hidden="true">{DECO[i]}</span>
                <span className="tile__ic"><Icon size={22} strokeWidth={1.75} aria-hidden="true" /></span>
                {kicker && <span className="tile__kick">{kicker}</span>}
                <strong>{big}</strong>
                {small && <span className="tile__sub">{small}</span>}
              </li>
            ))}
          </ul>
        </div>

        {/* ---------- Block 2: Timeline ---------- */}
        <div className="block">
          <h3 className="block__title">My creative journey</h3>
          <div className="tl">
            <span className="tl__line" aria-hidden="true"><span className="tl__fill" /></span>
            <ol role="list">
              {MILESTONES.map((m, i) => (
                <li key={m.when} className={`tl__item${i === MILESTONES.length - 1 ? ' is-today' : ''}`}>
                  <span className="tl__node" aria-hidden="true" />
                  <div className="tl__card">
                    <span className="tl__when">{m.when}</span>
                    <h4>{m.title}</h4>
                    <p>{m.text}</p>
                    {m.tags && <ul className="tl__tags" role="list">{m.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ---------- Industries ---------- */}
        <div className="block ind">
          <h3 className="block__title">Industries I’ve worked in</h3>
          <p className="ind__text">
            Over the years I’ve designed for brands across e-commerce, skincare and wellness, fashion and clothing, perfume and fragrance, real estate, events and entertainment, technology expos and travel. Every industry speaks to a different audience, so I adapt the look, tone and layout to each one while keeping the message clear and the design bold.
          </p>
          <ul className="ind__tags" role="list">
            {INDUSTRIES.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>

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

      </Container>
    </section>
  )
}
