import { ArrowRight } from 'lucide-react'
import Container from '../ui/Container.jsx'
import Button from '../ui/Button.jsx'
import { WhatsAppIcon } from '../ui/ContactIcons.jsx'
import { waLink } from '../../data/contact.js'
import { scrollToId } from '../../utils/scrollTo.js'
import './WorkCta.css'

// Conversion strip right after the Work section. Each button reports its own click name (data-track).
export default function WorkCta() {
  const wa = waLink('Hi Kunjan, I saw your work and need visuals like this for my brand.')
  return (
    <section id="cta" className="wcta" aria-labelledby="wcta-title">
      <Container>
        <div className="wcta__box">
          <div className="wcta__text">
            <h2 id="wcta-title" className="wcta__title">Need visuals like this for your brand<span>?</span></h2>
            <p className="wcta__sub">Send a WhatsApp message and I usually reply within 15–20 minutes.</p>
          </div>
          <div className="wcta__actions">
            {wa && (
              <Button href={wa} size="lg" target="_blank" rel="noopener noreferrer" data-track="cta strip: whatsapp" data-cursor>
                <WhatsAppIcon size={20} /> Chat on WhatsApp
              </Button>
            )}
            <Button href="#brief" variant="secondary" size="lg" data-track="cta strip: send a brief" onClick={(e) => { e.preventDefault(); scrollToId('brief') }} data-cursor>
              Send a brief <ArrowRight size={18} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
