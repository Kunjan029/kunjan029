const FLAG = 'kunjan-portfolio:played'

// Public total, or null when the counter isn't available (local dev, not configured, offline)
export async function fetchPlayCount() {
  try {
    const r = await fetch('/api/play')
    if (!r.ok) return null
    const d = await r.json()
    return typeof d.count === 'number' ? d.count : null
  } catch {
    return null
  }
}

// Called when a game starts: counts the visitor once per browser, and sends a Clarity event.
export function registerPlay() {
  try {
    if (window.localStorage.getItem(FLAG)) return
    window.localStorage.setItem(FLAG, '1')
  } catch { /* no storage: the server still stops repeat counts for 24h */ }
  try { window.clarity?.('event', 'game_played') } catch { /* ignore */ }
  try { fetch('/api/play', { method: 'POST', keepalive: true }).catch(() => {}) } catch { /* ignore */ }
}
