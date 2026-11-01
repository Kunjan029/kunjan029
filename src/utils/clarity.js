import { CLARITY_ID } from '../data/analytics.js'

// Loads Microsoft Clarity once, in production only, and only when a project ID is set.
export function initClarity() {
  const id = CLARITY_ID.trim()
  if (!id || import.meta.env.DEV || window.clarity) return
  ;(function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) }
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y)
  })(window, document, 'clarity', 'script', id)
}
