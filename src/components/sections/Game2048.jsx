import { useRef, useState } from 'react'
import MiniShell from './MiniShell.jsx'
import useBest from './useBest.js'
import { registerPlay } from '../../utils/plays.js'

const N = 4
let uid = 1
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' }

function spawn(tiles) {
  const used = new Set(tiles.map((t) => t.r * N + t.c))
  const free = []
  for (let i = 0; i < N * N; i++) if (!used.has(i)) free.push(i)
  if (!free.length) return tiles
  const i = free[Math.floor(Math.random() * free.length)]
  return [...tiles, { id: uid++, r: Math.floor(i / N), c: i % N, v: Math.random() < 0.9 ? 2 : 4, fresh: true }]
}
const fresh = () => spawn(spawn([]))

// Slide every line toward the chosen side, merging equal neighbours once.
function slide(tiles, dir) {
  const horiz = dir === 'left' || dir === 'right'
  const rev = dir === 'right' || dir === 'down'
  let gained = 0, moved = false
  const out = []
  for (let line = 0; line < N; line++) {
    let row = tiles.filter((t) => (horiz ? t.r : t.c) === line).sort((a, b) => (horiz ? a.c - b.c : a.r - b.r))
    if (rev) row = row.reverse()
    const res = []
    for (let i = 0; i < row.length; i++) {
      const t = row[i]
      const nxt = row[i + 1]
      if (nxt && nxt.v === t.v) { res.push({ ...t, v: t.v * 2, merged: true, fresh: false }); gained += t.v * 2; i++ } else res.push({ ...t, merged: false, fresh: false })
    }
    res.forEach((t, k) => {
      const pos = rev ? N - 1 - k : k
      const nr = horiz ? line : pos, nc = horiz ? pos : line
      if (nr !== t.r || nc !== t.c) moved = true
      out.push({ ...t, r: nr, c: nc })
    })
  }
  const merges = out.some((t) => t.merged)
  return { tiles: out, gained, changed: moved || merges }
}
const canMove = (tiles) => ['up', 'down', 'left', 'right'].some((d) => slide(tiles, d).changed)

export default function Game2048() {
  const boardRef = useRef(null)
  const touchRef = useRef(null)
  const [tiles, setTiles] = useState(fresh)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState('ready') // ready | playing | won | over
  const [keepGoing, setKeepGoing] = useState(false)
  const [newBest, setNewBest] = useState(false)
  const [best, submitBest] = useBest('2048')

  const reset = () => {
    setTiles(fresh()); setScore(0); setPhase('playing'); setKeepGoing(false); setNewBest(false); registerPlay()
    boardRef.current?.focus({ preventScroll: true })
  }

  const go = (dir) => {
    if (phase === 'ready' || phase === 'over' || (phase === 'won' && !keepGoing)) return
    const r = slide(tiles, dir)
    if (!r.changed) return
    const next = spawn(r.tiles)
    const total = score + r.gained
    setTiles(next); setScore(total)
    if (!keepGoing && next.some((t) => t.v >= 2048)) { setPhase('won'); setNewBest(submitBest(total)); return }
    if (!canMove(next)) { setPhase('over'); setNewBest(submitBest(total)) }
  }

  const onKeyDown = (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
    const d = KEYMAP[k]
    if (!d) return
    e.preventDefault(); go(d)
  }
  const onPointerDown = (e) => { touchRef.current = [e.clientX, e.clientY] }
  const onPointerUp = (e) => {
    const t = touchRef.current; touchRef.current = null
    if (!t) return
    const dx = e.clientX - t[0], dy = e.clientY - t[1]
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
    go(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'))
  }

  const overlay = phase === 'ready' ? { k: '2048', t: 'Ready when you are.', s: best ? `Your best: ${best}` : 'Merge matching tiles to reach 2048.', cta: 'START GAME', onClick: reset }
    : phase === 'over' ? { k: 'NO MOVES LEFT', score, s: `${newBest ? 'NEW BEST! ' : ''}Best: ${Math.max(best, score)}`, cta: 'PLAY AGAIN', onClick: reset }
    : phase === 'won' && !keepGoing ? { k: 'YOU MADE 2048!', t: 'Nicely done.', s: `Score: ${score}`, cta: 'KEEP GOING', onClick: () => { setKeepGoing(true); setPhase('playing'); boardRef.current?.focus({ preventScroll: true }) } } : null

  return (
    <MiniShell
      name="2048" lead="Slide the tiles, merge the matching numbers and chase the 2048 tile."
      stats={[['SCORE', score], ['BEST', Math.max(best, score)]]}
      boardRef={boardRef} boardClass="mg__board--sq g2048" boardLabel="2048 board. Use the arrow keys or W A S D to slide the tiles."
      onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerUp={onPointerUp}
      overlay={overlay} onRestart={reset}
      keys={<><li><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> Slide tiles</li><li>Swipe on touch screens</li></>}
    >
      <div className="g2048__grid" aria-hidden="true">
        {Array.from({ length: N * N }, (_, i) => <span key={i} className="g2048__bg" />)}
        {tiles.map((t) => (
          <span key={t.id} className={`g2048__t v${Math.min(t.v, 2048)}${t.fresh ? ' is-new' : ''}${t.merged ? ' is-merged' : ''}`} style={{ '--r': t.r, '--c': t.c }}>
            <b>{t.v}</b>
          </span>
        ))}
      </div>
    </MiniShell>
  )
}
