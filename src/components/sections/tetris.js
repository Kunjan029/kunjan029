// Pure Tetris rules: no DOM, no React, so it can be tested on its own.
export const COLS = 10
export const ROWS = 20

// Each piece is a square matrix; rotation is a transpose + flip.
export const SHAPES = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
}
export const KINDS = Object.keys(SHAPES)

// Distinct, readable colours that sit well next to the lime accent
export const COLORS = { I: '#5FD7FF', O: '#FFD84D', T: '#B58CFF', S: '#C6FF4D', Z: '#FF6B6B', J: '#5B8CFF', L: '#FF9F4D' }

const LINE_POINTS = [0, 100, 300, 500, 800]

export const rotateMatrix = (m, dir = 1) => {
  const n = m.length
  const out = m.map((row) => row.slice())
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (dir > 0) out[x][n - 1 - y] = m[y][x]
    else out[n - 1 - x][y] = m[y][x]
  }
  return out
}

export const dropInterval = (level) => Math.max(90, 820 - (level - 1) * 72)

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null))

// 7-bag: every seven pieces contain each shape once, so droughts can't last long
function takeFromBag(g, rand) {
  if (!g.bag.length) {
    const bag = KINDS.slice()
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[bag[i], bag[j]] = [bag[j], bag[i]]
    }
    g.bag = bag
  }
  return g.bag.pop()
}

const makePiece = (kind) => ({ kind, m: SHAPES[kind].map((r) => r.slice()), x: Math.floor((COLS - SHAPES[kind].length) / 2), y: kind === 'I' ? -1 : 0 })

export function collides(board, piece, dx = 0, dy = 0, m = piece.m) {
  for (let y = 0; y < m.length; y++) for (let x = 0; x < m.length; x++) {
    if (!m[y][x]) continue
    const bx = piece.x + x + dx, by = piece.y + y + dy
    if (bx < 0 || bx >= COLS || by >= ROWS) return true
    if (by >= 0 && board[by][bx]) return true
  }
  return false
}

export function createGame(rand = Math.random) {
  const g = { board: emptyBoard(), bag: [], piece: null, next: null, score: 0, lines: 0, level: 1, over: false, rand }
  g.next = takeFromBag(g, rand)
  spawn(g)
  return g
}

export function spawn(g) {
  g.piece = makePiece(g.next)
  g.next = takeFromBag(g, g.rand)
  if (collides(g.board, g.piece)) { g.over = true; return false }
  return true
}

export function move(g, dx) {
  if (g.over || collides(g.board, g.piece, dx, 0)) return false
  g.piece.x += dx
  return true
}

// Tries the plain rotation, then small sideways/upward kicks so pieces can turn next to walls and stacks
export function rotate(g, dir = 1) {
  if (g.over || g.piece.kind === 'O') return false
  const m = rotateMatrix(g.piece.m, dir)
  for (const [kx, ky] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1]]) {
    if (!collides(g.board, g.piece, kx, ky, m)) {
      g.piece.m = m; g.piece.x += kx; g.piece.y += ky
      return true
    }
  }
  return false
}

// One cell down. Returns true if it moved; the caller decides when to lock.
export function stepDown(g) {
  if (g.over || collides(g.board, g.piece, 0, 1)) return false
  g.piece.y += 1
  return true
}

export function softDrop(g) {
  if (!stepDown(g)) return false
  g.score += 1
  return true
}

export function ghostY(g) {
  let d = 0
  while (!collides(g.board, g.piece, 0, d + 1)) d++
  return g.piece.y + d
}

export function hardDrop(g) {
  const target = ghostY(g)
  const cells = target - g.piece.y
  g.piece.y = target
  g.score += cells * 2
  return cells
}

// Writes the piece into the board and returns the indexes of completed rows (not removed yet, so the UI can flash them)
export function lock(g) {
  const { piece } = g
  for (let y = 0; y < piece.m.length; y++) for (let x = 0; x < piece.m.length; x++) {
    if (!piece.m[y][x]) continue
    const by = piece.y + y, bx = piece.x + x
    if (by < 0) { g.over = true; continue } // locked above the top = game over
    g.board[by][bx] = piece.kind
  }
  g.piece = null
  return g.board.reduce((rows, row, i) => (row.every(Boolean) ? [...rows, i] : rows), [])
}

// Removes the rows, scores them and brings the next piece in
export function clearRows(g, rows) {
  if (rows.length) {
    g.board = g.board.filter((_, i) => !rows.includes(i))
    while (g.board.length < ROWS) g.board.unshift(Array(COLS).fill(null))
    g.score += LINE_POINTS[rows.length] * g.level
    g.lines += rows.length
    g.level = Math.floor(g.lines / 10) + 1
  }
  if (!g.over) spawn(g)
  return g
}
