import { configured, redis } from './_redis.js'

// Private page: /api/stats?key=YOUR_STATS_KEY  (set STATS_KEY in Vercel's Environment Variables)
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const pairs = (flat) => {
  const out = []
  for (let i = 0; i < (flat || []).length; i += 2) out.push([flat[i], Number(flat[i + 1])])
  return out.sort((a, b) => b[1] - a[1])
}
const istDay = (offset = 0) => new Date(Date.now() + 19800000 - offset * 86400000).toISOString().slice(0, 10)
const ist = (ms) => new Date(Number(ms) + 19800000).toISOString().slice(5, 16).replace('T', ' ')

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Robots-Tag', 'noindex')
  const key = process.env.STATS_KEY
  if (!key || !configured()) return res.status(503).send('Stats not configured.')
  if (req.query?.key !== key) return res.status(401).send('Not allowed.')
  try {
    const r = await redis([
      ['GET', 'visits:total'], ['HGETALL', 'visits:days'], ['HGETALL', 'visits:country'], ['HGETALL', 'visits:city'],
      ['HGETALL', 'visits:ref'], ['HGETALL', 'visits:device'], ['HGETALL', 'clicks:total'], ['HGETALL', 'sections:total'],
      ['LRANGE', 'events', 0, 59], ['GET', 'plays:total'], ['HGETALL', 'plays:city'], ['HGETALL', `clicks:${istDay()}`],
    ])
    const [vt, vd, vc, vcity, vref, vdev, clicks, sections, events, pt, pcity, clicksToday] = r.map((x) => x.result)
    const days = Object.fromEntries(pairs(vd))
    const today = days[istDay()] || 0
    let week = 0
    for (let i = 0; i < 7; i++) week += days[istDay(i)] || 0
    const rows = (list, n = 15) => list.slice(0, n).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v}</td></tr>`).join('') || '<tr><td>No data yet</td><td></td></tr>'
    const card = (title, list, n) => `<section><h2>${title}</h2><table>${rows(list, n)}</table></section>`
    const feed = (events || []).map((e) => { const [t, place, what] = String(e).split('|'); return `<tr><td class="t">${esc(ist(t))}</td><td>${esc(place)}</td><td>${esc(what)}</td></tr>` }).join('') || '<tr><td>No activity yet</td></tr>'
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Portfolio stats</title>
<style>body{font:15px system-ui;background:#0b0b0d;color:#f3f1ea;margin:0;padding:24px;max-width:760px}h1{font-size:15px;margin:0 0 16px;color:#a9a79f;font-weight:500}
.big{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:8px}.big div{background:#111114;border:1px solid #26262b;border-radius:12px;padding:14px}.big b{display:block;font-size:34px;color:#c6ff4d;line-height:1.1}.big span{font-size:12px;color:#a9a79f}
h2{margin:26px 0 8px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#a9a79f}table{width:100%;border-collapse:collapse}td{padding:7px 0;border-bottom:1px solid #26262b;vertical-align:top}td:last-child{text-align:right;font-weight:600}.feed td:last-child{text-align:left;font-weight:400}.t{color:#a9a79f;white-space:nowrap;padding-right:10px}.feed td:nth-child(2){padding-right:10px;color:#a9a79f}
@media(max-width:560px){.big{grid-template-columns:repeat(2,1fr)}}</style>
<h1>Portfolio stats · times in IST · each visitor counted once per day · open the site once with <code>?me=1</code> to hide your own visits</h1>
<div class="big"><div><b>${Number(vt) || 0}</b><span>Visitors total</span></div><div><b>${today}</b><span>Today</span></div><div><b>${week}</b><span>Last 7 days</span></div><div><b>${Number(pt) || 0}</b><span>Played the game</span></div></div>
${card('Clicks today', pairs(clicksToday))}${card('Clicks all time', pairs(clicks))}${card('Where visitors came from', pairs(vref))}${card('Sections reached', pairs(sections))}
${card('Countries', pairs(vc), 20)}${card('Top cities', pairs(vcity), 25)}${card('Device', pairs(vdev))}${card('Game players by city', pairs(pcity), 15)}
<section><h2>Recent activity</h2><table class="feed">${feed}</table></section>`)
  } catch {
    return res.status(500).send('Failed to load stats.')
  }
}
