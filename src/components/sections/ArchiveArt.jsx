// Drawings for the archive: book cover motifs and placeholder artwork. All strokes use currentColor.
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }

const rays = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2
  return [150 + Math.cos(a) * 50, 170 + Math.sin(a) * 50, 150 + Math.cos(a) * (i % 2 ? 92 : 122), 170 + Math.sin(a) * (i % 2 ? 92 : 122)]
})

// Cover motifs, 300 x 400
export const COVERS = {
  // Wedding albums: a framed page with two interlocked rings
  album: (
    <g {...S}>
      <rect x="34" y="40" width="232" height="320" rx="4" opacity="0.5" />
      <rect x="46" y="52" width="208" height="296" rx="2" opacity="0.85" />
      <circle cx="128" cy="170" r="46" strokeWidth="4" />
      <circle cx="172" cy="170" r="46" strokeWidth="4" />
      <path d="M150 112v-14M150 98l-8 8M150 98l8 8" opacity="0.7" />
      <path d="M70 80h30M200 80h30M70 320h30M200 320h30" opacity="0.6" />
    </g>
  ),
  // Learning: type specimen with guide lines
  type: (
    <g>
      <g {...S} strokeWidth="1.5" opacity="0.55">
        <path d="M30 120h240M30 170h240M30 240h240M30 300h240" />
        <path d="M70 90v250" strokeDasharray="4 6" />
      </g>
      <text x="62" y="240" fontSize="176" fontWeight="700" fill="currentColor" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.06em' }}>Aa</text>
      <circle cx="70" cy="240" r="6" fill="currentColor" />
      <g {...S} strokeWidth="2" opacity="0.8"><path d="M232 78l24 24M256 78l-24 24" /></g>
    </g>
  ),
  // Evolution: a growing grid of posts
  grid: (
    <g {...S}>
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => (
        <rect key={`${r}${c}`} x={46 + c * 74} y={60 + r * 74} width="62" height="62" rx="8" fill={r * 3 + c === 4 ? 'currentColor' : 'none'} opacity={r * 3 + c === 4 ? 1 : 0.35 + (r + c) * 0.12} />
      )))}
      <path d="M46 318c40-6 70-30 100-24s60 4 108-52" strokeWidth="4" />
      <path d="M232 238l22 4-6 22" strokeWidth="4" />
    </g>
  ),
  // Present: a bold burst
  burst: (
    <g {...S}>
      {rays.map((r, i) => <path key={i} d={`M${r[0]} ${r[1]}L${r[2]} ${r[3]}`} strokeWidth={i % 2 ? 3 : 5} />)}
      <circle cx="150" cy="170" r="34" fill="currentColor" stroke="none" />
      <path d="M150 292v36M132 310h36" opacity="0.7" />
    </g>
  ),
}

// Placeholder artwork for the visual-example slots, 200 x 250
export const ART = {
  album: (
    <g {...S}>
      <rect x="20" y="60" width="160" height="130" rx="4" /><path d="M100 60v130" />
      <circle cx="62" cy="118" r="18" /><circle cx="78" cy="118" r="18" opacity="0.6" />
      <path d="M122 100h40M122 120h28M122 140h34" opacity="0.6" />
    </g>
  ),
  banner: (
    <g {...S}>
      <rect x="14" y="88" width="172" height="74" rx="4" /><path d="M32 112h70M32 132h46" /><circle cx="150" cy="125" r="18" />
      <path d="M26 88v-14M174 88v-14" opacity="0.6" />
    </g>
  ),
  composition: (
    <g {...S}>
      <rect x="22" y="40" width="156" height="170" rx="4" />
      <path d="M74 40v170M126 40v170M22 97h156M22 153h156" strokeWidth="1.5" opacity="0.6" />
      <circle cx="126" cy="97" r="16" fill="currentColor" stroke="none" />
    </g>
  ),
  type: (
    <g>
      <g {...S} strokeWidth="1.5" opacity="0.5"><path d="M20 80h160M20 170h160" /></g>
      <text x="34" y="170" fontSize="104" fontWeight="700" fill="currentColor" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.06em' }}>Aa</text>
    </g>
  ),
  manipulation: (
    <g {...S}>
      <rect x="40" y="56" width="92" height="92" rx="6" /><rect x="68" y="98" width="92" height="92" rx="6" fill="currentColor" opacity="0.28" />
      <path d="M150 62l10 10M160 62l-10 10" />
    </g>
  ),
  brush: (
    <g {...S} strokeWidth="9" opacity="0.9">
      <path d="M26 170c30-80 60 30 90-30s46-54 60-30" />
      <path d="M26 200c40-30 70 20 148-14" strokeWidth="4" opacity="0.6" />
    </g>
  ),
  social: (
    <g {...S}>
      <rect x="52" y="30" width="96" height="190" rx="14" /><rect x="62" y="68" width="76" height="76" rx="6" /><circle cx="70" cy="52" r="6" />
      <path d="M62 160h50M62 176h30" opacity="0.6" />
    </g>
  ),
  poster: (
    <g {...S}>
      <rect x="34" y="34" width="132" height="182" rx="4" /><path d="M54 150h72M54 170h50" />
      <path d="M100 62l8 18 20 2-15 13 5 20-18-10-18 10 5-20-15-13 20-2z" fill="currentColor" stroke="none" opacity="0.9" />
    </g>
  ),
  product: (
    <g {...S}>
      <path d="M60 110l40-20 40 20v54l-40 20-40-20z" /><path d="M60 110l40 20 40-20M100 130v54" />
      <ellipse cx="100" cy="206" rx="52" ry="10" opacity="0.5" />
    </g>
  ),
  photo: (
    <g {...S}>
      <rect x="24" y="56" width="152" height="130" rx="6" /><circle cx="64" cy="94" r="12" fill="currentColor" stroke="none" />
      <path d="M24 164l44-40 34 30 24-18 50 34" />
    </g>
  ),
  burst: (
    <g {...S}>
      {rays.map((r, i) => <path key={i} d={`M${(r[0] - 150) * 0.55 + 100} ${(r[1] - 170) * 0.55 + 125}L${(r[2] - 150) * 0.55 + 100} ${(r[3] - 170) * 0.55 + 125}`} strokeWidth={i % 2 ? 2.5 : 4} />)}
      <circle cx="100" cy="125" r="18" fill="currentColor" stroke="none" />
    </g>
  ),
}

export function CoverArt({ kind }) {
  return <svg className="cover__art" viewBox="0 0 300 400" aria-hidden="true" preserveAspectRatio="xMidYMid meet">{COVERS[kind]}</svg>
}

export function PlaceholderArt({ kind }) {
  return <svg className="ph__art" viewBox="0 0 200 250" aria-hidden="true" preserveAspectRatio="xMidYMid meet">{ART[kind] || ART.burst}</svg>
}
