import { createHash } from 'node:crypto'
import { configured, redis } from './_redis.js'

// GET  /api/play -> { count }
// POST /api/play -> counts one play (once per visitor per day), then returns { count }.
// Only the country and city (from Vercel's edge headers) are stored, as aggregate counts.
// The IP address is never stored: it is only hashed (with the day and a secret) to stop repeat counting for 24 hours.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!configured()) return res.status(503).json({ error: 'counter not configured' })
  try {
    if (req.method === 'POST') {
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || ''
      const day = new Date().toISOString().slice(0, 10)
      const istDay = new Date(Date.now() + 19800000).toISOString().slice(0, 10)
      const id = createHash('sha256').update(`${ip}|${day}|${process.env.STATS_KEY || 'kunjan'}`).digest('hex').slice(0, 32)
      const [seen] = await redis([['SET', `seen:${id}`, '1', 'NX', 'EX', '86400']])
      if (seen.result === 'OK') {
        const country = String(req.headers['x-vercel-ip-country'] || '??').slice(0, 2).toUpperCase()
        const city = decodeURIComponent(String(req.headers['x-vercel-ip-city'] || 'Unknown')).slice(0, 60)
        await redis([
          ['INCR', 'plays:total'],
          ['HINCRBY', 'plays:country', country, 1],
          ['HINCRBY', 'plays:city', `${city}, ${country}`, 1],
          ['HINCRBY', 'plays:days', istDay, 1],
          ['HINCRBY', `pd:${istDay}`, `${city}, ${country}`, 1],
          ['EXPIRE', `pd:${istDay}`, 34000000],
        ])
      }
    }
    const [total] = await redis([['GET', 'plays:total']])
    return res.status(200).json({ count: Number(total.result) || 0 })
  } catch {
    return res.status(500).json({ error: 'failed' })
  }
}
