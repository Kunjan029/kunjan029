import { configured, redis } from './_redis.js'

// Private dashboard: /api/stats?key=YOUR_STATS_KEY  (STATS_KEY is set in Vercel's Environment Variables)
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const pairs = (flat) => {
  const out = []
  for (let i = 0; i < (flat || []).length; i += 2) out.push([flat[i], Number(flat[i + 1])])
  return out.sort((a, b) => b[1] - a[1])
}
const istDay = (offset = 0) => new Date(Date.now() + 19800000 - offset * 86400000).toISOString().slice(0, 10)
const ist = (ms) => new Date(Number(ms) + 19800000).toISOString().slice(5, 16).replace('T', ' ')
const short = (day) => { const d = new Date(day + 'T00:00:00Z'); return `${d.getUTCDate()} ${d.toLocaleString('en', { month: 'short', timeZone: 'UTC' })}` }
const num = (n) => Number(n || 0).toLocaleString('en-IN')
const COUNTRY = { IN: 'India', US: 'United States', GB: 'United Kingdom', AE: 'UAE', CA: 'Canada', AU: 'Australia', DE: 'Germany', SG: 'Singapore', NL: 'Netherlands', FR: 'France' }
const DAYS = 14

const hbars = (list, { n = 8, total, fmt = (k) => k } = {}) => {
  const rows = list.slice(0, n)
  if (!rows.length) return '<p class="empty">No data yet</p>'
  const max = Math.max(...rows.map((r) => r[1]), 1)
  return `<ul class="hb">${rows.map(([k, v]) => `<li><span class="hb__k">${esc(fmt(k))}</span><span class="hb__v">${num(v)}${total ? `<em>${Math.round((v / total) * 100)}%</em>` : ''}</span><i style="--w:${Math.max(3, (v / max) * 100)}%"></i></li>`).join('')}</ul>`
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Robots-Tag', 'noindex')
  const key = process.env.STATS_KEY
  if (!key || !configured()) return res.status(503).send('Stats not configured.')
  if (req.query?.key !== key) return res.status(401).send('Not allowed.')
  try {
    const dayKeys = Array.from({ length: DAYS }, (_, i) => istDay(DAYS - 1 - i))
    const r = await redis([
      ['GET', 'visits:total'], ['HGETALL', 'visits:days'], ['HGETALL', 'visits:country'], ['HGETALL', 'visits:city'],
      ['HGETALL', 'visits:ref'], ['HGETALL', 'visits:device'], ['HGETALL', 'clicks:total'], ['HGETALL', 'sections:total'],
      ['LRANGE', 'events', 0, 39], ['GET', 'plays:total'], ['HGETALL', 'plays:city'],
      ...dayKeys.map((d) => ['HGETALL', `clicks:${d}`]),
    ])
    const [vt, vd, vc, vcity, vref, vdev, clicks, sections, events, pt, pcity, ...clicksByDay] = r.map((x) => x.result)
    const visitsByDay = Object.fromEntries(pairs(vd))
    const series = dayKeys.map((d, i) => ({ d, v: visitsByDay[d] || 0, c: pairs(clicksByDay[i]).reduce((a, [, n]) => a + n, 0) }))
    const total = Number(vt) || 0
    const today = series[DAYS - 1].v
    const yest = series[DAYS - 2].v
    const week = series.slice(-7).reduce((a, s) => a + s.v, 0)
    const prevWeek = series.slice(0, 7).reduce((a, s) => a + s.v, 0)
    const clickMap = Object.fromEntries(pairs(clicks))
    const clicksToday = series[DAYS - 1].c
    const resume = clickMap['resume download'] || 0
    const contact = (clickMap.whatsapp || 0) + (clickMap.email || 0) + (clickMap["let's talk"] || 0) + (clickMap.linkedin || 0)
    const delta = (a, b) => (b ? `<em class="${a >= b ? 'up' : 'down'}">${a >= b ? '▲' : '▼'} ${Math.abs(Math.round(((a - b) / b) * 100))}%</em>` : '<em>–</em>')
    const maxV = Math.max(...series.map((s) => s.v), 1)
    const chart = series.map((s) => `<div class="col" title="${short(s.d)}: ${s.v} visitors, ${s.c} clicks"><span class="col__n">${s.v || ''}</span><div class="col__bar"><i style="--h:${(s.v / maxV) * 100}%"></i></div><span class="col__d">${short(s.d).split(' ')[0]}</span></div>`).join('')

    const secOrder = [['about', 'About'], ['why', 'Why hire me'], ['work', 'Work'], ['arcade', 'Creative break'], ['services', 'Services'], ['contact', 'Contact']]
    const secMap = Object.fromEntries(pairs(sections))
    const funnel = secOrder.map(([id, label]) => `<li><span>${label}</span><b>${num(secMap[id])}</b><i style="--w:${total ? Math.min(100, ((secMap[id] || 0) / total) * 100) : 0}%"></i></li>`).join('')

    const dev = pairs(vdev)
    const devTotal = dev.reduce((a, [, n]) => a + n, 0) || 1
    const colors = ['#C6FF4D', '#7fb3ff', '#ff9f6b']
    let acc = 0
    const donut = dev.length ? `conic-gradient(${dev.map(([, n], i) => { const s = acc; acc += (n / devTotal) * 100; return `${colors[i % 3]} ${s}% ${acc}%` }).join(',')})` : '#26262b'
    const legend = dev.map(([k, n], i) => `<li><i style="background:${colors[i % 3]}"></i>${esc(k)}<b>${Math.round((n / devTotal) * 100)}%</b></li>`).join('')

    const feed = (events || []).map((e) => {
      const [t, place, what = ''] = String(e).split('|')
      const kind = what.startsWith('visit') ? 'visit' : 'click'
      return `<li class="${kind}"><i></i><span class="f__t">${esc(ist(t))}</span><span class="f__p">${esc(place)}</span><span class="f__w">${esc(what)}</span></li>`
    }).join('') || '<li class="empty">No activity yet</li>'

    const kpi = (label, value, sub) => `<div class="kpi"><span>${label}</span><b>${value}</b><small>${sub || ''}</small></div>`
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="120"><title>Portfolio dashboard</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#0b0b0d;--card:#111114;--line:#26262b;--text:#f3f1ea;--mute:#a9a79f;--acc:#c6ff4d;--blue:#7fb3ff;--down:#ff8a7a;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.4 Inter,system-ui,sans-serif}
.wrap{max-width:1180px;margin:0 auto;padding:24px 16px 48px}
header{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-bottom:20px}
h1{font:700 26px 'Space Grotesk',sans-serif;margin:0}h1 span{color:var(--acc)}.sub{color:var(--mute);font-size:12px;margin-top:2px}
.tag{border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-size:12px;color:var(--mute);display:flex;gap:8px;align-items:center}.tag:before{content:'';width:8px;height:8px;border-radius:50%;background:var(--acc);box-shadow:0 0 0 4px rgb(198 255 77/.15)}
.grid{display:grid;gap:12px}.kpis{grid-template-columns:repeat(6,1fr);margin-bottom:12px}.kpis4{grid-template-columns:repeat(4,1fr);margin-bottom:12px}
.kpi,.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px}
.kpi span{display:block;color:var(--mute);font-size:12px}.kpi b{display:block;font:700 32px/1.15 'Space Grotesk',sans-serif;margin:6px 0 2px}.kpi small{color:var(--mute);font-size:12px}
.kpi:first-child b,.kpi.hot b,.kpis4 .kpi b{color:var(--acc)}
em{font-style:normal;color:var(--mute);font-size:12px;margin-left:6px}em.up{color:var(--acc)}em.down{color:var(--down)}
.row{grid-template-columns:2fr 1fr;margin-bottom:12px}.row3{grid-template-columns:repeat(3,1fr);margin-bottom:12px}.row2{grid-template-columns:1fr 1fr;margin-bottom:12px}
h2{font:500 12px Inter,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--mute);margin:0 0 14px;display:flex;justify-content:space-between}
h2 small{letter-spacing:0;text-transform:none;font-size:12px}
.chart{display:flex;gap:6px;align-items:flex-end;height:210px}.col{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;min-width:0}
.col__bar{flex:1;width:100%;display:flex;align-items:flex-end;background:linear-gradient(var(--line) 1px,transparent 1px) 0 0/100% 25%;border-radius:6px}
.col__bar i{display:block;width:100%;height:var(--h);min-height:3px;border-radius:6px;background:linear-gradient(var(--acc),#8fcb2c)}
.col__n{font-size:11px;color:var(--text);height:14px}.col__d{font-size:11px;color:var(--mute)}
.hb{list-style:none;margin:0;padding:0;display:grid;gap:12px}.hb li{position:relative;display:flex;justify-content:space-between;gap:10px;padding-bottom:7px}
.hb li i,.fn li i{position:absolute;left:0;bottom:0;height:4px;width:var(--w);border-radius:4px;background:var(--acc)}.hb li:after,.fn li:after{content:'';position:absolute;left:0;right:0;bottom:0;height:4px;border-radius:4px;background:var(--line);z-index:0}.hb li i,.fn li i{z-index:1}
.hb__k{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hb__v{font-weight:600;white-space:nowrap}
.fn{list-style:none;margin:0;padding:0;display:grid;gap:12px}.fn li{position:relative;display:flex;justify-content:space-between;padding-bottom:7px}.fn b{font-weight:600}
.donut{width:120px;height:120px;border-radius:50%;background:${donut};-webkit-mask:radial-gradient(circle 36px,transparent 98%,#000 100%);mask:radial-gradient(circle 36px,transparent 98%,#000 100%);flex:none}
.dev{display:flex;gap:20px;align-items:center}.dev ul{list-style:none;margin:0;padding:0;display:grid;gap:8px;flex:1}.dev li{display:flex;align-items:center;gap:8px;text-transform:capitalize}.dev li i{width:10px;height:10px;border-radius:3px}.dev li b{margin-left:auto}
.feed{list-style:none;margin:0;padding:0;max-height:420px;overflow:auto}.feed li{display:grid;grid-template-columns:10px 92px 170px 1fr;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line)}
.feed li i{width:8px;height:8px;border-radius:50%;background:var(--blue)}.feed li.click i{background:var(--acc)}.f__t,.f__p{color:var(--mute);font-size:13px}
.empty{color:var(--mute);margin:0}
@media(max-width:980px){.kpis{grid-template-columns:repeat(3,1fr)}.row,.row3,.row2{grid-template-columns:1fr}}
@media(max-width:560px){.kpis,.kpis4{grid-template-columns:repeat(2,1fr)}.feed li{grid-template-columns:10px 1fr;}.f__p,.f__w{grid-column:2}.kpi b{font-size:28px}}
</style>
<div class="wrap">
<header><div><h1>Portfolio <span>dashboard</span></h1><div class="sub">kunjan029.vercel.app · times in IST · one count per visitor per day · refreshes every 2 min · add <code>?me=1</code> to the site URL once to hide your own visits</div></div><div class="tag">Live · ${new Date(Date.now() + 19800000).toISOString().slice(0, 16).replace('T', ' ')} IST</div></header>

<div class="grid kpis">
${kpi('Visitors · all time', num(total), '')}
${kpi('Today', num(today), `${delta(today, yest)} vs yesterday`)}
${kpi('Last 7 days', num(week), `${delta(week, prevWeek)} vs previous 7`)}
${kpi('Clicks today', num(clicksToday), 'all tracked buttons')}
<div class="kpi hot"><span>Resume downloads</span><b>${num(resume)}</b><small>all time</small></div>
<div class="kpi hot"><span>Reached out</span><b>${num(contact)}</b><small>total of the 4 below</small></div>
</div>
<div class="grid kpis4">
<div class="kpi"><span>WhatsApp</span><b>${num(clickMap.whatsapp || 0)}</b><small>clicks, all time</small></div>
<div class="kpi"><span>Email</span><b>${num(clickMap.email || 0)}</b><small>clicks, all time</small></div>
<div class="kpi"><span>LinkedIn</span><b>${num(clickMap.linkedin || 0)}</b><small>clicks, all time</small></div>
<div class="kpi"><span>Let's talk</span><b>${num(clickMap["let's talk"] || 0)}</b><small>clicks, all time</small></div>
</div>

<div class="grid row">
<section class="card"><h2>Visitors · last ${DAYS} days <small>${num(series.reduce((a, s) => a + s.c, 0))} clicks in this period</small></h2><div class="chart">${chart}</div></section>
<section class="card"><h2>Where they came from</h2>${hbars(pairs(vref), { n: 7, total })}</section>
</div>

<div class="grid row3">
<section class="card"><h2>What they clicked <small>all time</small></h2>${hbars(pairs(clicks), { n: 9 })}</section>
<section class="card"><h2>How far they scrolled <small>visitors reached</small></h2><ul class="fn">${funnel}</ul></section>
<section class="card"><h2>Device</h2><div class="dev"><div class="donut"></div><ul>${legend || '<li class="empty">No data yet</li>'}</ul></div><h2 style="margin-top:22px">Game <small>${num(pt)} played</small></h2>${hbars(pairs(pcity), { n: 4 })}</section>
</div>

<div class="grid row2">
<section class="card"><h2>Countries</h2>${hbars(pairs(vc), { n: 8, total, fmt: (k) => COUNTRY[k] || k })}</section>
<section class="card"><h2>Top cities</h2>${hbars(pairs(vcity), { n: 8, total })}</section>
</div>

<section class="card"><h2>Recent activity <small><span style="color:var(--blue)">●</span> visit &nbsp; <span style="color:var(--acc)">●</span> click</small></h2><ul class="feed">${feed}</ul></section>
</div>`)
  } catch {
    return res.status(500).send('Failed to load stats.')
  }
}
