import { getChannel } from '../../data/contact.js'
import { WhatsAppIcon } from './ContactIcons.jsx'
import './FloatingWhatsApp.css'

// Global floating WhatsApp button. Destination comes only from data/contact.js.
export default function FloatingWhatsApp() {
  const wa = getChannel('whatsapp')
  if (!wa) return null
  return (
    <a href={wa.href} className="fwa" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp (opens in a new tab)">
      <WhatsAppIcon size={28} />
      <span className="fwa__tip" aria-hidden="true">Let’s chat on WhatsApp</span>
    </a>
  )
}
