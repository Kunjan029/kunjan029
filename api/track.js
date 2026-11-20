import { createHash } from 'node:crypto'
import { configured, redis } from './_redis.js'
import { isConversion, TIME_BUCKETS } from './_metrics.js'

// POST /api/track  { type: 'visit' | 'click' | 'section' | 'time', name?, ref?, device?, s? }
// Stores only aggregate counts plus a short "recent activity" list (time, city, what happened).
// The IP address itself is never stored: it is only hashed (with a secret). A per-day hash counts a visitor once a day,
// and a stable hash (no day) lets the dashboard tell how many days the same visitor came back.
const NAME_OK = /^[\w &'.:+\-–]{1,60}$/
const SECTIONS = new Set(['top', 'about', 'why', 'work', 'cta', 'services', 'testimonials', 'process', 'contact'])
const DEVICES = new Set(['phone', 'tablet', 'desktop'])
const TTL = 34000000 // keep the daily city data for about 13 months
const BOT = /bot|crawl|spider|headless|lighthouse|preview|facebookexternalhit|slurp|monitor/i

const bucketOf = (s) => TIME_BUCKETS.find(([max]) => s < max)[1]

const istDay = () => new Date(Date.now() + 19800000).toISOString().slice(0, 10)
const clean = (s, n) => decodeURIComponent(String(s || '')).replace(/[^\p{L}\p{N} ,.'\-]/gu, '').slice(0, n)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).end()
  if (!configured()) return res.status(204).end()
  try {
    if (BOT.test(String(req.headers['user-agent'] || ''))) return res.status(204).end()
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const type = body.type
    const day = istDay()
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || ''
    const id = createHash('sha256').update(`${ip}|${day}|${process.env.STATS_KEY || 'kunjan'}`).digest('hex').slice(0, 32)
    const vid = createHash('sha256').update(`${ip}|${process.env.STATS_KEY || 'kunjan'}`).digest('hex').slice(0, 6)
    const country = String(req.headers['x-vercel-ip-country'] || '??').slice(0, 2).toUpperCase()
    const city = clean(req.headers['x-vercel-ip-city'] || 'Unknown', 60) || 'Unknown'
    const place = `${city}, ${country}`
    const event = (what) => ['LPUSH', 'events', `${Date.now()}|${place}|${what}`]
    const trim = ['LTRIM', 'events', 0, 199]

    if (type === 'visit') {
      const [seen] = await redis([['SET', `v:${id}`, '1', 'NX', 'EX', '90000']])
      if (seen.result !== 'OK') return res.status(204).end()
      const ref = clean(body.ref, 60).toLowerCase() || 'direct'
      const device = DEVICES.has(body.device) ? body.device : 'desktop'
      const [seenDays, , , prevRes] = await redis([['HINCRBY', 'visitors:count', vid, 1], ['HSET', 'visitors:city', vid, place], ['HSETNX', 'visitors:first', vid, day], ['HGET', 'visitors:last', vid], ['HSET', 'visitors:last', vid, day]])
      const nth = Number(seenDays.result) || 1
      await redis([
        ['INCR', 'visits:total'],
        ['HINCRBY', 'visits:days', day, 1],
        ['HINCRBY', 'visits:country', country, 1],
        ['HINCRBY', 'visits:city', place, 1],
        ['HINCRBY', `vd:${day}`, place, 1],
        ['HINCRBY', `hd:${day}`, String(new Date(Date.now() + 19800000).getUTCHours()), 1],
        ['EXPIRE', `hd:${day}`, TTL],
        ['EXPIRE', `vd:${day}`, TTL],
        ['HINCRBY', 'visits:ref', ref, 1],
        ['HINCRBY', 'visits:device', device, 1],
        event(`visit via ${ref} (${device}) · ID ${vid} · day ${nth}${nth > 1 ? ' · returning' : ''}${nth > 1 && /^\d{4}-\d{2}-\d{2}$/.test(prevRes?.result || '') ? ` · prev ${prevRes.result}` : ''}`),
        trim,
      ])
    } else if (type === 'click') {
      const name = String(body.name || '')
      if (!NAME_OK.test(name)) return res.status(204).end()
      const ref = clean(body.ref, 60).toLowerCase() || 'direct'
      const conv = isConversion(name)
      const cmds = [
        ['HINCRBY', 'clicks:total', name, 1], ['HINCRBY', `clicks:${day}`, name, 1], ['HINCRBY', `cd:${day}`, `${name}|${place}`, 1], ['EXPIRE', `cd:${day}`, TTL],
        ['HINCRBY', 'clicks:ref', `${ref}|${name}`, 1], // clicks by traffic source
        event(`clicked ${name} · ID ${vid}`), trim,
      ]
      if (conv) cmds.push(['HSETNX', 'conv:visitors', vid, day]) // each visitor counted once as "converted"
      const out = await redis(cmds)
      if (conv && Number(out[out.length - 1]?.result) === 1) await redis([['HINCRBY', 'conv:ref', ref, 1]])
    } else if (type === 'section') {
      const name = String(body.name || '')
      if (!SECTIONS.has(name)) return res.status(204).end()
      const [seen] = await redis([['SET', `s:${id}:${name}`, '1', 'NX', 'EX', '90000']])
      // sections:v2 = the reordered page (Work, CTA, Testimonials, Process...) so the drop-off funnel isn't mixed with the old layout
      if (seen.result === 'OK') await redis([['HINCRBY', 'sections:total', name, 1], ['HINCRBY', 'sections:v2', name, 1]])
    } else if (type === 'time') {
      // Visible seconds on the page; keep the highest value per visitor per day and move them between buckets
      const sec = Math.min(3600, Math.max(0, Math.round(Number(body.s) || 0)))
      if (!sec) return res.status(204).end()
      const [old] = await redis([['GET', `t:${id}`]])
      const prev = Number(old.result) || 0
      if (sec <= prev) return res.status(204).end()
      const cmds = [['SET', `t:${id}`, String(sec), 'EX', '90000'], ['INCRBY', 'time:sum', sec - prev], ['HINCRBY', 'time:buckets', bucketOf(sec), 1]]
      if (prev) cmds.push(['HINCRBY', 'time:buckets', bucketOf(prev), -1])
      else cmds.push(['INCR', 'time:n'])
      await redis(cmds)
    }
    return res.status(204).end()
  } catch {
    return res.status(204).end()
  }
}
