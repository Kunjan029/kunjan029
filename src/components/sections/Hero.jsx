import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import Container from '../ui/Container.jsx'
import Button from '../ui/Button.jsx'
import Availability from '../ui/Availability.jsx'
import HeroWorkspace from './HeroWorkspace.jsx'
import { scrollToId } from '../../utils/scrollTo.js'
import './Hero.css'

const LINES = [
  { words: ['I', 'MAKE', 'BRANDS'] },
  { words: ['IMPOSSIBLE'], outline: true },
  { words: ['TO', 'IGNORE.'] },
]

const go = (id) => (e) => {
  e.preventDefault()
  scrollToId(id)
}

export default function Hero() {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    const title = root.querySelector('.hero__title')
    const chars = root.querySelectorAll('.char')
    const shapes = root.querySelectorAll('.shape')
    const ws = root.querySelector('.ws')
    const path = root.querySelector('.ws__path')
    const mm = gsap.matchMedia(root)

    // Entrance + ambient loops (skipped entirely with reduced motion: everything is visible by default)
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({ delay: 0.25, defaults: { ease: 'power4.out' } })
      tl.from('.hero__status', { y: 20, opacity: 0, duration: 0.7 })
        .from(chars, { yPercent: 120, rotation: 7, duration: 1.1, stagger: { amount: 0.8 } }, '<0.1')
        .from('.hero__text', { y: 24, opacity: 0, duration: 0.8 }, '-=0.6')
        .from('.hero__actions .btn', { y: 20, opacity: 0, duration: 0.7, stagger: 0.1 }, '<0.15')
        .from('.hero__visual', { y: 70, opacity: 0, rotation: 3, scale: 0.94, duration: 1.2 }, 0.6)
        .fromTo(path, { strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, 1.3)
        .from('.ws__anchor, .ws__handles, .ws__select, .ws__chip', { opacity: 0, scale: 0.6, transformOrigin: '50% 50%', duration: 0.6, stagger: 0.08, ease: 'back.out(2)' }, 1.5)
        .from(shapes, { scale: 0, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'back.out(2)' }, 0.8)
        .from('.hero__badge', { scale: 0, rotation: -90, duration: 0.9, ease: 'back.out(1.6)' }, 1.2)
        .from('.hero__scroll', { opacity: 0, y: 10, duration: 0.6 }, '-=0.4')
        .add(() => title.classList.add('is-ready'), 1.6)

      // Ambient loops live in one timeline so they can pause when the hero is off-screen
      const loops = gsap.timeline()
      shapes.forEach((el) => {
        loops.to(el.querySelector('.shape__in'), {
          y: gsap.utils.random(-16, 16), rotation: gsap.utils.random(-14, 14),
          duration: gsap.utils.random(3, 5), ease: 'sine.inOut', yoyo: true, repeat: -1,
        }, 0)
      })
      loops.to('.badge__svg', { rotation: 360, duration: 20, ease: 'none', repeat: -1 }, 0)
      loops.to('.scroll__dot', { y: 34, duration: 1.2, ease: 'power2.inOut', repeat: -1, yoyo: true }, 0)
      loops.to('.ws', { y: -8, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0)

      const cursor = gsap.timeline({ repeat: -1, delay: 2.2 })
      ;[['62%', '24%'], ['74%', '60%'], ['34%', '84%'], ['26%', '38%']].forEach(([left, top]) =>
        cursor.to('.ws__cursor', { left, top, duration: 1.5, ease: 'power2.inOut' }).to({}, { duration: 0.5 }),
      )
      loops.add(cursor, 0)

      const io = new IntersectionObserver(([entry]) => loops.paused(!entry.isIntersecting))
      io.observe(root)

      return () => {
        io.disconnect()
        title.classList.remove('is-ready')
      }
    })

    // Pointer-driven effects: desktop only
    mm.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
      const movers = [...shapes].map((el) => ({
        depth: parseFloat(el.dataset.depth),
        x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3' }),
        y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3' }),
      }))
      const rotX = gsap.quickTo(ws, 'rotationX', { duration: 0.8, ease: 'power3' })
      const rotY = gsap.quickTo(ws, 'rotationY', { duration: 0.8, ease: 'power3' })

      const onMove = (e) => {
        const nx = e.clientX / window.innerWidth - 0.5
        const ny = e.clientY / window.innerHeight - 0.5
        movers.forEach((m) => { m.x(nx * m.depth * 1000); m.y(ny * m.depth * 1000) })
        rotY(nx * 12)
        rotX(-ny * 10)
      }
      const onOver = (e) => {
        const c = e.target.closest?.('.char')
        if (c) gsap.to(c, { yPercent: -10, rotation: gsap.utils.random(-8, 8), duration: 0.25, ease: 'power2.out', overwrite: true })
      }
      const onOut = (e) => {
        const c = e.target.closest?.('.char')
        if (c) gsap.to(c, { yPercent: 0, rotation: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)', overwrite: true })
      }

      root.addEventListener('pointermove', onMove, { passive: true })
      title.addEventListener('pointerover', onOver)
      title.addEventListener('pointerout', onOut)
      return () => {
        root.removeEventListener('pointermove', onMove)
        title.removeEventListener('pointerover', onOver)
        title.removeEventListener('pointerout', onOut)
      }
    })

    return () => mm.revert()
  }, [])

  return (
    <section id="top" className="hero" ref={rootRef}>
      <div className="hero__shapes" aria-hidden="true">
        <span className="shape shape--ring" data-depth="0.03">
          <svg className="shape__in" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" /></svg>
        </span>
        <span className="shape shape--plus" data-depth="0.05">
          <svg className="shape__in" viewBox="0 0 100 100"><path d="M50 12v76M12 50h76" stroke="currentColor" strokeWidth="8" strokeLinecap="round" /></svg>
        </span>
        <span className="shape shape--squiggle" data-depth="0.04">
          <svg className="shape__in" viewBox="0 0 100 100"><path d="M5 50Q20 10 35 50T65 50T95 50" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" /></svg>
        </span>
        <span className="shape shape--triangle" data-depth="0.06">
          <svg className="shape__in" viewBox="0 0 100 100"><path d="M50 10L92 86H8Z" fill="var(--color-card)" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /></svg>
        </span>
        <span className="shape shape--asterisk" data-depth="0.02">
          <svg className="shape__in" viewBox="0 0 100 100"><g stroke="currentColor" strokeWidth="8" strokeLinecap="round"><path d="M50 8v84" /><path d="M13.6 29l72.8 42" /><path d="M13.6 71l72.8-42" /></g></svg>
        </span>
      </div>

      <Container className="hero__inner">
        <div className="hero__statuses">
          <Availability label="Open to Full-time Opportunities" className="hero__status" />
          <Availability label="Available for Freelance Projects" className="hero__status" />
        </div>

        <div className="hero__stage">
          <h1 className="hero__title" aria-label="I make brands impossible to ignore.">
            {LINES.map(({ words, outline }, li) => (
              <span key={li} className={`line${outline ? ' line--outline' : ''}`} aria-hidden="true">
                {words.map((word, wi) => (
                  <span key={wi}>
                    <span className="word">
                      {[...word].map((ch, ci) => (
                        <span key={ci} className={`char${ch === '.' ? ' char--dot' : ''}`}>{ch}</span>
                      ))}
                    </span>
                    {wi < words.length - 1 && ' '}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <div className="hero__visual">
            <HeroWorkspace />
            <div className="hero__badge" aria-hidden="true">
              <svg className="badge__svg" viewBox="0 0 120 120">
                <defs><path id="badge-circle" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" /></defs>
                <circle cx="60" cy="60" r="59" fill="var(--color-card)" stroke="var(--color-border-strong)" />
                <text><textPath href="#badge-circle" textLength="272" lengthAdjust="spacing">BRANDING • SOCIAL • AMAZON • VIDEO EDITING • </textPath></text>
                <g stroke="var(--color-accent)" strokeWidth="4" strokeLinecap="round"><path d="M60 46v28" /><path d="M47.9 53l24.2 14" /><path d="M47.9 67l24.2-14" /></g>
              </svg>
            </div>
          </div>
        </div>

        <div className="hero__bottom">
          <p className="hero__text">
            Freelance graphic and social media designer in Ahmedabad, 16+ years of experience. Social posts, Amazon A+ content, e-commerce and ads. Open to full-time and freelance work.
          </p>
          <div className="hero__actions">
            <Button href="#work" size="lg" onClick={go('work')}>Explore My Work</Button>
            <Button href="#contact" variant="secondary" size="lg" onClick={go('contact')}>Let’s Connect</Button>
          </div>
        </div>
      </Container>

      <Container className="hero__scrollwrap">
        <a href="#work" className="hero__scroll" onClick={go('work')} aria-label="Scroll to work">
          <span className="scroll__track"><span className="scroll__dot" /></span>
          <span className="scroll__label">Scroll</span>
        </a>
      </Container>
    </section>
  )
}
