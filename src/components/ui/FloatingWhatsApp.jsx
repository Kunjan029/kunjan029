import { useEffect, useState } from 'react'
import { waLink } from '../../data/contact.js'
import { WhatsAppIcon } from './ContactIcons.jsx'
import './FloatingWhatsApp.css'

// Desktop/tablet: labelled floating "Chat on WhatsApp" button.
// Phones: a sticky bottom bar that appears only once the hero has scrolled out of view, and hides while
// the visitor types in a form field (so it never sits on top of the keyboard). The footer gets matching
// bottom padding on phones, so the bar never covers the end of the page.
// Each version reports its own click name, so the dashboard can tell them apart.
export default function FloatingWhatsApp() {
  const href = waLink()
  const [past, setPast] = useState(false)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    const hero = document.getElementById('top')
    if (!hero || !('IntersectionObserver' in window)) { setPast(true); return }
    const io = new IntersectionObserver(([e]) => setPast(!e.isIntersecting && e.boundingClientRect.top < 0))
    io.observe(hero)
    const field = (t) => t instanceof Element && t.matches('input, textarea, select')
    const onIn = (e) => field(e.target) && setTyping(true)
    const onOut = (e) => field(e.target) && setTyping(false)
    document.addEventListener('focusin', onIn)
    document.addEventListener('focusout', onOut)
    return () => { io.disconnect(); document.removeEventListener('focusin', onIn); document.removeEventListener('focusout', onOut) }
  }, [])

  if (!href) return null
  const showBar = past && !typing
  return (
    <>
      <a href={href} className="fwa" target="_blank" rel="noopener noreferrer" data-track="floating whatsapp" aria-label="Chat on WhatsApp (opens in a new tab)" data-cursor>
        <WhatsAppIcon size={22} />
        <span className="fwa__label">Chat on WhatsApp</span>
      </a>
      <div className={`wbar${showBar ? ' is-on' : ''}`} inert={!showBar}>
        <a href={href} className="wbar__btn" target="_blank" rel="noopener noreferrer" data-track="sticky whatsapp" aria-label="Chat on WhatsApp (opens in a new tab)">
          <WhatsAppIcon size={22} />
          <span>Chat on WhatsApp</span>
        </a>
      </div>
    </>
  )
}
