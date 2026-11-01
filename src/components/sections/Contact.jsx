import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Check, Copy, Download, ExternalLink, GalleryHorizontal, Handshake, LayoutGrid, Megaphone, Rocket, ShoppingBag, WandSparkles } from 'lucide-react'
import Container from '../ui/Container.jsx'
import Button from '../ui/Button.jsx'
import Reveal from '../ui/Reveal.jsx'
import Availability from '../ui/Availability.jsx'
import { CONTACT, getChannels, getResume } from '../../data/contact.js'
import { CHANNEL_ICONS } from '../ui/ContactIcons.jsx'
import { buildInquiry, whatsappUrl, mailtoUrl, EMAIL_RE } from '../../utils/inquiry.js'
import './Contact.css'

gsap.registerPlugin(ScrollTrigger)

const SERVICES = [
  { id: 'social', label: 'Social Media Creatives', Icon: LayoutGrid },
  { id: 'carousel', label: 'Carousel Design', Icon: GalleryHorizontal },
  { id: 'product', label: 'E-commerce Product Visuals', Icon: ShoppingBag },
  { id: 'ads', label: 'Advertising Creatives', Icon: Megaphone },
  { id: 'photo', label: 'Photo Editing', Icon: WandSparkles },
]
const OPPORTUNITIES = [
  { id: 'fulltime', label: 'Full-time job opportunity', Icon: BriefcaseBusiness },
  { id: 'freelance', label: 'Freelance project', Icon: Rocket },
  { id: 'collab', label: 'Ongoing collaboration', Icon: Handshake },
]
const TIMELINES = ['As soon as possible', 'Within 2 weeks', 'Within a month', 'Just exploring']

const EMPTY = { opportunity: '', services: [], message: '', timeline: '', name: '', email: '' }

function validate(f) {
  const e = {}
  if (!f.opportunity) e.opportunity = 'Choose the kind of opportunity this is.'
  if (f.message.trim().length < 10) e.message = 'Tell me a little about your project, a sentence is plenty.'
  if (!f.name.trim()) e.name = 'Please add your name.'
  if (!f.email.trim()) e.email = 'Please add your email.'
  else if (!EMAIL_RE.test(f.email.trim())) e.email = 'That email doesn’t look right.'
  return e
}

