// Smooth-scroll to a section by id. Returns false if the section doesn't exist yet.
export function scrollToId(id) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const behavior = reduce ? 'auto' : 'smooth'

  if (id === 'top') {
    window.scrollTo({ top: 0, behavior })
    return true
  }

  const el = document.getElementById(id)
  if (!el) return false
  el.scrollIntoView({ behavior, block: 'start' }) // respects scroll-padding-top
  history.replaceState(null, '', `#${id}`)

  // Lazy images above the target can change the page height mid-scroll, so the
  // smooth scroll lands short. Once it settles, re-aim until the target is in place.
  let tries = 0
  let lastY = -1
  let still = 0
  const settle = () => {
    const y = window.scrollY
    still = Math.abs(y - lastY) < 1 ? still + 1 : 0
    lastY = y
    if (still >= 4) { // ~200ms without movement: scroll has stopped
      const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
      if (Math.abs(el.getBoundingClientRect().top - pad) > 8 && tries < 4) {
        tries += 1
        still = 0
        el.scrollIntoView({ behavior, block: 'start' })
      } else return
    }
    if (tries < 5) setTimeout(settle, 50)
  }
  setTimeout(settle, 100)
  return true
}
