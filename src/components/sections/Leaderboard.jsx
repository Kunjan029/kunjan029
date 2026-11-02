import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import Button from '../ui/Button.jsx'
import { fetchPlayCount, fetchScores, submitScore } from '../../utils/plays.js'
import { PLAYS_MIN_TO_SHOW } from '../../data/analytics.js'
import './Leaderboard.css'

const NAMES = { tetris: 'Tetris', snake: 'Snake', racing: 'Racing', tank: 'Tank Battle', bricks: 'Brick Breaker' }
const KEY = 'kunjan-portfolio:player-name'
const readName = () => { try { return window.localStorage.getItem(KEY) || '' } catch { return '' } }

export default function Leaderboard({ game }) {
  const [data, setData] = useState(null) // { top, players } or null when unavailable
  const [plays, setPlays] = useState(null)
  const [pending, setPending] = useState(null) // score waiting for a name
  const [name, setName] = useState(readName)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { fetchScores(game).then(setData); fetchPlayCount().then(setPlays) }, [game])

  useEffect(() => {
    const on = (e) => {
      if (e.detail?.game !== game || !(e.detail.score > 0)) return
      setMsg('')
      setPending(e.detail.score)
      fetchScores(game).then((d) => d && setData(d))
    }
    window.addEventListener('kp-gameover', on)
    return () => window.removeEventListener('kp-gameover', on)
  }, [game])

  const top = data?.top || []
  const qualifies = pending !== null && (top.length < 5 || pending > top[top.length - 1].score)

  const save = async (e) => {
    e.preventDefault()
    const n = name.trim()
    if (n.length < 2) { setMsg('Please enter at least 2 characters.'); return }
    setBusy(true); setMsg('')
    const r = await submitScore(game, n, pending)
    setBusy(false)
    if (!r.ok) { setMsg(r.error === 'bad name' ? 'Please pick a different name.' : r.error.charAt(0).toUpperCase() + r.error.slice(1)); return }
    try { window.localStorage.setItem(KEY, n) } catch { /* ignore */ }
    setData(r.data); setPending(null); setMsg('Saved. You are on the board!')
  }

  if (data === null && plays === null) return null // counter not configured (local dev)
  return (
    <section className="lb" aria-label={`${NAMES[game]} leaderboard`}>
      <div className="lb__head">
        <h3 className="lb__title"><Trophy size={18} aria-hidden="true" /> TOP 5 · {NAMES[game].toUpperCase()}</h3>
        {plays !== null && plays >= PLAYS_MIN_TO_SHOW && <p className="lb__plays"><strong>{plays.toLocaleString('en-IN')}</strong> {plays === 1 ? 'person has' : 'people have'} played so far</p>}
      </div>
      {top.length ? (
        <ol className="lb__list">
          {top.map((r, i) => (
            <li key={i} className={i === 0 ? 'is-first' : ''}><span className="lb__rank">{i + 1}</span><span className="lb__name">{r.name}</span><span className="lb__score">{r.score.toLocaleString('en-IN')}</span></li>
          ))}
        </ol>
      ) : <p className="lb__empty">No scores yet. Be the first on the board!</p>}

      {pending !== null && (qualifies ? (
        <form className="lb__form" onSubmit={save}>
          <p className="lb__you">You scored <strong>{pending.toLocaleString('en-IN')}</strong>. Add your name to the board:</p>
          <div className="lb__row">
            <input className="lb__input" value={name} onChange={(e) => setName(e.target.value)} maxLength={14} placeholder="Your name" aria-label="Your name" autoComplete="nickname" />
            <Button type="submit" size="md" disabled={busy} data-cursor>{busy ? 'Saving…' : 'Save score'}</Button>
          </div>
        </form>
      ) : <p className="lb__note">You scored {pending.toLocaleString('en-IN')}. Reach {(top[top.length - 1]?.score + 1).toLocaleString('en-IN')} to make the top 5.</p>)}
      {msg && <p className="lb__msg" role="status">{msg}</p>}
    </section>
  )
}
