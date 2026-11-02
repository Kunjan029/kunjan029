import { getChannel } from '../../data/contact.js'
import { PenTool } from 'lucide-react'
import { WhatsAppIcon } from './ContactIcons.jsx'
import { scrollToId } from '../../utils/scrollTo.js'
import './FloatingWhatsApp.css'

// Global floating WhatsApp button. Destination comes only from data/contact.js.
export default function FloatingWhatsApp() {
  const wa = getChannel('whatsapp')
  if (!wa) return null
  return (
    <>
    <a href="#why" className="fwa fwa--why" aria-label="Why hire me" onClick={(e) => { e.preventDefault(); scrollToId('why') }}>
      <PenTool size={24} aria-hidden="true" />
      <span className="fwa__tip" aria-hidden="true">Why hire me</span>
    </a>
    <a href={wa.href} className="fwa" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp (opens in a new tab)">
      <WhatsAppIcon size={28} />
      <span className="fwa__tip" aria-hidden="true">Let’s chat on WhatsApp</span>
    </a>
    </>
  )
}
