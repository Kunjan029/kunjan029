// Small first-party analytics: visits, clicks and sections reached. Production only; see api/track.js.
// Open the site once with ?me=1 on your own devices to stop counting your own visits (?me=0 turns counting back on).
const OWNER = 'kunjan-portfolio:owner'

function skip() {
  try {
    const q = new URLSearchParams(window.location.search).get('me')
    if (q === '1') window.localStorage.setItem(OWNER, '1')
    if (q === '0') window.localStorage.removeItem(OWNER)
    if (window.localStorage.getItem(OWNER)) return true
  } catch { /* no storage */ }
  return import.meta.env.DEV || navigator.webdriver || ['localhost', '127.0.0.1'].includes(window.location.hostname)
}

function send(payload) {
  try {
    const data = JSON.stringify(payload)
    if (navigator.sendBeacon && navigator.sendBeacon('/api/track', new Blob([data], { type: 'text/plain' }))) return
    fetch('/api/track', { method: 'POST', body: data, keepalive: true }).catch(() => {})
  } catch { /* ignore */ }
}

// Traffic source: ?ref=linkedin (also ?utm_source= / ?source=), else the referring site, else 'direct'.
// Kept for the browser tab session so every click on this visit is credited to the same source.
const REF_KEY = 'kunjan-portfolio:ref'
function source() {
  const p = new URLSearchParams(window.location.search)
  const tag = (p.get('ref') || p.get('utm_source') || p.get('source') || '').trim().toLowerCase().slice(0, 40)
  let ref = tag
  if (!ref) {
    try { ref = window.sessionStorage.getItem(REF_KEY) || '' } catch { /* no storage */ }
  }
  if (!ref) {
    try {
      const host = new URL(document.referrer).hostname.replace(/^www\./, '')
      ref = host && host !== window.location.hostname ? host : 'direct'
    } catch { ref = 'direct' }
  }
  try { window.sessionStorage.setItem(REF_KEY, ref) } catch { /* no storage */ }
  return ref
}

function clickName(el) {
  // Buttons that name themselves, e.g. data-track="cta strip: whatsapp"
  const named = el.closest('[data-track]')
  if (named) return named.getAttribute('data-track').slice(0, 60)
  const media = el.closest('.work-card__media, .work-card__link')
  if (media) {
    const card = media.closest('article, li, div[class*="work-card"]')
    const label = media.getAttribute('aria-label') || card?.querySelector('h3')?.textContent || ''
    const title = label.replace(/^Explore\s+/i, '').trim()
    return title ? `project: ${title}`.slice(0, 60) : 'project'
  }
  const a = el.closest('a')
  if (a) {
    const h = a.getAttribute('href') || ''
    if (/wa\.me|whatsapp/i.test(h)) return 'whatsapp'
    // Email links open a Gmail compose window (mail.google.com), not mailto:, which is why Email always showed 0
    if (h.startsWith('mailto:') || /mail\.google\.com/i.test(h)) return 'email'
    if (/linkedin\.com/i.test(h)) return 'linkedin'
    if (/drive\.google\.com|\.pdf/i.test(h) || a.classList.contains('link--resume')) return 'resume download'
    if (h === '#contact') return "let's talk"
    if (/behance|dribbble|instagram|github/i.test(h)) return new URL(h, window.location.href).hostname.replace(/^www\./, '').split('.')[0]
  }
  return ''
}

let on = false
let ref = 'direct'

// For events that are not plain link clicks (e.g. the contact form was sent)
export function trackEvent(name) {
  if (on && name) send({ type: 'click', name: String(name).slice(0, 60), ref })
}

// Sections in page order, used for the scroll drop-off funnel on the dashboard (keep in sync with api/track.js)
export const TRACKED_SECTIONS = ['top', 'why', 'work', 'cta', 'testimonials', 'process', 'services', 'about', 'contact']

export function initTrack() {
  if (skip()) return
  on = true
  ref = source()
  const device = window.matchMedia('(max-width: 767px)').matches ? 'phone' : window.matchMedia('(max-width: 1100px)').matches ? 'tablet' : 'desktop'
  send({ type: 'visit', ref, device })

  document.addEventListener('click', (e) => {
    const el = e.target instanceof Element ? e.target : null
    const name = el && clickName(el)
    if (name) send({ type: 'click', name, ref })
  }, true)

  // Time on page: only time the tab is actually visible counts. Sent whenever the tab is hidden or closed;
  // the server keeps the highest value per visitor per day, so repeated sends never double count.
  let visibleSince = document.visibilityState === 'visible' ? Date.now() : 0
  let total = 0
  const flush = () => {
    if (visibleSince) { total += Date.now() - visibleSince; visibleSince = 0 }
    const s = Math.round(total / 1000)
    if (s >= 1) send({ type: 'time', s })
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
    else if (!visibleSince) visibleSince = Date.now()
  })
  window.addEventListener('pagehide', flush)

  if ('IntersectionObserver' in window) {
    const seen = new Set()
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting && !seen.has(en.target.id)) { seen.add(en.target.id); send({ type: 'section', name: en.target.id }); io.unobserve(en.target) }
      }
    }, { rootMargin: '-45% 0px -45% 0px' })
    const watch = () => TRACKED_SECTIONS.forEach((id) => { const n = document.getElementById(id); if (n) io.observe(n) })
    if (document.readyState === 'complete') watch()
    else window.addEventListener('load', watch)
  }
}
