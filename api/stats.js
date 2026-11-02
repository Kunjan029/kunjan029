import { configured, redis } from './_redis.js'

// Private page: /api/stats?key=YOUR_STATS_KEY  (set STATS_KEY in Vercel's Environment Variables)
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const pairs = (flat) => {
  const out = []
  for (let i = 0; i < (flat || []).length; i += 2) out.push([flat[i], Number(flat[i + 1])])
  return out.sort((a, b) => b[1] - a[1])
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Robots-Tag', 'noindex')
  const key = process.env.STATS_KEY
  if (!key || !configured()) return res.status(503).send('Stats not configured.')
  if (req.query?.key !== key) return res.status(401).send('Not allowed.')
  try {
    const [total, countries, cities] = await redis([['GET', 'plays:total'], ['HGETALL', 'plays:country'], ['HGETALL', 'plays:city']])
    const rows = (list, n) => list.slice(0, n).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v}</td></tr>`).join('')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Game plays</title>
<style>body{font:16px system-ui;background:#0b0b0d;color:#f3f1ea;margin:0;padding:24px;max-width:640px}h1{font-size:44px;margin:0;color:#c6ff4d}h2{margin:28px 0 8px;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#a9a79f}table{width:100%;border-collapse:collapse}td{padding:8px 0;border-bottom:1px solid #26262b}td:last-child{text-align:right;font-weight:600}</style>
<p>People who played</p><h1>${Number(total.result) || 0}</h1>
<h2>Countries</h2><table>${rows(pairs(countries.result), 30)}</table>
<h2>Top cities</h2><table>${rows(pairs(cities.result), 40)}</table>`)
  } catch {
    return res.status(500).send('Failed to load stats.')
  }
}
