// Inside an embedded preview (an iframe) browsers block mailto: links with "This content is blocked".
// There, copy the address instead and say so. On the real site, mailto: links work as normal.
const embedded = () => { try { return window.self !== window.top } catch { return true } }

function toast(text) {
  document.querySelector('.mail-toast')?.remove()
  const el = document.createElement('div')
  el.className = 'mail-toast'
  el.setAttribute('role', 'status')
  el.textContent = text
  Object.assign(el.style, {
    position: 'fixed', left: '50%', bottom: '5.5rem', transform: 'translateX(-50%)', zIndex: 200, maxWidth: 'calc(100% - 2rem)',
    padding: '0.7rem 1.1rem', borderRadius: '999px', background: '#C6FF4D', color: '#0B0B0D',
    font: '600 0.875rem/1.2 Inter, system-ui, sans-serif', boxShadow: '0 8px 24px rgb(0 0 0 / 0.4)',
  })
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3200)
}

export function installMailtoFallback() {
  if (!embedded()) return () => {}
  const onClick = (e) => {
    const a = e.target.closest?.('a[href^="mailto:"]')
    if (!a) return
    e.preventDefault()
    const addr = decodeURIComponent(a.getAttribute('href').slice(7).split('?')[0])
    const done = () => toast(`Email address copied: ${addr}`)
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(addr).then(done, () => toast(`Email: ${addr}`))
    else toast(`Email: ${addr}`)
  }
  document.addEventListener('click', onClick)
  return () => document.removeEventListener('click', onClick)
}
