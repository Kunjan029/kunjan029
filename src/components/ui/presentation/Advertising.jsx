import { useState } from 'react'
import { Art, Bar, Browser, Pager, useNatural } from './shared.jsx'
import { InstagramPost } from './Social.jsx'

const Nav = () => (
  <div className="ad-nav" aria-hidden="true"><Bar w="5rem" h={16} /><span><Bar w="2.5rem" h={8} /><Bar w="2.5rem" h={8} /><Bar w="2.5rem" h={8} /></span></div>
)
const Cards = ({ n = 3 }) => (
  <div className="ad-cards" aria-hidden="true">{Array.from({ length: n }, (_, k) => <span key={k}><i /><Bar w="80%" /><Bar w="50%" /></span>)}</div>
)

// Hero banner: full width at the top of a website, under the navigation, at its own aspect ratio
function Hero({ project, onOpen, i }) {
  return (
    <Browser>
      <Nav />
      <Art image={project.images[i]} index={i} onOpen={onOpen} eager className="ad-hero" />
      <div className="ad-body"><Bar w="30%" h={14} /><Cards /></div>
    </Browser>
  )
}

// Promo banner: sits inside the page's content column between sections
function Promo({ project, onOpen, i }) {
  return (
    <Browser>
      <Nav />
      <div className="ad-body">
        <Bar w="28%" h={14} /><Cards n={4} />
        <Art image={project.images[i]} index={i} onOpen={onOpen} eager className="ad-promo" />
        <Bar w="22%" h={14} /><Cards n={4} />
      </div>
    </Browser>
  )
}

// Display ad: shown at its original pixel size in an ad slot (top leaderboard for wide formats, sidebar otherwise)
function Display({ project, onOpen, i }) {
  const im = project.images[i]
  const size = useNatural(im.src)
  const wide = size ? size.w / size.h >= 2.5 : false
  const slot = (
    <div className="ad-slot">
      <span className="ad-slot__label">Advertisement</span>
      <Art image={im} index={i} onOpen={onOpen} eager className="ad-display" />
      {size && <span className="ad-slot__size">{size.w} × {size.h}</span>}
    </div>
  )
  return (
    <Browser>
      <Nav />
      {wide ? (
        <div className="ad-body">{slot}<Bar w="55%" h={20} /><span className="ad-lines" aria-hidden="true"><Bar /><Bar /><Bar w="85%" /><Bar w="60%" /></span></div>
      ) : (
        <div className="ad-article">
          <div className="ad-body"><Bar w="65%" h={20} /><span className="ad-lines" aria-hidden="true"><Bar /><Bar /><Bar w="90%" /><Bar /><Bar w="70%" /><Bar /><Bar w="85%" /></span></div>
          <aside>{slot}</aside>
        </div>
      )}
    </Browser>
  )
}

// Poster: the artwork on its own, with no mockup
function Poster({ project, onOpen, i }) {
  return <div className="ad-poster"><Art image={project.images[i]} index={i} onOpen={onOpen} eager className="ad-poster__art" /></div>
}

export default function Advertising({ project, onOpen }) {
  const [i, setI] = useState(0)
  const f = project.format || 'poster'
  const view =
    f === 'hero-banner' ? <Hero project={project} onOpen={onOpen} i={i} />
    : f === 'promo-banner' ? <Promo project={project} onOpen={onOpen} i={i} />
    : f === 'display-ad' ? <Display project={project} onOpen={onOpen} i={i} />
    : f === 'social-ad' ? <InstagramPost key={i} project={{ ...project, images: [project.images[i]] }} onOpen={() => onOpen(i)} sponsored />
    : <Poster project={project} onOpen={onOpen} i={i} />
  return <>{view}<Pager count={project.images.length} index={i} onChange={setI} label="Creative" /></>
}
