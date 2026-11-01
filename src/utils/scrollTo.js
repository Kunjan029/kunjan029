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
  return true
}