export default function Contact() {
  const rootRef = useRef(null)
  const doneRef = useRef(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [attempted, setAttempted] = useState(false)
  const [sent, setSent] = useState(null) // { text, waUrl, mailUrl } once submitted
  const [copied, setCopied] = useState(false)

  const channels = getChannels()
  const hasWa = channels.some((c) => c.id === 'whatsapp')
  const hasMail = channels.some((c) => c.id === 'email')

  function update(patch) {
    const next = { ...form, ...patch }
    setForm(next)
    if (attempted) setErrors(validate(next))
  }
  const toggleService = (id) => update({ services: form.services.includes(id) ? form.services.filter((s) => s !== id) : [...form.services, id] })

  function onSubmit(e) {
    e.preventDefault()
    setAttempted(true)
    const errs = validate(form)
    setErrors(errs)
    const first = ['opportunity', 'message', 'name', 'email'].find((k) => errs[k])
    if (first) {
      document.getElementById(first === 'opportunity' ? 'opp-opt-0' : `c-${first}`)?.focus()
      return
    }
    const ordered = SERVICES.filter((s) => form.services.includes(s.id)).map((s) => s.label)
    const text = buildInquiry({ ...form, opportunity: OPPORTUNITIES.find((o) => o.id === form.opportunity)?.label || '', services: ordered })
    const waUrl = hasWa ? whatsappUrl(CONTACT.whatsapp, text) : ''
    const mailUrl = hasMail ? mailtoUrl(CONTACT.email, `Inquiry from ${form.name.trim()}`, text) : ''
    setSent({ text, waUrl, mailUrl })
    setTimeout(() => doneRef.current?.focus(), 50)
  }

  async function copy() {
    try { await navigator.clipboard.writeText(sent.text) } catch {
      const ta = document.getElementById('c-prepared'); ta.select(); document.execCommand('copy')
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const focusForm = () => { document.getElementById('brief')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); setTimeout(() => document.getElementById('opp-opt-0')?.focus({ preventScroll: true }), 400) }

  const steps = [!!form.opportunity, form.message.trim().length >= 10, !!form.timeline, !!form.name.trim() && EMAIL_RE.test(form.email.trim())]
  const ready = !validateOk(form)

  useLayoutEffect(() => {
    const root = rootRef.current
    const mm = gsap.matchMedia(root)
    const st = (trigger, start = 'top 82%') => ({ trigger, start, once: true })
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.ct__label', { y: 16, opacity: 0, duration: 0.7, scrollTrigger: st('.ct__intro') })
      gsap.from('.ct__title .rv__in', { yPercent: 115, duration: 1, ease: 'power4.out', stagger: 0.07, scrollTrigger: st('.ct__title') })
      gsap.from('.ct__lead', { y: 24, opacity: 0, duration: 0.8, delay: 0.3, scrollTrigger: st('.ct__title') })
      gsap.from('.ct__open', { y: 20, opacity: 0, duration: 0.7, delay: 0.45, scrollTrigger: st('.ct__title') })
      root.querySelectorAll('.step').forEach((el) => gsap.from(el, { y: 50, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: st(el, 'top 90%') }))
      gsap.from('.ticket', { y: 60, opacity: 0, rotation: 2, duration: 1, ease: 'power3.out', scrollTrigger: st('.ticket', 'top 92%') })
      gsap.from('.ct__links', { y: 30, opacity: 0, duration: 0.8, scrollTrigger: st('.ct__links', 'top 95%') })
      document.fonts?.ready.then(() => ScrollTrigger.refresh())
    })
    mm.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
      const wrap = root.querySelector('.ct__send')
      if (!wrap) return
      const btn = wrap.firstElementChild
      const x = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' })
      const y = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' })
      const move = (e) => { const r = wrap.getBoundingClientRect(); x((e.clientX - (r.left + r.width / 2)) * 0.18); y((e.clientY - (r.top + r.height / 2)) * 0.3) }
      const leave = () => { x(0); y(0) }
      wrap.addEventListener('pointermove', move); wrap.addEventListener('pointerleave', leave)
      return () => { wrap.removeEventListener('pointermove', move); wrap.removeEventListener('pointerleave', leave) }
    })
    return () => mm.revert()
  }, [sent])

  const err = (k) => errors[k] && <p className="field__err" id={`e-${k}`} role="alert">{errors[k]}</p>
  const ordered = SERVICES.filter((s) => form.services.includes(s.id))
  const opp = OPPORTUNITIES.find((o) => o.id === form.opportunity)
  const resume = getResume()

  return (
    <section id="contact" className="ct" ref={rootRef}>
      <Container>
        <div className="ct__intro">
          <p className="ct__label">GOT SOMETHING IN MIND?</p>
          <h2 className="ct__title">
            <span className="line"><Reveal text="LET’S MAKE SOMETHING" /></span>
            <span className="line"><Reveal text="IMPOSSIBLE TO IGNORE." accentDots /></span>
          </h2>
          <p className="ct__lead">Hiring for a design role, planning a freelance project or looking for an ongoing collaborator? I’d love to hear from you.</p>
          <button type="button" className="ct__open" onClick={focusForm} data-cursor>
            <Availability label="OPEN FOR ROLES & PROJECTS" />
            <span className="ct__open-go">Start a conversation <ArrowRight size={14} aria-hidden="true" /></span>
          </button>
        </div>

        <div className="ct__layout" id="brief">
          {!sent ? (
            <form className="ct__form" onSubmit={onSubmit} noValidate>
              <fieldset className="step">
                <legend><span className="step__n" aria-hidden="true">01</span><span className="step__t">What are you looking for?</span></legend>
                <p className="step__sub" id="opp-label">Type of opportunity</p>
                <div className="opts opts--opps" role="group" aria-labelledby="opp-label" aria-describedby={errors.opportunity ? 'e-opportunity' : undefined}>
                  {OPPORTUNITIES.map(({ id, label, Icon }, i) => {
                    const on = form.opportunity === id
                    return (
                      <button key={id} id={`opp-opt-${i}`} type="button" className={`opt${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => update({ opportunity: on ? '' : id })} data-cursor>
                        <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                        <span>{label}</span>
                        <i className="opt__check" aria-hidden="true"><Check size={14} strokeWidth={3} /></i>
                      </button>
                    )
                  })}
                </div>
                {err('opportunity')}

                <p className="step__sub" id="svc-label">Design areas <em>(optional, pick as many as you like)</em></p>
                <div className="opts" role="group" aria-labelledby="svc-label">
                  {SERVICES.map(({ id, label, Icon }, i) => {
                    const on = form.services.includes(id)
                    return (
                      <button key={id} id={`svc-opt-${i}`} type="button" className={`opt${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => toggleService(id)} data-cursor>
                        <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                        <span>{label}</span>
                        <i className="opt__check" aria-hidden="true"><Check size={14} strokeWidth={3} /></i>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <fieldset className="step">
                <legend><span className="step__n" aria-hidden="true">02</span><span className="step__t">Tell me more</span></legend>
                <textarea id="c-message" className="field" rows={5} value={form.message} onChange={(e) => update({ message: e.target.value })}
                  placeholder="Tell me about the role, project or collaboration you have in mind..." aria-label="About the role or project"
                  aria-invalid={!!errors.message} aria-describedby={errors.message ? 'e-message' : undefined} />
                {err('message')}
              </fieldset>

              <fieldset className="step">
                <legend><span className="step__n" aria-hidden="true">03</span><span className="step__t">Timeline</span></legend>
                <p className="step__hint">Optional.</p>
                <div className="chips">
                  {TIMELINES.map((t) => (
                    <button key={t} type="button" className={`tchip${form.timeline === t ? ' is-on' : ''}`} aria-pressed={form.timeline === t} onClick={() => update({ timeline: form.timeline === t ? '' : t })} data-cursor>{t}</button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="step">
                <legend><span className="step__n" aria-hidden="true">04</span><span className="step__t">Your contact details</span></legend>
                <div className="row2">
                  <label className="lbl" htmlFor="c-name">Name
                    <input id="c-name" className="field" type="text" autoComplete="name" value={form.name} onChange={(e) => update({ name: e.target.value })} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'e-name' : undefined} />
                    {err('name')}
                  </label>
                  <label className="lbl" htmlFor="c-email">Email
                    <input id="c-email" className="field" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={(e) => update({ email: e.target.value })} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'e-email' : undefined} />
                    {err('email')}
                  </label>
                </div>
              </fieldset>

              <div className="ct__send">
                <Button type="submit" size="lg" className={`send${ready ? ' is-ready' : ''}`} data-cursor>
                  MESSAGE ME <ArrowRight size={20} className="send__arrow" aria-hidden="true" />
                </Button>
              </div>
              <p className="ct__note">Your brief is prepared as a message you can copy and send. Nothing is sent automatically.</p>
            </form>
          ) : (
            <div className="ct__done" ref={doneRef} tabIndex={-1} role="status">
              <span className="done__badge" aria-hidden="true"><Check size={26} strokeWidth={3} /></span>
              <h3>Your message is ready.</h3>
              <p>Thanks, {form.name.trim().split(' ')[0]}! I’ve put everything into one message. Send it whenever you’re ready, and nothing leaves this page until you do.</p>
              <label className="lbl" htmlFor="c-prepared">Prepared message
                <textarea id="c-prepared" className="field" rows={9} readOnly value={sent.text} />
              </label>
              <div className="done__actions">
                {sent.waUrl && <Button href={sent.waUrl} target="_blank" rel="noopener noreferrer" data-cursor>Open WhatsApp</Button>}
                {sent.mailUrl && <Button href={sent.mailUrl} target="_blank" rel="noopener noreferrer" variant="secondary" data-cursor>Send by email</Button>}
                <Button variant={sent.waUrl || sent.mailUrl ? 'ghost' : 'primary'} onClick={copy} data-cursor><Copy size={16} aria-hidden="true" /> {copied ? 'Copied!' : 'Copy message'}</Button>
                <Button variant="ghost" onClick={() => setSent(null)} data-cursor>Edit brief</Button>
              </div>
            </div>
          )}

          <aside className="ct__aside">
            <div className="ticket">
              <div className="ticket__head"><span>YOUR BRIEF</span><span className="ticket__prog">{steps.filter(Boolean).length}/4</span></div>
              <dl className="ticket__body">
                <div><dt>Looking for</dt><dd>{opp || ordered.length ? <span className="ticket__chips">{opp && <b>{opp.label}</b>}{ordered.map((s) => <b key={s.id}>{s.label}</b>)}</span> : <em>Pick an opportunity</em>}</dd></div>
                <div><dt>Timeline</dt><dd>{form.timeline || <em>Optional</em>}</dd></div>
                <div><dt>Details</dt><dd className="clamp">{form.message.trim() || <em>Your message goes here</em>}</dd></div>
                <div><dt>From</dt><dd>{form.name.trim() || <em>Your name</em>}{form.email.trim() ? <span className="ticket__mail"> {form.email.trim()}</span> : null}</dd></div>
              </dl>
              <div className="ticket__bar" aria-hidden="true">{steps.map((d, i) => <i key={i} className={d ? 'is-on' : ''} />)}</div>
            </div>

            <div className="ct__links">
              <p className="ct__links-h">Resume</p>
              {resume ? (
                <a href={resume} className="link link--resume" target="_blank" rel="noopener noreferrer" data-cursor>
                  <Download size={18} aria-hidden="true" /><span>Download Resume</span><ArrowUpRight size={18} className="link__go" aria-hidden="true" />
                </a>
              ) : (
                <>
                  <span className="link link--resume is-off" aria-disabled="true">
                    <Download size={18} aria-hidden="true" /><span>Download Resume</span><em>Coming soon</em>
                  </span>
                  <p className="ct__todo">Add your resume link in <code>src/data/contact.js</code> (<code>resume</code>) and this button goes live.</p>
                </>
              )}
            </div>

            <div className="ct__links">
              <p className="ct__links-h">Prefer to reach out directly?</p>
              {channels.length > 0 && (
                <ul role="list" className="ct__channels">
                  {channels.map((c) => {
                    const Icon = CHANNEL_ICONS[c.id] || ExternalLink
                    return (
                      <li key={c.id}>
                        <a href={c.href} className={`chan chan--${c.id}`} {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} aria-label={c.external ? `${c.label}: ${c.hint} (opens in a new tab)` : `${c.label}: ${c.hint}`} data-cursor>
                          <span className="chan__ic"><Icon size={22} aria-hidden="true" /></span>
                          <span className="chan__t"><b>{c.label}</b><small>{c.hint}</small></span>
                          <ArrowUpRight size={18} className="chan__go" aria-hidden="true" />
                        </a>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </Container>
    </section>
  )
}

function validateOk(f) { return Object.keys(validate(f)).length > 0 }
