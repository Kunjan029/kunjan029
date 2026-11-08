import { MessageCircle } from 'lucide-react'
import Container from '../ui/Container.jsx'
import { scrollToId } from '../../utils/scrollTo.js'
import './HowIWork.css'

const STEPS = [
  { t: 'Brief', d: 'You share the goal, references, files and the formats you need.' },
  { t: 'First draft', d: 'I design the first version and send it over for review.' },
  { t: 'Feedback', d: 'You send your changes. Two revision rounds are included.' },
  { t: 'Final files', d: 'I deliver the approved design, ready to use in every format you need.' },
]

const TURNAROUND = [
  ['Static post', '1 day'],
  ['Carousel', '2 days'],
  ['Video', '2–3 days'],
  ['Amazon A+ content', 'Depends on requirements'],
]

const TERMS = [
  { t: 'Revisions', d: 'Two rounds are included. Extra rounds are charged separately, so if you expect more, let me know upfront.' },
  { t: 'Replies', d: 'WhatsApp is the fastest, usually within 15–20 minutes. Email can be instant or take a little longer.' },
  { t: 'Payment', d: 'One-time projects start with a 50% advance. Retainers run on a fixed contract with a fixed payment date.' },
]

export default function HowIWork() {
  return (
    <section id="process" className="hw">
      <Container>
        <p className="hw__label">HOW I WORK</p>
        <h2 className="hw__title">Simple, clear, on time<span>.</span></h2>
        <p className="hw__lead">No guesswork. Here is how a project runs, how long things usually take and what to expect along the way.</p>

        <ol className="hw__steps" role="list">
          {STEPS.map((s, i) => (
            <li key={s.t} className="hw__step">
              <span className="hw__n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>

        <div className="hw__cols">
          <div className="hw__box">
            <h3 className="hw__h">Typical turnaround</h3>
            <dl className="hw__tat">
              {TURNAROUND.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </div>
          <div className="hw__box">
            <h3 className="hw__h">Good to know</h3>
            <ul className="hw__terms" role="list">
              {TERMS.map((x) => (
                <li key={x.t}><b>{x.t}</b><span>{x.d}</span></li>
              ))}
            </ul>
          </div>
        </div>

        <p className="hw__cta">
          Have something in mind?{' '}
          <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToId('contact') }} data-cursor>
            <MessageCircle size={16} aria-hidden="true" /> Tell me about it
          </a>
        </p>
      </Container>
    </section>
  )
}
