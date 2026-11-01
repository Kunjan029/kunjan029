import { PenTool, MousePointer2 } from 'lucide-react'

// Decorative "designer's workspace": artboard, selection handles, bezier path, swatches, live cursor.
export default function HeroWorkspace() {
  return (
    <div className="ws" aria-hidden="true">
      <div className="ws__bar">
        <span className="ws__dots"><i /><i /><i /></span>
        <span className="ws__title">Untitled-1 @ 100%</span>
      </div>

      <div className="ws__canvas">
        <span className="ws__guide ws__guide--h" />
        <span className="ws__guide ws__guide--v" />

        <div className="ws__artboard">
          <span className="ws__glyph">Aa</span>
          <span className="ws__select"><i /><i /><i /><i /></span>
          <span className="ws__lines"><i /><i /><i /></span>
        </div>
        <span className="ws__sticker" />

        <div className="ws__swatches">
          <i style={{ background: 'var(--color-text)' }} />
          <i style={{ background: 'var(--color-text-muted)' }} />
          <i style={{ background: 'var(--color-card)' }} />
          <i className="is-picked" style={{ background: 'var(--color-accent)' }} />
        </div>

        <svg className="ws__vector" viewBox="0 0 100 83" preserveAspectRatio="none">
          <g className="ws__handles" stroke="var(--color-text-muted)" strokeWidth="0.35">
            <path d="M10 76L28 58M46 88L82 56M82 56L84 62M76 50L84 62" fill="none" />
            <circle cx="28" cy="58" r="1" fill="var(--color-text-muted)" stroke="none" />
            <circle cx="46" cy="88" r="1" fill="var(--color-text-muted)" stroke="none" />
            <circle cx="82" cy="56" r="1" fill="var(--color-text-muted)" stroke="none" />
          </g>
          <path
            className="ws__path"
            d="M10 76C28 58 46 88 64 72C82 56 84 62 76 50"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="0.9"
            strokeLinecap="round"
            pathLength="100"
          />
          {[[10, 76], [64, 72], [76, 50]].map(([x, y]) => (
            <rect key={x} className="ws__anchor" x={x - 1.4} y={y - 1.4} width="2.8" height="2.8" fill="var(--color-bg)" stroke="var(--color-accent)" strokeWidth="0.5" />
          ))}
        </svg>

        <span className="ws__chip"><PenTool size={16} strokeWidth={2} /></span>

        <div className="ws__cursor">
          <MousePointer2 size={20} fill="var(--color-accent)" stroke="var(--color-bg)" strokeWidth={1.5} />
          <span>Kunjan</span>
        </div>
      </div>
    </div>
  )
}
