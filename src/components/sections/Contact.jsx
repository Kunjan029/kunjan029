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
const EMPTY = { name: '', email: '', topic: '', message: '', website: '' } // `website` is a hidden honeypot for bots

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
  const [sending, setSending] = useState(false)
  const [why, setWhy] = useState('')

  const channels = getChannels()
  const hasWa = channels.some((c) => c.id === 'whatsapp')
  const hasMail = channels.some((c) => c.id === 'email')
  const resume = getResume()

  function update(patch) {
    const next = { ...form, ...patch }
    setForm(next)
    if (attempted) setErrors(validate(next))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (sending) return
    setAttempted(true)
    const errs = validate(form)
    setErrors(errs)
    const first = ['name', 'email', 'message'].find((k) => errs[k])
    if (first) { document.getElementById(`c-${first}`)?.focus(); return }

    const text = buildInquiry({ ...form, opportunity: form.topic || 'General enquiry', services: [] })
    const fallback = {
      text,
      waUrl: hasWa ? whatsappUrl(CONTACT.whatsapp, text) : '',
      mailUrl: hasMail ? mailtoUrl(CONTACT.email, `Inquiry from ${form.name.trim()}`, text) : '',
    }

    // Bots fill the hidden field: pretend success and send nothing
    if (form.website) { setSent({ ...fallback, delivered: true }); return }

    setSending(true)
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${CONTACT.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          regarding: form.topic || 'Not specified',
          message: form.message.trim(),
          _subject: `Portfolio enquiry from ${form.name.trim()}`,
          _replyto: form.email.trim(),
          _template: 'table',
          _captcha: 'false',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.success === 'false' || data.success === false) throw new Error(data.message || `HTTP ${res.status}`)
      setSent({ ...fallback, delivered: true })
    } catch (err) {
      setWhy(String(err && err.message ? err.message : err).slice(0, 160))
      setSent({ ...fallback, delivered: false }) // never lose the message: offer WhatsApp / email / copy
    } finally {
      setSending(false)
    }
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

            <dl className="ct__facts">
              <div><dt>Based in</dt><dd>Ahmedabad, India · IST (UTC+5:30)</dd></div>
              <div><dt>Work</dt><dd>Remote-friendly, full-time roles and freelance projects</dd></div>
              <div><dt>Reach me on</dt><dd>WhatsApp or email</dd></div>
            </dl>

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
                <input className="f__hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={(e) => update({ website: e.target.value })} />
                <div className="f__foot">
                  <button type="submit" className="f__send" disabled={sending} data-cursor>{sending ? 'Sending…' : 'Send mail'} {!sending && <ArrowRight size={18} aria-hidden="true" />}</button>
                  <p>I’ll reply to your email. Prefer WhatsApp? Use the links on the left.</p>
                </div>
              </form>
            ) : (
              <div className="done" ref={doneRef} tabIndex={-1} role="status">
                <span className="done__ic" aria-hidden="true"><Check size={20} strokeWidth={3} /></span>
                {sent.delivered ? (
                  <>
                    <h3>Message sent, {form.name.trim().split(' ')[0]}.</h3>
                    <p>Thanks for reaching out. I’ll reply to {form.email.trim()} soon.</p>
                    <div className="done__actions">
                      {sent.waUrl && <a className="f__alt" href={sent.waUrl} target="_blank" rel="noopener noreferrer" data-cursor>Also message on WhatsApp</a>}
                      <button type="button" className="f__link" onClick={() => { setSent(null); setForm(EMPTY); setAttempted(false); setErrors({}) }} data-cursor>Send another</button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3>Couldn’t send it from here.</h3>
                    <p>No problem, your message is saved below. Send it with one tap instead.{why ? <small className="done__why"> ({why})</small> : null}</p>
                    <textarea id="c-prepared" rows={7} readOnly value={sent.text} aria-label="Prepared message" />
                    <div className="done__actions">
                      {sent.waUrl && <a className="f__send" href={sent.waUrl} target="_blank" rel="noopener noreferrer" data-cursor>Open WhatsApp</a>}
                      {sent.mailUrl && <a className="f__alt" href={sent.mailUrl} target="_blank" rel="noopener noreferrer" data-cursor>Send by email</a>}
                      <button type="button" className="f__alt" onClick={copy} data-cursor><Copy size={15} aria-hidden="true" /> {copied ? 'Copied' : 'Copy'}</button>
                      <button type="button" className="f__link" onClick={() => setSent(null)} data-cursor>Edit</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}
