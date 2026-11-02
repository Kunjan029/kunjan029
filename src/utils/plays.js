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

// ---------- Leaderboard ----------
export async function fetchScores(game) {
  try {
    const r = await fetch(`/api/scores?game=${encodeURIComponent(game)}`)
    return r.ok ? await r.json() : null
  } catch { return null }
}

// Returns { ok, error?, data? }
export async function submitScore(game, name, score) {
  try {
    const r = await fetch('/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ game, name, score }) })
    const d = await r.json().catch(() => ({}))
    return r.ok ? { ok: true, data: d } : { ok: false, error: d.error || 'Could not save' }
  } catch { return { ok: false, error: 'Could not save, try again' } }
}

// Games call this when a round ends; the leaderboard under the game listens for it.
export function reportGameOver(game, score) {
  try { window.dispatchEvent(new CustomEvent('kp-gameover', { detail: { game, score } })) } catch { /* ignore */ }
}
