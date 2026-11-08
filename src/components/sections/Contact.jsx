import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, ArrowUpRight, Check, Copy, Download } from 'lucide-react'
import Container from '../ui/Container.jsx'
import { CONTACT, getChannels, getResume } from '../../data/contact.js'
import { buildInquiry, whatsappUrl, mailtoUrl, EMAIL_RE } from '../../utils/inquiry.js'
import './Contact.css'

gsap.registerPlugin(ScrollTrigger)

const TOPICS = ['Full-time job opportunity', 'Freelance project', 'Ongoing collaboration', 'Something else']
const EMPTY = { name: '', email: '', topic: '', message: '' }

function validate(f) {
  const e = {}
  if (!f.name.trim()) e.name = 'Please add your name.'
  if (!f.email.trim()) e.email = 'Please add your email.'
  else if (!EMAIL_RE.test(f.email.trim())) e.email = 'That email doesn’t look right.'
  if (f.message.trim().length < 10) e.message = 'A sentence or two is plenty.'
  return e
}

export default function Contact() {
  const rootRef = useRef(null)
  const doneRef = useRef(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [attempted, setAttempted] = useState(false)
  const [sent, setSent] = useState(null)
  const [copied, setCopied] = useState(false)

  const channels = getChannels()
  const hasWa = channels.some((c) => c.id === 'whatsapp')
  const hasMail = channels.some((c) => c.id === 'email')
  const resume = getResume()

  function update(patch) {
    const next = { ...form, ...patch }
    setForm(next)
    if (attempted) setErrors(validate(next))
  }

  function onSubmit(e) {
    e.preventDefault()
    setAttempted(true)
    const errs = validate(form)
    setErrors(errs)
    const first = ['name', 'email', 'message'].find((k) => errs[k])
    if (first) { document.getElementById(`c-${first}`)?.focus(); return }
    const text = buildInquiry({ ...form, opportunity: form.topic || 'General enquiry', services: [] })
    setSent({
      text,
      waUrl: hasWa ? whatsappUrl(CONTACT.whatsapp, text) : '',
      mailUrl: hasMail ? mailtoUrl(CONTACT.email, `Inquiry from ${form.name.trim()}`, text) : '',
    })
    setTimeout(() => doneRef.current?.focus(), 50)
  }

  async function copy() {
    try { await navigator.clipboard.writeText(sent.text) } catch {
      const ta = document.getElementById('c-prepared'); ta.select(); document.execCommand('copy')
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  useLayoutEffect(() => {
    const root = rootRef.current
    const mm = gsap.matchMedia(root)
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.ct__intro > *', { y: 18, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.ct__intro', start: 'top 85%', once: true } })
      gsap.from('.ct__panel', { y: 28, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.ct__panel', start: 'top 90%', once: true } })
    })
    return () => mm.revert()
  }, [])

  const err = (k) => errors[k] && <span className="f__err" id={`e-${k}`} role="alert">{errors[k]}</span>

  return (
    <section id="contact" className="ct" ref={rootRef}>
      <Container>
        <div className="ct__layout">
          <div className="ct__intro">
            <p className="ct__label">Contact</p>
            <h2 className="ct__title">Let’s work together.</h2>
            <p className="ct__lead">Hiring for a design role or have a project in mind? Send me a note and I’ll reply personally.</p>

            <ul className="ct__direct" role="list">
              {channels.map((c) => (
                <li key={c.id}>
                  <a href={c.href} {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} data-cursor>
                    <span><small>{c.label}</small><b>{c.hint}</b></span>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                </li>
              ))}
              {resume && (
                <li>
                  <a href={resume} target="_blank" rel="noopener noreferrer" data-cursor>
                    <span><small>Resume</small><b>Download PDF</b></span>
                    <Download size={16} aria-hidden="true" />
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div className="ct__panel" id="brief">
            {!sent ? (
              <form className="f" onSubmit={onSubmit} noValidate>
                <div className="f__row">
                  <label className="f__field" htmlFor="c-name">
                    <span>Name</span>
                    <input id="c-name" type="text" autoComplete="name" value={form.name} onChange={(e) => update({ name: e.target.value })} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'e-name' : undefined} />
                    {err('name')}
                  </label>
                  <label className="f__field" htmlFor="c-email">
                    <span>Email</span>
                    <input id="c-email" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={(e) => update({ email: e.target.value })} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'e-email' : undefined} />
                    {err('email')}
                  </label>
                </div>
                <label className="f__field" htmlFor="c-topic">
                  <span>Regarding <em>(optional)</em></span>
                  <select id="c-topic" value={form.topic} onChange={(e) => update({ topic: e.target.value })}>
                    <option value="">Select one</option>
                    {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="f__field" htmlFor="c-message">
                  <span>Message</span>
                  <textarea id="c-message" rows={5} value={form.message} onChange={(e) => update({ message: e.target.value })} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'e-message' : undefined} />
                  {err('message')}
                </label>
                <div className="f__foot">
                  <button type="submit" className="f__send" data-cursor>Send message <ArrowRight size={18} aria-hidden="true" /></button>
                  <p>Your message is prepared for WhatsApp or email. Nothing is sent until you choose.</p>
                </div>
              </form>
            ) : (
              <div className="done" ref={doneRef} tabIndex={-1} role="status">
                <span className="done__ic" aria-hidden="true"><Check size={20} strokeWidth={3} /></span>
                <h3>Thanks, {form.name.trim().split(' ')[0]}.</h3>
                <p>Your message is ready. Choose how you’d like to send it.</p>
                <textarea id="c-prepared" rows={7} readOnly value={sent.text} aria-label="Prepared message" />
                <div className="done__actions">
                  {sent.waUrl && <a className="f__send" href={sent.waUrl} target="_blank" rel="noopener noreferrer" data-cursor>Open WhatsApp</a>}
                  {sent.mailUrl && <a className="f__alt" href={sent.mailUrl} target="_blank" rel="noopener noreferrer" data-cursor>Send by email</a>}
                  <button type="button" className="f__alt" onClick={copy} data-cursor><Copy size={15} aria-hidden="true" /> {copied ? 'Copied' : 'Copy'}</button>
                  <button type="button" className="f__link" onClick={() => setSent(null)} data-cursor>Edit</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
