import { configured, redis } from './_redis.js'
import { isConversion, TIME_BUCKETS, SECTION_ORDER } from './_metrics.js'

// Private dashboard: /api/stats?key=YOUR_STATS_KEY  (STATS_KEY is set in Vercel's Environment Variables)
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const strMap = (a) => { const o = {}; for (let i = 0; i + 1 < (a || []).length; i += 2) o[a[i]] = a[i + 1]; return o } // text values (pairs() turns values into numbers)
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
    const today0 = istDay()
    const sel = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query?.date || '')) && req.query.date <= today0 ? req.query.date : today0 // day shown in the daily report
    const dayKeys = Array.from({ length: DAYS }, (_, i) => istDay(DAYS - 1 - i))
    const r = await redis([
      ['GET', 'visits:total'], ['HGETALL', 'visits:days'], ['HGETALL', 'visits:country'], ['HGETALL', 'visits:city'],
      ['HGETALL', 'visits:ref'], ['HGETALL', 'visits:device'], ['HGETALL', 'clicks:total'], ['HGETALL', 'sections:total'],
      ['LRANGE', 'events', 0, 199], ['HGETALL', 'visitors:count'], ['HGETALL', 'visitors:city'],
      ...dayKeys.map((d) => ['HGETALL', `clicks:${d}`]),
      ['HGETALL', `vd:${sel}`], ['HGETALL', `cd:${sel}`], ['HGETALL', `hd:${sel}`], ['HGETALL', `clicks:${sel}`], ['HGET', 'visits:days', sel], ['HGETALL', 'visitors:first'], ['HGETALL', 'visitors:last'],
      ['HGETALL', 'clicks:ref'], ['HGETALL', 'conv:visitors'], ['HGETALL', 'conv:ref'], ['GET', 'time:sum'], ['GET', 'time:n'], ['HGETALL', 'time:buckets'], ['HGETALL', 'sections:v2'],
    ])
    const [vt, vd, vc, vcity, vref, vdev, clicks, sections, events, vcount, vcityMap, ...tail] = r.map((x) => x.result)
    const clicksByDay = tail.slice(0, DAYS)
    const [selVd, selCd, selHd, selClicks, selVisits, vFirst, vLast] = tail.slice(DAYS, DAYS + 7)
    const [refClicksRaw, convVisRaw, convRefRaw, timeSum, timeN, timeBucketsRaw, secV2Raw] = tail.slice(DAYS + 7)
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
    const sumWhere = (fn) => Object.entries(clickMap).reduce((a, [k, n]) => a + (fn(k) ? n : 0), 0)
    const waAll = sumWhere((k) => /whatsapp/.test(k) || k.startsWith('project cta:')) // every WhatsApp button, incl. project CTAs
    const contact = sumWhere(isConversion) // all "reached out" clicks: WhatsApp, email, let's talk, resume, brief
    const delta = (a, b) => (b ? `<em class="${a >= b ? 'up' : 'down'}">${a >= b ? '▲' : '▼'} ${Math.abs(Math.round(((a - b) / b) * 100))}%</em>` : '<em>–</em>')
    const maxV = Math.max(...series.map((s) => s.v), 1)
    const chart = series.map((s) => `<div class="col" title="${short(s.d)}: ${s.v} visitors, ${s.c} clicks"><span class="col__n">${s.v || ''}</span><div class="col__bar"><i style="--h:${(s.v / maxV) * 100}%"></i></div><span class="col__d">${short(s.d).split(' ')[0]}</span></div>`).join('')

    const secOrder = SECTION_ORDER.filter(([id]) => id !== 'top')
    const secMap = Object.fromEntries(pairs(sections))
    const funnel = secOrder.map(([id, label]) => `<li><span>${label}</span><b>${num(secMap[id])}</b><i style="--w:${total ? Math.min(100, ((secMap[id] || 0) / total) * 100) : 0}%"></i></li>`).join('')

    const dev = pairs(vdev)
    const devTotal = dev.reduce((a, [, n]) => a + n, 0) || 1
    const colors = ['#C6FF4D', '#7fb3ff', '#ff9f6b']
    let acc = 0
    const donut = dev.length ? `conic-gradient(${dev.map(([, n], i) => { const s = acc; acc += (n / devTotal) * 100; return `${colors[i % 3]} ${s}% ${acc}%` }).join(',')})` : '#26262b'
    const legend = dev.map(([k, n], i) => `<li><i style="background:${colors[i % 3]}"></i>${esc(k)}<b>${Math.round((n / devTotal) * 100)}%</b></li>`).join('')

    const vis = pairs(vcount)
    const cityOf = strMap(vcityMap)
    const repeaters = vis.filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1])

    // Recent activity, one card per person (anonymous ID): everything that person did, in order
    const evs = (events || []).map((e) => {
      const [t, place, what = ''] = String(e).split('|')
      return { t, place, what, kind: what.startsWith('visit') ? 'visit' : 'click', id: (what.match(/· ID (\w+)/) || [])[1] || '' }
    })
    const people = new Map()
    const strays = []
    evs.forEach((ev) => { // newest first
      if (!ev.id) { strays.push(ev); return }
      if (!people.has(ev.id)) people.set(ev.id, { id: ev.id, place: ev.place, last: ev.t, list: [] })
      people.get(ev.id).list.push(ev)
    })
    const href = (d) => `?key=${encodeURIComponent(key)}&date=${d}`
    const firstOf = strMap(vFirst)
    const nice = (ev) => {
      if (ev.kind === 'visit') {
        const m = ev.what.match(/^visit via (.+?) \((\w+)\)(?: · ID \w+)?(?: · day (\d+))?/) || []
        return `Visited via ${m[1] || 'direct'}${m[2] ? ` (${m[2]})` : ''}`
      }
      const name = ev.what.replace(/^clicked /, '').replace(/ · ID \w+$/, '')
      return name.startsWith('project: ') ? `Opened project: ${name.slice(9)}` : `Clicked ${name}`
    }
    // Returning visit: "Visited again · previous visit on 2 Nov" (the day links to that day's report)
    const again = (ev) => {
      if (ev.kind !== 'visit' || !/ · returning/.test(ev.what)) return ''
      const prev = (ev.what.match(/ · prev (\d{4}-\d{2}-\d{2})/) || [])[1] || firstOf[ev.id] || ''
      return ` <b class="again">↺ Visited again${prev ? ` · previous visit on <a class="dlink" href="${href(prev)}#daily">${esc(short(prev))}</a>` : ''}</b>`
    }
    const step = (ev) => `<li class="${ev.kind}"><i></i><span class="vt">${esc(ist(ev.t).slice(6))}</span><span>${esc(nice(ev))}${again(ev)}</span></li>`
    // Traffic source pill for each person: the ?ref= tag (eventverse, designcommunity...) or a clean name for the referrer domain
    const SRC = [
      [/linkedin|lnkd\.in/, 'LinkedIn', '#7fb3ff'], [/instagram/, 'Instagram', '#ff7ac6'], [/threads/, 'Threads', '#d9d9d9'],
      [/facebook|^fb$/, 'Facebook', '#6b9bff'], [/android\.gm|gmail|mail/, 'Gmail', '#ff9f6b'], [/google/, 'Google', '#ffd166'],
      [/reddit/, 'Reddit', '#ff8a5c'], [/whatsapp/, 'WhatsApp', '#5fe08a'], [/behance/, 'Behance', '#7fa6ff'], [/dribbble/, 'Dribbble', '#ff86b5'],
      [/^direct$/, 'Direct', ''],
    ]
    const srcOf = (pp) => {
      const v = pp.list.filter((x) => x.kind === 'visit').pop() // oldest visit in the log = how they first came in
      if (!v) return ''
      const raw = (v.what.match(/^visit via (.+?) \(/) || [])[1] || 'direct'
      const [, label = raw, color = 'var(--acc)'] = SRC.find(([re]) => re.test(raw)) || []
      return `<span class="src${label === 'Direct' ? ' src--d' : ''}"${color ? ` style="--c:${color}"` : ''} title="Source: ${esc(raw)}">${esc(label)}</span>`
    }
    const personCards = [...people.values()].slice(0, 40).map((pp) => {
      const clicks = pp.list.filter((x) => x.kind === 'click').length
      const visits = pp.list.length - clicks
      const chrono = [...pp.list].reverse()
      const sum = [visits ? `${visits} visit${visits > 1 ? 's' : ''}` : '', clicks ? `${clicks} click${clicks > 1 ? 's' : ''}` : 'no clicks'].filter(Boolean).join(' · ')
      return `<li class="vg${clicks ? ' vg--act' : ''}"><div class="vg__h"><span class="f__t">${esc(ist(pp.last))}</span><span class="f__p">${esc(pp.place)}</span><span class="vg__id">ID ${esc(pp.id)}</span>${srcOf(pp)}<span class="vg__n">${sum}</span></div><ol class="vg__l">${chrono.map(step).join('')}</ol></li>`
    }).join('')
    const strayRows = strays.slice(0, 15).map((ev) => `<li class="click"><i></i><span class="f__t">${esc(ist(ev.t))}</span><span class="f__p">${esc(ev.place)}</span><span class="f__w">${esc(nice(ev))} · ID not saved</span></li>`).join('')
    const feed = (personCards + strayRows) || '<li class="empty">No activity yet</li>'

    // Daily report for one chosen day (?date=YYYY-MM-DD): a card per metric, with the cities behind each number
    const CORE = [['resume download', 'Resume downloads'], ['whatsapp', 'WhatsApp (contact links)'], ['floating whatsapp', 'WhatsApp (floating button)'], ['sticky whatsapp', 'WhatsApp (mobile sticky bar)'], ['cta strip: whatsapp', 'CTA strip: WhatsApp'], ['cta strip: send a brief', 'CTA strip: Send a brief'], ['brief sent', 'Contact form sent'], ['linkedin', 'LinkedIn'], ['email', 'Email'], ["let's talk", "Let's talk"]]
    const clickCity = {}, projects = [], projCta = []
    pairs(selCd).forEach(([k, n]) => {
      const [nm, ...pl] = k.split('|'), place = pl.join('|')
      if (nm.startsWith('project: ')) projects.push([`${nm.slice(9)} · ${place}`, n])
      else if (nm.startsWith('project cta: ')) projCta.push([`${nm.slice(13)} · ${place}`, n])
      else (clickCity[nm] ||= []).push([place, n])
    })
    const cm = Object.fromEntries(pairs(selClicks))
    const sum = (l) => (l || []).reduce((a, [, n]) => a + n, 0)
    const dcard = (label, total, list, hot = true) => `<div class="kpi dk${hot ? ' hot' : ''}${total ? '' : ' dk--zero'}"><span>${esc(label)}</span><b>${num(total)}</b>${list.length ? `<ul class="dk__l">${list.slice(0, 6).map(([c, n]) => `<li><span>${esc(c)}</span><em>${num(n)}</em></li>`).join('')}</ul>` : `<small>${total ? 'city not recorded' : 'none'}</small>`}</div>`
    const extra = Object.keys(clickCity).filter((k) => !CORE.some(([c]) => c === k)).map((k) => [k, k.charAt(0).toUpperCase() + k.slice(1)])
    const hours = Object.fromEntries(pairs(selHd).map(([h, n]) => [Number(h), n]))
    const hmax = Math.max(1, ...Object.values(hours))
    const hourCard = Object.keys(hours).length ? `<div class="kpi dk dk--wide"><span>Visitors by hour (IST) · busiest: ${Object.entries(hours).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h]) => `${h}:00`).join(', ')}</span><div class="hours">${Array.from({ length: 24 }, (_, h) => `<i title="${h}:00 · ${hours[h] || 0} visitors" style="--h:${((hours[h] || 0) / hmax) * 100}%"></i>`).join('')}</div><div class="hours__l"><span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span></div></div>` : ''
    const selVisitsN = Number(selVisits) || 0
    const addDay = (d, n) => new Date(new Date(d + 'T00:00:00Z').getTime() + n * 86400000).toISOString().slice(0, 10)
    // Returning visitors: first day each ID was seen (falls back to the oldest event we still have); the day links to that day's report
    const lastOf = strMap(vLast)
    const oldestEv = {}
    evs.forEach((ev) => { if (ev.kind === 'visit' && ev.id) oldestEv[ev.id] = new Date(Number(ev.t) + 19800000).toISOString().slice(0, 10) })
    const dayLink = (d) => (d ? `<a class="dlink" href="${href(d)}#daily">${esc(short(d))}</a>` : '<span class="mute">before tracking</span>')
    const repeatList = repeaters.slice(0, 15).map(([id, n]) => {
      const first = firstOf[id] || oldestEv[id] || ''
      const last = lastOf[id] || ''
      return `<li class="click rv"><i></i><span class="f__t">ID ${esc(id)}</span><span class="f__p">${esc(cityOf[id] || '')}</span><span class="f__w"><b>${num(n)}</b> days · first came ${dayLink(first)}${last && last !== first ? ` · last ${dayLink(last)}` : ''}</span></li>`
    }).join('') || '<li class="empty">No one has come back yet</li>'
    const selLabel = new Date(sel + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    const daily = `<div class="dpick"><a class="dbtn" href="${href(addDay(sel, -1))}" aria-label="Previous day">‹</a>
<form method="get" class="dform"><input type="hidden" name="key" value="${esc(key)}"><input type="date" name="date" value="${sel}" max="${today0}" onchange="this.form.submit()"><noscript><button>Go</button></noscript></form>
<a class="dbtn${sel >= today0 ? ' is-off' : ''}" href="${sel >= today0 ? '#' : href(addDay(sel, 1))}" aria-label="Next day">›</a>
<a class="dbtn dbtn--t" href="${href(today0)}">Today</a><span class="dpick__l">${selLabel}</span></div>
<div class="grid dcards">${dcard('Visitors', selVisitsN, pairs(selVd))}${[...CORE, ...extra].map(([k, label]) => dcard(label, cm[k] || sum(clickCity[k]), clickCity[k] || [])).join('')}${dcard('Projects opened', sum(projects), projects)}${dcard('Project WhatsApp CTA', sum(projCta), projCta)}${hourCard}</div>`

    // ---------- Conversion rate: unique visitors who clicked WhatsApp / Email / Let's talk / Resume (or sent a brief) ----------
    const convIds = new Set(Object.keys(strMap(convVisRaw)))
    evs.forEach((ev) => { if (ev.kind === 'click' && ev.id && isConversion(ev.what.replace(/^clicked /, '').replace(/ · ID \w+$/, ''))) convIds.add(ev.id) }) // older clicks still in the activity log
    const uniq = vis.length
    const convRate = uniq ? (convIds.size / uniq) * 100 : 0
    const pct = (a, b) => (b ? `${(Math.round((a / b) * 1000) / 10).toLocaleString('en-IN')}%` : '–')

    // ---------- Time on page ----------
    const tN = Number(timeN) || 0
    const tAvg = tN ? Math.round((Number(timeSum) || 0) / tN) : 0
    const mmss = (sec) => (sec >= 60 ? `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, '0')}s` : `${sec}s`)
    const tb = Object.fromEntries(pairs(timeBucketsRaw))
    const tbTotal = TIME_BUCKETS.reduce((a, [, l]) => a + Math.max(0, tb[l] || 0), 0)
    const tbMax = Math.max(1, ...TIME_BUCKETS.map(([, l]) => tb[l] || 0))
    const timeDist = TIME_BUCKETS.map(([, l]) => { const n = Math.max(0, tb[l] || 0); return `<li><span class="hb__k">${l}</span><span class="hb__v">${num(n)}<em>${tbTotal ? Math.round((n / tbTotal) * 100) : 0}%</em></span><i style="--w:${Math.max(3, (n / tbMax) * 100)}%"></i></li>` }).join('')

    // ---------- Scroll drop-off between sections (new page order, counted from 20 Nov) ----------
    const v2 = Object.fromEntries(pairs(secV2Raw))
    const base = v2.top || Math.max(0, ...Object.values(v2), 0)
    const dropRows = SECTION_ORDER.map(([id, label], i) => {
      const n = v2[id] || 0
      const prev = i ? v2[SECTION_ORDER[i - 1][0]] || 0 : 0
      const drop = i && prev ? Math.round(((prev - n) / prev) * 100) : null
      return `<tr><td>${esc(label)}</td><td>${num(n)}</td><td>${base ? Math.round((n / base) * 100) : 0}%</td><td class="${drop >= 30 ? 'bad' : ''}">${drop === null ? '–' : drop === 0 ? '0%' : `${drop > 0 ? '−' : '+'}${Math.abs(drop)}%`}</td><td class="gb"><i style="--w:${base ? Math.min(100, (n / base) * 100) : 0}%"></i></td></tr>`
    }).join('')
    const worst = SECTION_ORDER.slice(1).map(([id, label], i) => { const prev = v2[SECTION_ORDER[i][0]] || 0; return { label: `${SECTION_ORDER[i][1]} → ${label}`, d: prev ? (prev - (v2[id] || 0)) / prev : 0 } }).sort((a, b) => b.d - a.d)[0]

    // ---------- Traffic source (?ref=): visits, clicks, converted visitors ----------
    const refVisits = Object.fromEntries(pairs(vref))
    const refClicks = {}, refConvClicks = {}
    pairs(refClicksRaw).forEach(([k, n]) => { const [r, ...nm] = k.split('|'); refClicks[r] = (refClicks[r] || 0) + n; if (isConversion(nm.join('|'))) refConvClicks[r] = (refConvClicks[r] || 0) + n })
    const refConv = Object.fromEntries(pairs(convRefRaw))
    const refRows = [...new Set([...Object.keys(refVisits), ...Object.keys(refClicks)])]
      .sort((a, b) => (refVisits[b] || 0) - (refVisits[a] || 0) || (refClicks[b] || 0) - (refClicks[a] || 0))
      .slice(0, 15)
      .map((r) => `<tr><td>${esc(r)}</td><td>${num(refVisits[r])}</td><td>${num(refClicks[r])}</td><td>${num(refConvClicks[r])}</td><td>${num(refConv[r])}</td><td>${pct(refConv[r] || 0, refVisits[r] || 0)}</td></tr>`).join('')

    // ---------- CTA performance ----------
    const ctaList = [
      ['CTA strip: WhatsApp', clickMap['cta strip: whatsapp']], ['CTA strip: Send a brief', clickMap['cta strip: send a brief']],
      ['Mobile sticky bar', clickMap['sticky whatsapp']], ['Floating button (desktop)', clickMap['floating whatsapp']],
      ['Contact / header WhatsApp links', clickMap.whatsapp], ['Contact form sent', clickMap['brief sent']],
    ].map(([k, v]) => [k, v || 0])
    const projCtaAll = pairs(clicks).filter(([k]) => k.startsWith('project cta: ')).map(([k, n]) => [k.slice(13), n])

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
.grid{display:grid;gap:12px}.kpis{grid-template-columns:repeat(7,1fr);margin-bottom:12px}.kpis4{grid-template-columns:repeat(4,1fr);margin-bottom:12px}
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
.feed li i{width:8px;height:8px;border-radius:50%;background:var(--blue)}.feed li.click i{background:var(--acc)}.f__t,.f__p{color:var(--mute);font-size:13px}.again{color:var(--acc);font-weight:600;margin-left:6px}.dlink{color:var(--acc);font-weight:600;text-decoration:underline;text-underline-offset:3px}.dlink:hover{color:#fff}.rv .f__w{display:block}.mute{color:var(--mute)}.vg{display:block!important;padding:12px 0!important}.vg__h{display:flex;flex-wrap:wrap;gap:4px 14px;align-items:baseline}.vg__h .f__t{min-width:92px}.vg__id{font-size:13px;color:var(--text)}.src{--c:var(--acc);align-self:center;font-size:11px;font-weight:600;letter-spacing:.02em;line-height:1;padding:4px 9px;border-radius:999px;color:var(--c);border:1px solid color-mix(in srgb,var(--c) 45%,transparent);background:color-mix(in srgb,var(--c) 12%,transparent)}.src--d{--c:var(--mute)}.vg__n{margin-left:auto;font-size:12px;color:var(--mute)}.vg--act .vg__n{color:var(--acc);font-weight:600}.vg__l{list-style:none;margin:8px 0 0 6px;padding:0 0 0 14px;border-left:2px solid var(--line);display:grid;gap:5px}.vg__l li{display:flex;gap:10px;align-items:baseline;padding:0;border:0;font-size:14px;grid-template-columns:none}.vg__l li i{width:7px;height:7px;flex:none;align-self:center;border-radius:50%;background:var(--blue)}.vg__l li.click i{background:var(--acc)}.vg__l .vt{color:var(--mute);font-size:12px;min-width:38px}
.tblw{overflow-x:auto}.gt{width:100%;border-collapse:collapse;font-size:13px}.gt th{color:var(--mute);font-weight:500;text-align:right;padding:6px 10px;white-space:nowrap}.gt th:first-child,.gt td:first-child{text-align:left}.gt td{text-align:right;padding:9px 10px;border-top:1px solid var(--line);font-weight:600}.gt td:first-child{font-weight:500}.gt .gb{width:30%;min-width:80px;padding:0 10px}.gt .gb i{display:block;height:6px;width:var(--w);border-radius:4px;background:var(--acc)}.gt td.bad{color:var(--down)}
.dpick{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:14px}.dform{margin:0}
.dpick input[type=date]{background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:8px 10px;font:inherit;color-scheme:dark}
.dbtn{display:inline-grid;place-items:center;min-width:36px;height:36px;padding:0 12px;border:1px solid var(--line);border-radius:10px;color:var(--text);text-decoration:none;background:var(--bg)}.dbtn:hover{border-color:var(--acc)}.dbtn.is-off{opacity:.35;pointer-events:none}.dbtn--t{color:var(--acc)}
.dpick__l{color:var(--mute);margin-left:6px}
.dcards{grid-template-columns:repeat(auto-fill,minmax(13rem,1fr))}.dk{background:var(--bg)}.dk--zero b{color:var(--mute)!important}.dk--wide{grid-column:1/-1}
.dk__l{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:minmax(0,1fr);gap:5px;min-width:0}.dk{min-width:0;overflow:hidden}.dk__l li{display:flex;justify-content:space-between;gap:8px;font-size:13px}.dk__l li{align-items:baseline}.dk__l li span{display:block;flex:1;min-width:0;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dk__l em{flex:0 0 auto;min-width:1.6em;text-align:right;margin:0;color:var(--acc);font-weight:600;font-style:normal}.dcards>*{min-width:0}
.hours{display:flex;align-items:flex-end;gap:3px;height:64px;margin-top:10px}.hours i{flex:1;height:max(var(--h),4%);border-radius:3px;background:var(--acc);opacity:.85}.hours__l{display:flex;justify-content:space-between;color:var(--mute);font-size:11px;margin-top:4px}
.empty,.feed li.empty{display:block;color:var(--mute);margin:0}
@media(max-width:980px){.kpis{grid-template-columns:repeat(4,1fr)}.row,.row3,.row2{grid-template-columns:1fr}}
@media(max-width:560px){.kpis,.kpis4{grid-template-columns:repeat(2,1fr)}.feed li{grid-template-columns:10px 1fr;}.f__p,.f__w{grid-column:2}.kpi b{font-size:28px}}
</style>
<div class="wrap">
<header><div><h1>Portfolio <span>dashboard</span></h1><div class="sub">kunjan029.vercel.app · times in IST · one count per visitor per day · refreshes every 2 min · add <code>?me=1</code> to the site URL once to hide your own visits</div></div><div class="tag">Live · ${new Date(Date.now() + 19800000).toISOString().slice(0, 16).replace('T', ' ')} IST</div></header>

<div class="grid kpis">
${kpi('Visitors · all time', num(total), '')}
${kpi('Today', num(today), `${delta(today, yest)} vs yesterday`)}
${kpi('Last 7 days', num(week), `${delta(week, prevWeek)} vs previous 7`)}
${kpi('Clicks today', num(clicksToday), 'all tracked buttons')}
<div class="kpi hot"><span>Returning visitors</span><b>${num(repeaters.length)}</b><small>of ${num(vis.length)} unique, came on 2+ days</small></div>
<div class="kpi hot"><span>Resume downloads</span><b>${num(resume)}</b><small>all time</small></div>
<div class="kpi hot"><span>Reached out</span><b>${num(contact)}</b><small>WhatsApp, email, let's talk, resume, brief clicks</small></div>
</div>
<div class="grid kpis4">
<div class="kpi"><span>WhatsApp</span><b>${num(waAll)}</b><small>all WhatsApp buttons, all time</small></div>
<div class="kpi"><span>Email</span><b>${num(clickMap.email || 0)}</b><small>clicks · tracked correctly from 20 Nov</small></div>
<div class="kpi"><span>LinkedIn</span><b>${num(clickMap.linkedin || 0)}</b><small>clicks, all time</small></div>
<div class="kpi"><span>Let's talk</span><b>${num(clickMap["let's talk"] || 0)}</b><small>clicks, all time</small></div>
</div>

<div class="grid kpis4">
<div class="kpi hot"><span>Conversion rate</span><b>${convRate.toFixed(1)}%</b><small>${num(convIds.size)} of ${num(uniq)} unique visitors clicked WhatsApp, Email, Let's talk, Resume or sent a brief</small></div>
<div class="kpi"><span>Avg. time on page</span><b>${tN ? mmss(tAvg) : '–'}</b><small>${num(tN)} visitors timed (visible tab only), from 20 Nov</small></div>
<div class="kpi"><span>Biggest scroll drop</span><b>${worst && worst.d > 0 ? `${Math.round(worst.d * 100)}%` : '–'}</b><small>${worst && worst.d > 0 ? esc(worst.label) : 'needs a few visits on the new layout'}</small></div>
<div class="kpi"><span>Reached out per 100 visits</span><b>${total ? Math.round((contact / total) * 100) : 0}</b><small>all conversion clicks ÷ all visits</small></div>
</div>

<div class="grid row3">
<section class="card"><h2>Time on page <small>avg ${tN ? mmss(tAvg) : '–'}</small></h2>${tN ? `<ul class="hb">${timeDist}</ul>` : '<p class="empty">No timed visits yet (starts with the 20 Nov update)</p>'}</section>
<section class="card"><h2>CTA buttons <small>clicks, all time</small></h2>${hbars(ctaList.filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]), { n: 8 }).replace('No data yet', 'No CTA clicks yet')}</section>
<section class="card"><h2>Project WhatsApp CTA <small>per project</small></h2>${hbars(projCtaAll, { n: 8 }).replace('No data yet', 'No project CTA clicks yet')}</section>
</div>

<section class="card" style="margin-bottom:12px"><h2>Scroll drop-off <small>new page order, counted from 20 Nov · red = 30%+ lost at that step</small></h2>${base ? `<div class="tblw"><table class="gt"><thead><tr><th>Section</th><th>Reached</th><th>% of page loads</th><th>Drop from previous</th><th></th></tr></thead><tbody>${dropRows}</tbody></table></div>` : '<p class="empty">No data on the new layout yet</p>'}</section>

<section class="card" style="margin-bottom:12px"><h2>By traffic source <small>use links like kunjan029.vercel.app/?ref=linkedin · clicks by source counted from 20 Nov</small></h2>${refRows ? `<div class="tblw"><table class="gt"><thead><tr><th>Source</th><th>Visits</th><th>Clicks</th><th>Reached-out clicks</th><th>Converted visitors</th><th>Conversion</th></tr></thead><tbody>${refRows}</tbody></table></div>` : '<p class="empty">No data yet</p>'}</section>

<div class="grid row">
<section class="card"><h2>Visitors · last ${DAYS} days <small>${num(series.reduce((a, s) => a + s.c, 0))} clicks in this period</small></h2><div class="chart">${chart}</div></section>
<section class="card"><h2>Where they came from</h2>${hbars(pairs(vref), { n: 7, total })}</section>
</div>

<div class="grid row3">
<section class="card"><h2>What they clicked <small>all time</small></h2>${hbars(pairs(clicks), { n: 9 })}</section>
<section class="card"><h2>How far they scrolled <small>all time, old + new layout</small></h2><ul class="fn">${funnel}</ul></section>
<section class="card"><h2>Device</h2><div class="dev"><div class="donut"></div><ul>${legend || '<li class="empty">No data yet</li>'}</ul></div></section>
</div>

<div class="grid row2">
<section class="card"><h2>Countries</h2>${hbars(pairs(vc), { n: 8, total, fmt: (k) => COUNTRY[k] || k })}</section>
<section class="card"><h2>Top cities</h2>${hbars(pairs(vcity), { n: 8, total })}</section>
</div>

<section class="card"><h2>Returning visitors <small>same network on different days, by anonymous ID</small></h2><ul class="feed">${repeatList}</ul></section>

<section class="card" id="daily"><h2>Daily report · by city <small>pick a day. City and hour data exists from 4 Nov; earlier days show totals only</small></h2>${daily}</section>

<section class="card"><h2>Recent activity <small><span style="color:var(--blue)">●</span> visit &nbsp; <span style="color:var(--acc)">●</span> click</small></h2><ul class="feed">${feed}</ul></section>
</div>`)
  } catch {
    return res.status(500).send('Failed to load stats.')
  }
}
