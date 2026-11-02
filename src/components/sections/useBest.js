import { useState } from 'react'

// Best score per game, kept in localStorage when it is available.
export default function useBest(key) {
  const k = `kunjan-portfolio:${key}-best`
  const [best, setBest] = useState(() => { try { return parseInt(window.localStorage.getItem(k), 10) || 0 } catch { return 0 } })
  const submit = (n) => {
    if (n <= best) return false
    setBest(n)
    try { window.localStorage.setItem(k, String(n)) } catch { /* in-memory only */ }
    return true
  }
  return [best, submit]
}
