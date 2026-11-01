import { InstagramCarousel, InstagramPost } from './Social.jsx'
import Ecommerce from './Ecommerce.jsx'
import Advertising from './Advertising.jsx'
import BeforeAfter from './BeforeAfter.jsx'
import UiUx from './UiUx.jsx'
import './presentation.css'

// A project gets a real-world presentation when it has real images. `presentation: 'viewer'` opts out.
export function hasContext(p) {
  if (!p || p.placeholder || p.presentation === 'viewer' || !p.images?.length) return false
  if (p.category === 'photo-editing') return Boolean(p.compare?.length)
  return ['social-media', 'carousel', 'e-commerce', 'advertising', 'ui-ux'].includes(p.category)
}

export default function Presentation({ project, onOpen }) {
  const c = project.category
  return (
    <div className={`px px--${c}`}>
      {project.presentation === 'instagram' && <InstagramPost project={project} onOpen={onOpen} />}
      {project.presentation !== 'instagram' && c === 'social-media' && <InstagramPost project={project} onOpen={onOpen} />}
      {project.presentation !== 'instagram' && c === 'carousel' && <InstagramCarousel project={project} onOpen={onOpen} />}
      {project.presentation !== 'instagram' && c === 'e-commerce' && <Ecommerce project={project} onOpen={onOpen} />}
      {project.presentation !== 'instagram' && c === 'advertising' && <Advertising project={project} onOpen={onOpen} />}
      {c === 'ui-ux' && <UiUx project={project} />}
      {project.presentation !== 'instagram' && c === 'photo-editing' && <BeforeAfter project={project} onOpen={onOpen} />}
      <p className="px__hint">{c === 'ui-ux' ? 'Scroll inside the screen to explore the full design.' : 'Shown in context. Select any image to open the original in the viewer.'}</p>
    </div>
  )
}
