import { useState } from 'react'
import { Search } from 'lucide-react'
import { Art, Bar, Pager } from './shared.jsx'

const Card = ({ children, className = '' }) => <div className={`ec-card ${className}`}>{children}</div>
const Ghost = () => (
  <Card className="ec-card--ghost">
    <span className="ec-card__img" aria-hidden="true" />
    <Bar w="85%" /><Bar w="55%" /><Bar w="40%" h={14} />
  </Card>
)

// Listing: the artwork is the product image on a marketplace-style card, among neutral placeholder cards
function Listing({ project, onOpen }) {
  const [i, setI] = useState(0)
  return (
    <>
      <div className="ec ec--listing">
        <Ghost />
        <Card className="ec-card--main">
          <Art key={i} image={project.images[i]} index={i} onOpen={onOpen} eager className="ec-card__art" />
          <Bar w="85%" /><Bar w="55%" /><Bar w="40%" h={14} />
        </Card>
        <Ghost />
        <Ghost />
      </div>
      <Pager count={project.images.length} index={i} onChange={setI} label="Image" />
    </>
  )
}

// Detail page: thumbnails + main image on the left, neutral placeholder text blocks on the right
function Detail({ project, onOpen }) {
  const [i, setI] = useState(0)
  const imgs = project.images
  return (
    <div className="ec ec--detail">
      <div className="ec-gal">
        {imgs.length > 1 && (
          <ul className="ec-thumbs" role="list">
            {imgs.map((im, k) => (
              <li key={k}><button type="button" className={k === i ? 'is-on' : ''} onClick={() => setI(k)} aria-label={`Show image ${k + 1}`} aria-current={k === i}><img src={im.src} alt="" draggable={false} loading="lazy" /></button></li>
            ))}
          </ul>
        )}
        <Art key={i} image={imgs[i]} index={i} onOpen={onOpen} eager className="ec-gal__main" />
      </div>
      <div className="ec-info" aria-hidden="true">
        <Bar w="80%" h={18} /><Bar w="55%" h={18} />
        <Bar w="30%" h={12} className="ec-gap" />
        <Bar w="35%" h={26} className="ec-gap" />
        <span className="ec-chips"><i /><i /><i /></span>
        <Bar w="100%" h={44} className="ec-gap ec-cta" />
        <Bar w="100%" h={10} /><Bar w="92%" h={10} /><Bar w="70%" h={10} />
      </div>
    </div>
  )
}

// Image gallery: the supplied images exactly as a marketplace listing's gallery shows them
function Gallery({ project, onOpen }) {
  const [i, setI] = useState(0)
  const imgs = project.images
  return (
    <div className="ec ec--gallery">
      <ul className="ec-thumbs" role="list">
        {imgs.map((im, k) => (
          <li key={k}><button type="button" className={k === i ? 'is-on' : ''} onClick={() => setI(k)} aria-label={`Show image ${k + 1}`} aria-current={k === i}><img src={im.src} alt="" draggable={false} loading="lazy" /></button></li>
        ))}
      </ul>
      <Art key={i} image={imgs[i]} index={i} onOpen={onOpen} eager className="ec-gal__main" />
    </div>
  )
}

// Advertising placement: a sponsored result at the top of a search results page
function Ad({ project, onOpen }) {
  const [i, setI] = useState(0)
  return (
    <>
      <div className="ec ec--ad">
        <div className="ec-search" aria-hidden="true"><Search size={16} /><Bar w="40%" h={8} /></div>
        <Card className="ec-card--row ec-card--main">
          <span className="ec-tag">Sponsored</span>
          <Art key={i} image={project.images[i]} index={i} onOpen={onOpen} eager className="ec-row__art" />
        </Card>
        <Card className="ec-card--row ec-card--ghost"><span className="ec-card__img" aria-hidden="true" /><span className="ec-lines" aria-hidden="true"><Bar w="70%" /><Bar w="45%" /><Bar w="25%" h={14} /></span></Card>
      </div>
      <Pager count={project.images.length} index={i} onChange={setI} label="Image" />
    </>
  )
}

export default function Ecommerce({ project, onOpen }) {
  const f = project.format || (project.images.length > 1 ? 'gallery' : 'listing')
  if (f === 'detail') return <Detail project={project} onOpen={onOpen} />
  if (f === 'gallery') return <Gallery project={project} onOpen={onOpen} />
  if (f === 'ad') return <Ad project={project} onOpen={onOpen} />
  return <Listing project={project} onOpen={onOpen} />
}
