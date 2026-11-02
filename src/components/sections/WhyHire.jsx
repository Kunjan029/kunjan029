import { useEffect, useRef } from 'react'
import Container from '../ui/Container.jsx'
import Button from '../ui/Button.jsx'
import Reveal from '../ui/Reveal.jsx'
import { scrollToId } from '../../utils/scrollTo.js'
import './WhyHire.css'

const REASONS = [
  { title: '16+ years of real design work', text: 'Started in 2011 designing wedding albums, and grew through graphics, advertising and e-commerce. I have seen what works across many formats and many kinds of clients.' },
  { title: 'Built for e-commerce', text: 'Amazon A+ content, product visuals and marketplace creatives that explain a product clearly and make a listing look trustworthy.' },
  { title: 'One designer, many formats', text: 'Social media, advertising, branding, photo editing from a single person, so your visuals feel consistent from post to product page.' },
  { title: 'Experience across industries', text: 'Real estate, perfume, clothing, skincare, events, technology and travel. I learn each audience quickly and adapt the look and tone to it.' },
  { title: 'Strong craft, fast hands', text: 'Deep Photoshop and Illustrator skills mean I can take a rough idea to a polished layout without handing it off or waiting on others.' },
  { title: 'Flexible way of working', text: 'Open to full-time design roles and freelance projects. Clear communication, honest feedback and work that is ready to use.' },
]

const pad = (n) => String(n).padStart(2, '0')
const go = (id) => (e) => { e.preventDefault(); scrollToId(id) }

export default function WhyHire() {
  const gridRef = useRef(null)

  // Cards fade up as they come into view; without IntersectionObserver or with reduced motion they simply show
  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll('.why__card')
    if (!cards?.length || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    cards.forEach((c) => c.classList.add('is-pending'))
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        e.target.classList.remove('is-pending')
        io.unobserve(e.target)
      })
    }, { rootMargin: '0px 0px -8% 0px' })
    cards.forEach((c, i) => { c.style.setProperty('--d', `${(i % 3) * 80}ms`); io.observe(c) })
    return () => io.disconnect()
  }, [])

  return (
    <section id="why" className="why" aria-labelledby="why-title">
      <Container>
        <p className="why__label">THE SHORT VERSION / 001</p>
        <h2 id="why-title" className="why__title">
          <span className="line"><Reveal text="WHY HIRE ME." accentDots /></span>
        </h2>
        <p className="why__lead">If you need a designer who can handle the whole visual side of a brand, this is what you get.</p>

        <ol className="why__grid" ref={gridRef} role="list">
          {REASONS.map(({ title, text }, i) => (
            <li key={title} className="why__card">
              <span className="why__num" aria-hidden="true">{pad(i + 1)}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>

        <div className="why__cta">
          <Button href="#contact" size="lg" onClick={go('contact')}>Let’s talk</Button>
        </div>
      </Container>
    </section>
  )
}
