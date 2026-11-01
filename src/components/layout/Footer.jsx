import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUp } from 'lucide-react'
import Container from '../ui/Container.jsx'
import { getChannels } from '../../data/contact.js'
import { scrollToId } from '../../utils/scrollTo.js'
import './Footer.css'

gsap.registerPlugin(ScrollTrigger)

export default function Footer() {
  const rootRef = useRef(null)
  const channels = getChannels()

  useLayoutEffect(() => {
    const mm = gsap.matchMedia(rootRef.current)
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('.foot__mark', { yPercent: 18 }, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.foot', scrub: true, start: 'top bottom', end: 'bottom bottom' } })
      gsap.from('.foot__row > *', { y: 24, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.foot__row', start: 'top 95%', once: true } })
    })
    return () => mm.revert()
  }, [])

  return (
    <footer className="foot" ref={rootRef}>
      <Container>
        <div className="foot__row">
          <div className="foot__brand">
            <p className="foot__logo"><span className="foot__kd" aria-hidden="true">KD</span><span>KUNJAN<span className="dot">.</span></span></p>
            <p className="foot__loc">Graphic Designer<br />Ahmedabad, India</p>
          </div>

          {channels.length > 0 && (
            <ul className="foot__social" role="list" aria-label="Social links">
              {channels.map((c) => (
                <li key={c.id}>
                  <a href={c.href} {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} data-cursor>{c.label}</a>
                </li>
              ))}
            </ul>
          )}

          <button type="button" className="foot__top" onClick={() => scrollToId('top')} data-cursor>
            Back to top <span className="foot__top-ic"><ArrowUp size={20} aria-hidden="true" /></span>
          </button>
        </div>

        <p className="foot__copy">© {new Date().getFullYear()} Kunjan Atara. All rights reserved.</p>
      </Container>
      <div className="foot__mark" aria-hidden="true">KUNJAN.</div>
    </footer>
  )
}
