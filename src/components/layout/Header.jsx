import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import gsap from 'gsap'
import Button from '../ui/Button.jsx'
import Availability from '../ui/Availability.jsx'
import ContactLinks from '../ui/ContactLinks.jsx'
import { scrollToId } from '../../utils/scrollTo.js'
import './Header.css'

const NAV = [
  { label: 'Work', id: 'work' },
  { label: 'About', id: 'about' },
  { label: 'Expertise', id: 'services' },
]

export default function Header() {
  const [compact, setCompact] = useState(false)
  const [open, setOpen] = useState(false)
  const barRef = useRef(null)
  const toggleRef = useRef(null)
  const firstLinkRef = useRef(null)

  // Compact on scroll
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Entrance
  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(barRef.current, { yPercent: -160, opacity: 0, duration: 1, delay: 0.2, ease: 'power4.out', clearProps: 'transform' })
    })
    return () => mm.revert()
  }, [])

  // Mobile menu: scroll lock, Escape, close when resizing to desktop
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    firstLinkRef.current?.focus({ preventScroll: true })
    const onKey = (e) => e.key === 'Escape' && close()
    const mq = window.matchMedia('(min-width: 768px)')
    const onMq = () => mq.matches && close()
    window.addEventListener('keydown', onKey)
    mq.addEventListener('change', onMq)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onMq)
    }
  }, [open])

  function close() {
    setOpen(false)
    toggleRef.current?.focus({ preventScroll: true })
  }

  function go(e, id) {
    e.preventDefault()
    const wasOpen = open
    if (wasOpen) setOpen(false)
    setTimeout(() => scrollToId(id), wasOpen ? 80 : 0)
  }

  return (
    <>
      <header className={`header${compact ? ' is-compact' : ''}`}>
        <div className="header__bar" ref={barRef}>
          <a href="#top" className="header__logo" onClick={(e) => go(e, 'top')} aria-label="Kunjan, back to top">
            KUNJAN<span>.</span>
          </a>

          <nav className="header__nav" aria-label="Primary">
            {NAV.map(({ label, id }) => (
              <a key={id} href={`#${id}`} className="header__link" onClick={(e) => go(e, id)}>
                {label}
              </a>
            ))}
          </nav>

          <div className="header__right">
            <Availability label="Available" className="header__avail" />
            <ContactLinks className="header__contact" tooltips />
            <Button href="#contact" size="sm" className="header__cta" onClick={(e) => go(e, 'contact')}>
              Let’s Talk
            </Button>
            <button
              ref={toggleRef}
              type="button"
              className="header__toggle"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => (open ? close() : setOpen(true))}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <div id="mobile-menu" className={`menu${open ? ' is-open' : ''}`} inert={!open}>
        <nav className="menu__nav" aria-label="Mobile">
          {NAV.map(({ label, id }, i) => (
            <a
              key={id}
              ref={i === 0 ? firstLinkRef : null}
              href={`#${id}`}
              className="menu__link"
              style={{ '--i': i }}
              onClick={(e) => go(e, id)}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="menu__foot" style={{ '--i': NAV.length }}>
          <Button href="#contact" size="lg" onClick={(e) => go(e, 'contact')}>
            Let’s Talk
          </Button>
          <ContactLinks className="menu__contact" labels />
          <Availability label="Open to roles and projects" />
        </div>
      </div>
    </>
  )
}
