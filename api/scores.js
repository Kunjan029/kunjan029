import { createHash } from 'node:crypto'
import { configured, redis } from './_redis.js'

// GET  /api/scores?game=tetris            -> { top: [{ name, score }], players }
// POST /api/scores { game, name, score }   -> saves the visitor's best score for that game, returns the same as GET
// One entry per visitor per game (their best). Only the chosen display name and the score are stored;
// the visitor key is a salted hash of the IP and is never shown. Scores are capped per game and posts are rate limited.
const MAX = { tetris: 999999, snake: 2560, racing: 5000, tank: 200000, bricks: 200000 }
const BAD = /fuck|shit|bitch|asshole|bastard|dick|cock|pussy|porn|nigg|slut|whore|rape|chut|gand|lund|madarchod|behenchod|bhosd|randi|harami|kutta|saala|sala/i
const BAD_WORD = /^(mc|bc|bsdk|mkc|bkl|sex|gay|nazi)$/i

const clean = (s) => String(s || '').normalize('NFKC').replace(/[^\p{L}\p{N} ._-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 14)
const badName = (n) => { const flat = n.toLowerCase().replace(/[01@$5!3]/g, (c) => ({ 0: 'o', 1: 'i', '@': 'a', $: 's', 5: 's', '!': 'i', 3: 'e' }[c])).replace(/[ ._-]/g, ''); return BAD.test(flat) || n.split(/[ ._-]+/).some((w) => BAD_WORD.test(w)) }

async function board(game) {
  const [top, count] = await redis([['ZREVRANGE', `scores:${game}`, 0, 4, 'WITHSCORES'], ['ZCARD', `scores:${game}`]])
  const flat = top.result || []
  const ids = [], scores = []
  for (let i = 0; i < flat.length; i += 2) { ids.push(flat[i]); scores.push(Number(flat[i + 1])) }
  let names = []
  if (ids.length) names = (await redis([['HMGET', `scores:names:${game}`, ...ids]]))[0].result || []
  return { top: ids.map((_, i) => ({ name: names[i] || 'Player', score: scores[i] })), players: Number(count.result) || 0 }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!configured()) return res.status(503).json({ error: 'not configured' })
  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
      const game = String(body.game || '')
      if (!MAX[game]) return res.status(400).json({ error: 'bad game' })
      const score = Math.floor(Number(body.score))
      const name = clean(body.name)
      if (!Number.isFinite(score) || score < 1 || score > MAX[game]) return res.status(400).json({ error: 'bad score' })
      if (name.length < 2) return res.status(400).json({ error: 'name too short' })
      if (badName(name)) return res.status(400).json({ error: 'please pick a different name' })
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || ''
      const vid = createHash('sha256').update(`${ip}|${process.env.STATS_KEY || 'kunjan'}`).digest('hex').slice(0, 16)
      const [rl] = await redis([['SET', `rl:${vid}:${game}`, '1', 'NX', 'EX', '10']])
      if (rl.result !== 'OK') return res.status(429).json({ error: 'slow down' })
      const [changed] = await redis([['ZADD', `scores:${game}`, 'GT', 'CH', score, vid]])
      if (Number(changed.result) > 0 || !(await redis([['HEXISTS', `scores:names:${game}`, vid]]))[0].result) await redis([['HSET', `scores:names:${game}`, vid, name]])
    } else if (req.method !== 'GET') return res.status(405).end()
    const game = String((req.method === 'POST' ? (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}).game : req.query?.game) || '')
    if (!MAX[game]) return res.status(400).json({ error: 'bad game' })
    return res.status(200).json(await board(game))
  } catch {
    return res.status(500).json({ error: 'failed' })
  }
}
