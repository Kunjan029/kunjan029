import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight } from 'lucide-react'
import Container from '../ui/Container.jsx'
import Button from '../ui/Button.jsx'
import Reveal from '../ui/Reveal.jsx'
import { scrollToId } from '../../utils/scrollTo.js'
import './Services.css'

gsap.registerPlugin(ScrollTrigger)

const pad = (n) => String(n).padStart(2, '0')
const toContact = (e) => { e.preventDefault(); scrollToId('contact') }

/* ---------- Abstract illustrations (decorative, colours come from the card's CSS variables) ---------- */
const Star = ({ x, y, s = 1, className }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path className={className} d="M0-9L2.4-2.4 9 0 2.4 2.4 0 9-2.4 2.4-9 0-2.4-2.4Z" />
  </g>
)

const SocialArt = () => (
  <svg viewBox="40 25 330 250" aria-hidden="true">
    <g transform="translate(200 150)">
      {[1, 2, 3].map((n) => (
        <g key={n} className={`a1-p a1-p${n}`}>
          <rect x="-75" y="-95" width="150" height="190" rx="16" className="paper" />
          <rect x="-65" y="-85" width="130" height="110" rx="10" className={n === 3 ? 'ink' : 'ink soft'} />
          {n === 3 && <path className="hi a1-heart" d="M0-18C-6-30-24-26-24-12-24 2-8 12 0 20 8 12 24 2 24-12 24-26 6-30 0-18Z" />}
          <circle cx="-50" cy="48" r="10" className="ink" />
          <rect x="-32" y="40" width="72" height="7" rx="3.5" className="ink" />
          <rect x="-32" y="54" width="44" height="7" rx="3.5" className="ink soft" />
        </g>
      ))}
    </g>
    <circle className="hi a1-b a1-b1" cx="338" cy="210" r="9" />
    <circle className="ink a1-b a1-b2" cx="358" cy="176" r="6" />
    <circle className="hi a1-b a1-b3" cx="326" cy="150" r="4" />
  </svg>
)

