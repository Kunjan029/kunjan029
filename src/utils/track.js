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

// A round of a game started (counted every time, so the dashboard shows which games are really played)
export function trackGame(name) {
  if (skip()) return
  send({ type: 'game', name })
}

function source() {
  const p = new URLSearchParams(window.location.search)
  const utm = p.get('utm_source') || p.get('ref') || p.get('source')
  if (utm) return utm
  try {
    const host = new URL(document.referrer).hostname.replace(/^www\./, '')
    return host && host !== window.location.hostname ? host : 'direct'
  } catch { return 'direct' }
}

function clickName(el) {
  const media = el.closest('.work-card__media, .work-card__link')
  if (media) {
    const card = media.closest('article, li, div[class*="work-card"]')
    const label = media.getAttribute('aria-label') || card?.querySelector('h3')?.textContent || ''
    const title = label.replace(/^Explore\s+/i, '').trim()
    return title ? `project: ${title}`.slice(0, 60) : 'project'
  }
  if (el.closest('.fwa--why')) return 'why hire me icon'
  const a = el.closest('a')
  if (a) {
    const h = a.getAttribute('href') || ''
    if (/wa\.me|whatsapp/i.test(h)) return 'whatsapp'
    if (h.startsWith('mailto:')) return 'email'
    if (/linkedin\.com/i.test(h)) return 'linkedin'
    if (/drive\.google\.com|\.pdf/i.test(h) || a.classList.contains('link--resume')) return 'resume download'
    if (h === '#contact') return "let's talk"
    if (/behance|dribbble|instagram|github/i.test(h)) return new URL(h, window.location.href).hostname.replace(/^www\./, '').split('.')[0]
  }
  return ''
}

export function initTrack() {
  if (skip()) return
  const device = window.matchMedia('(max-width: 767px)').matches ? 'phone' : window.matchMedia('(max-width: 1100px)').matches ? 'tablet' : 'desktop'
  send({ type: 'visit', ref: source(), device })

  document.addEventListener('click', (e) => {
    const el = e.target instanceof Element ? e.target : null
    const name = el && clickName(el)
    if (name) send({ type: 'click', name })
  }, true)

  if ('IntersectionObserver' in window) {
    const seen = new Set()
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting && !seen.has(en.target.id)) { seen.add(en.target.id); send({ type: 'section', name: en.target.id }); io.unobserve(en.target) }
      }
    }, { rootMargin: '-45% 0px -45% 0px' })
    window.addEventListener('load', () => ['about', 'why', 'work', 'arcade', 'services', 'testimonials', 'contact'].forEach((id) => { const n = document.getElementById(id); if (n) io.observe(n) }))
  }
}
