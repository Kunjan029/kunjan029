import { ExternalLink } from 'lucide-react'
import { getChannels } from '../../data/contact.js'
import { CHANNEL_ICONS } from './ContactIcons.jsx'
import './ContactLinks.css'

// Compact WhatsApp / Email / LinkedIn links. Destinations come only from data/contact.js.
// tooltips: CSS tooltip on hover/focus (desktop). labels: show text beside the icon (mobile menu).
const CHAT = ['whatsapp', 'email', 'linkedin']
export default function ContactLinks({ className = '', tooltips = false, labels = false }) {
  const list = getChannels().filter((c) => CHAT.includes(c.id))
  if (!list.length) return null
  return (
    <ul role="list" className={`cl${labels ? ' cl--labels' : ''} ${className}`}>
      {list.map((c) => {
        const Icon = CHANNEL_ICONS[c.id] || ExternalLink
        return (
          <li key={c.id}>
            <a
              href={c.href}
              className={`cl__a cl__a--${c.id}`}
              aria-label={c.external ? `${c.label} (opens in a new tab)` : `${c.label}: ${c.hint}`}
              {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              <Icon size={labels ? 22 : 18} aria-hidden="true" />
              {labels && <span>{c.label}</span>}
              {tooltips && <span className="cl__tip" role="tooltip" aria-hidden="true">{c.label}</span>}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
