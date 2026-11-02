import { useState } from 'react'
import { Pager } from './shared.jsx'

// UI/UX work: the full-length design inside a laptop-style browser frame. The page scrolls inside the frame, so nothing is cropped or resized.
export default function UiUx({ project }) {
  const [i, setI] = useState(0)
  const im = project.images[i]
  return (
    <>
      <div className="ux" key={i}>
        <div className="ux__lid" aria-hidden="true"><i /><i /><i /><span /></div>
        <div className="ux__screen" tabIndex={0} role="region" aria-label={`${project.title} design, scrollable`}>
          <img src={im.src} alt={im.alt} draggable={false} loading="eager" decoding="async" />
        </div>
        <div className="ux__base" aria-hidden="true" />
      </div>
      <Pager images={project.images} count={project.images.length} index={i} onChange={setI} label="Screen" />
    </>
  )
}