const CarouselArt = () => (
  <svg viewBox="0 0 320 190" aria-hidden="true">
    <g className="a2-track">
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${24 + i * 134} 20)`}>
          <rect width="120" height="120" rx="14" className={i === 0 ? 'paper' : 'paper dim'} />
          <rect x="14" y="16" width="70" height="10" rx="5" className="ink" />
          <rect x="14" y="34" width="46" height="10" rx="5" className="ink soft" />
          <circle cx="92" cy="94" r="14" className="hi" />
          <rect x="14" y="88" width="50" height="6" rx="3" className="ink soft" />
          <rect x="14" y="100" width="34" height="6" rx="3" className="ink soft" />
        </g>
      ))}
    </g>
    {[0, 1, 2, 3].map((i) => <circle key={i} cx={130 + i * 20} cy="164" r="4" className="paper dim" />)}
    <circle cx="130" cy="164" r="5" className="hi a2-dot" />
  </svg>
)

const ProductArt = () => (
  <svg viewBox="20 15 260 190" aria-hidden="true">
    <path className="hi a3-spot" d="M150 0L222 190H78Z" />
    <ellipse cx="150" cy="180" rx="76" ry="14" className="ink soft" />
    <ellipse cx="150" cy="172" rx="62" ry="10" className="paper" />
    <g className="a3-bottle">
      <rect x="122" y="72" width="56" height="100" rx="12" className="paper" />
      <rect x="138" y="54" width="24" height="22" rx="4" className="paper" />
      <rect x="134" y="36" width="32" height="18" rx="5" className="hi" />
      <rect x="130" y="100" width="40" height="42" rx="6" className="ink soft" />
      <rect x="136" y="112" width="28" height="6" rx="3" className="ink" />
    </g>
    <g className="a3-thumbs">
      {[0, 1, 2].map((i) => <rect key={i} x={24 + i * 38} y="150" width="30" height="30" rx="7" className={i === 1 ? 'hi' : 'paper dim'} />)}
    </g>
    <Star x={78} y={64} className="hi a3-star a3-star1" />
    <Star x={226} y={92} s={0.8} className="paper a3-star a3-star2" />
    <Star x={204} y={38} s={0.6} className="hi a3-star a3-star3" />
  </svg>
)

const AdsArt = () => (
  <svg viewBox="20 30 280 160" aria-hidden="true">
    <g className="a4-mega">
      <path d="M62 84L130 48V152L62 116Z" className="paper" />
      <rect x="34" y="84" width="32" height="32" rx="6" className="ink" />
      <rect x="132" y="48" width="10" height="104" rx="5" className="hi" />
      <path d="M70 120l10 34h18l-8-30Z" className="paper dim" />
    </g>
    {[0, 1, 2].map((i) => (
      <path key={i} className={`a4-arc a4-arc${i + 1}`} fill="none" d={['M164 78A30 30 0 0 1 164 122', 'M182 62A52 52 0 0 1 182 138', 'M200 46A74 74 0 0 1 200 154'][i]} />
    ))}
    <g className="a4-banner">
      <rect x="226" y="140" width="62" height="40" rx="8" className="paper" />
      <rect x="236" y="150" width="30" height="6" rx="3" className="ink" />
      <rect x="236" y="162" width="20" height="6" rx="3" className="ink soft" />
    </g>
  </svg>
)

const PhotoArt = () => (
  <svg viewBox="20 20 280 170" aria-hidden="true">
    <rect x="40" y="36" width="240" height="130" rx="14" className="paper" />
    <circle cx="214" cy="76" r="17" className="hi" />
    <path d="M40 166V132L98 84 150 128 192 100 280 156V166Z" className="ink" />
    <path d="M98 84L120 103 98 99 82 108Z" className="paper" />
    <rect className="ink dim a5-before" x="40" y="36" width="120" height="130" rx="14" />
    <g className="a5-split">
      <rect x="158" y="30" width="4" height="142" rx="2" className="hi" />
      <circle cx="160" cy="101" r="13" className="hi" />
      <path d="M155 96l-5 5 5 5M165 96l5 5-5 5" fill="none" stroke="var(--svc-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <Star x={262} y={52} s={0.9} className="hi a5-star a5-star1" />
    <Star x={232} y={140} s={0.6} className="paper a5-star a5-star2" />
  </svg>
)

// Delete or set `enabled: false` on an entry to hide a service. Numbers re-sequence automatically.
const SERVICES = [
  { id: 'social', Art: SocialArt, title: 'Social Media Creatives', text: 'Social media post design with scroll-stopping visuals that help brands communicate consistently and stand out on Instagram, Facebook and LinkedIn.' },
  { id: 'carousel', Art: CarouselArt, title: 'Carousel Design', text: 'Well-structured, visually engaging carousels that turn information into content people want to explore.' },
  { id: 'product', Art: ProductArt, title: 'E-commerce Product Visuals', text: 'Amazon A+ content, product imagery and marketplace visuals designed to showcase products and communicate their value.' },
  { id: 'ads', Art: AdsArt, title: 'Advertising Creatives', text: 'Creative advertising visuals and ad creatives designed to capture attention and communicate campaign messages effectively.' },
  {
    id: 'photo', Art: PhotoArt, title: 'Photo Editing',
    text: 'Refined, polished imagery, from careful retouching to creative composites, finished to a standard brands can publish with confidence.',
    points: ['Professional photo retouching', 'Image manipulation', 'Background removal and replacement', 'Colour correction and enhancement', 'E-commerce product photo enhancement', 'Creative compositing'],
  },
].filter((s) => s.enabled !== false)

export default function Services() {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    const mm = gsap.matchMedia(root)
    const st = (trigger, start = 'top 82%') => ({ trigger, start, once: true })

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.svs__label', { y: 16, opacity: 0, duration: 0.7, scrollTrigger: st('.svs__intro') })
      gsap.from('.svs__title .rv__in', { yPercent: 115, duration: 1, ease: 'power4.out', stagger: 0.07, scrollTrigger: st('.svs__title') })
      gsap.from('.svs__lead', { y: 24, opacity: 0, duration: 0.8, delay: 0.3, scrollTrigger: st('.svs__title') })

      root.querySelectorAll('.svc').forEach((card, i) => {
        const num = card.querySelector('.svc__num')
        const target = i + 1
        gsap.from(card, { y: 90, opacity: 0, rotation: gsap.utils.random(-2, 2), duration: 1.1, ease: 'power3.out', scrollTrigger: st(card, 'top 90%') })

        // Animated numbering: digits scramble, then settle on the final number
        const o = { v: 0 }
        num.textContent = '00'
        ScrollTrigger.create({
          trigger: card, start: 'top 88%', once: true,
          onEnter: () => gsap.to(o, { v: 1, duration: 1, ease: 'steps(9)', onUpdate: () => { num.textContent = o.v < 1 ? pad(gsap.utils.random(0, 99, 1)) : pad(target) } }),
        })

        gsap.fromTo(card.querySelector('.svc__art'), { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: card, scrub: true, start: 'top bottom', end: 'bottom top' } })
        gsap.fromTo(num, { y: 18 }, { y: -18, ease: 'none', scrollTrigger: { trigger: card, scrub: true, start: 'top bottom', end: 'bottom top' } })
      })

      gsap.from('.svs-cta', { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: st('.svs-cta', 'top 90%') })
      gsap.from('.svs-cta__title .rv__in', { yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.05, scrollTrigger: st('.svs-cta', 'top 85%') })
      gsap.to('.svs-cta__q', { yPercent: -25, rotation: 12, ease: 'none', scrollTrigger: { trigger: '.svs-cta', scrub: true, start: 'top bottom', end: 'bottom top' } })
      document.fonts?.ready.then(() => ScrollTrigger.refresh())
    })

    // Touch devices have no hover: play each card's transformation while it is in view
    mm.add('(prefers-reduced-motion: no-preference) and (hover: none)', () => {
      root.querySelectorAll('.svc').forEach((card) => {
        ScrollTrigger.create({ trigger: card, start: 'top 65%', end: 'bottom 35%', toggleClass: { targets: card, className: 'is-on' } })
      })
    })

    // Magnetic CTA (mouse only)
    mm.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
      const wrap = root.querySelector('.svs-cta__btn')
      const btn = wrap.firstElementChild
      const x = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' })
      const y = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' })
      const move = (e) => {
        const r = wrap.getBoundingClientRect()
        x((e.clientX - (r.left + r.width / 2)) * 0.25)
        y((e.clientY - (r.top + r.height / 2)) * 0.35)
      }
      const leave = () => { x(0); y(0) }
      wrap.addEventListener('pointermove', move)
      wrap.addEventListener('pointerleave', leave)
      return () => { wrap.removeEventListener('pointermove', move); wrap.removeEventListener('pointerleave', leave) }
    })

    return () => mm.revert()
  }, [])

  return (
    <section id="services" className="svs" ref={rootRef}>
      <Container>
        <div className="svs__intro">
          <p className="svs__label">WHAT I DO / 002</p>
          <h2 className="svs__title">
            <span className="line"><Reveal text="GOOD IDEAS." accentDots /></span>
            <span className="line"><Reveal text="GREAT VISUALS." accentDots /></span>
          </h2>
          <p className="svs__lead">Five core design capabilities, brought to in-house teams, freelance projects and ongoing collaborations.</p>
        </div>

        <div className="svs__grid">
          {SERVICES.map(({ id, Art, title, text, points }, i) => (
            <article key={id} className={`svc svc--${id}`}>
              <div className="svc__top">
                <span className="svc__num" aria-hidden="true">{pad(i + 1)}</span>
                <a href="#contact" className="svc__go" onClick={toContact} aria-label={`Discuss ${title}`} data-cursor>
                  <ArrowUpRight size={22} strokeWidth={2} />
                </a>
              </div>
              <div className="svc__art"><Art /></div>
              <div className="svc__body">
                <h3>{title}</h3>
                <p>{text}</p>
                {points && (
                  <ul className="svc__points" aria-label={`${title} includes`}>
                    {points.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="svs-cta">
          <span className="svs-cta__q" aria-hidden="true">?</span>
          <div className="svs-cta__text">
            <h3 className="svs-cta__title"><Reveal text="Hiring or planning a project?" /></h3>
            <p>Let’s turn your next idea into something worth noticing.</p>
          </div>
          <div className="svs-cta__btn">
            <Button href="#contact" size="lg" onClick={toContact}>Let’s Connect</Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
