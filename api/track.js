import { createHash } from 'node:crypto'
import { configured, redis } from './_redis.js'

// POST /api/track  { type: 'visit' | 'click' | 'section', name?, ref?, device? }
// Stores only aggregate counts plus a short "recent activity" list (time, city, what happened).
// The IP address itself is never stored: it is only hashed (with a secret). A per-day hash counts a visitor once a day,
// and a stable hash (no day) lets the dashboard tell how many days the same visitor came back.
const NAME_OK = /^[\w &'.:+\-–]{1,60}$/
const SECTIONS = new Set(['about', 'why', 'work', 'arcade', 'services', 'testimonials', 'contact'])
const DEVICES = new Set(['phone', 'tablet', 'desktop'])
const TTL = 34000000 // keep the daily city data for about 13 months
const BOT = /bot|crawl|spider|headless|lighthouse|preview|facebookexternalhit|slurp|monitor/i

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
      const [seenDays] = await redis([['HINCRBY', 'visitors:count', vid, 1], ['HSET', 'visitors:city', vid, place]])
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
        event(`visit via ${ref} (${device}) · ID ${vid} · day ${nth}${nth > 1 ? ' · returning' : ''}`),
        trim,
      ])
    } else if (type === 'click') {
      const name = String(body.name || '')
      if (!NAME_OK.test(name)) return res.status(204).end()
      await redis([['HINCRBY', 'clicks:total', name, 1], ['HINCRBY', `clicks:${day}`, name, 1], ['HINCRBY', `cd:${day}`, `${name}|${place}`, 1], ['EXPIRE', `cd:${day}`, TTL], event(`clicked ${name}`), trim])
    } else if (type === 'section') {
      const name = String(body.name || '')
      if (!SECTIONS.has(name)) return res.status(204).end()
      const [seen] = await redis([['SET', `s:${id}:${name}`, '1', 'NX', 'EX', '90000']])
      if (seen.result === 'OK') await redis([['HINCRBY', 'sections:total', name, 1]])
    }
    return res.status(204).end()
  } catch {
    return res.status(204).end()
  }
}
