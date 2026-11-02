import { useState } from 'react'
import { Art, Pager } from './shared.jsx'

// Clean comparison: side by side on wide screens, a touch-friendly slider on narrow ones. No decoration.
function Slider({ pair, onOpen, index }) {
  const [pos, setPos] = useState(50)
  return (
    <div className="ba-slider" style={{ '--pos': `${pos}%` }}>
      <div className="ba-slider__stack">
        <img className="ba-slider__after" src={pair.after.src} alt={pair.after.alt} draggable={false} />
        <img className="ba-slider__before" src={pair.before.src} alt={pair.before.alt} draggable={false} />
        <span className="ba-slider__line" aria-hidden="true"><i /></span>
        <span className="ba-label ba-label--l">Original</span>
        <span className="ba-label ba-label--r">Edited</span>
        <input type="range" min="0" max="100" value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Comparison: drag between original and edited" />
      </div>
      <button type="button" className="ba-open" onClick={() => onOpen(index * 2 + 1)}>Open edited image</button>
    </div>
  )
}

export default function BeforeAfter({ project, onOpen }) {
  const pairs = project.compare
  const [i, setI] = useState(0)
  const p = pairs[i]
  return (
    <div className="ba">
      <div className="ba__pair" key={i}>
        <figure className="ba__side">
          <Art image={p.before} index={i * 2} onOpen={onOpen} eager className="ba__art" label="Open the original image in the viewer" />
          <figcaption>Original</figcaption>
        </figure>
        <figure className="ba__side">
          <Art image={p.after} index={i * 2 + 1} onOpen={onOpen} eager className="ba__art" label="Open the edited image in the viewer" />
          <figcaption>Edited</figcaption>
        </figure>
      </div>
      <Slider key={`s${i}`} pair={p} onOpen={onOpen} index={i} />
      <Pager images={pairs.map((x) => x.after)} count={pairs.length} index={i} onChange={setI} label="Comparison" />
    </div>
  )
}
