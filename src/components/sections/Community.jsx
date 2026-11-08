import Container from '../ui/Container.jsx'
import Reveal from '../ui/Reveal.jsx'
import './Community.css'

// Add event photos to src/assets/community/ and describe them here: { file: 'gdg-ahmedabad.jpg', title, where, year }.
// The whole section stays hidden until at least one photo with a matching file exists.
const EVENTS = []

const FILES = import.meta.glob('../../assets/community/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })
const fileUrl = (name) => Object.entries(FILES).find(([p]) => p.endsWith(`/${name}`))?.[1]

export default function Community() {
  const items = EVENTS.map((e) => ({ ...e, url: fileUrl(e.file) })).filter((e) => e.url)
  if (!items.length) return null
  return (
    <section id="community" className="cm" aria-labelledby="cm-title">
      <Container>
        <p className="cm__label">BEYOND DESIGN</p>
        <h2 id="cm-title" className="cm__title"><span className="line"><Reveal text="COMMUNITY & EVENTS." accentDots /></span></h2>
        <p className="cm__lead">Workshops, meetups and conversations with the design and tech community.</p>
        <ul className="cm__grid" role="list">
          {items.map((e) => (
            <li key={e.file} className="cm__item">
              <img src={e.url} alt={e.title} loading="lazy" decoding="async" />
              <p><b>{e.title}</b><small>{[e.where, e.year].filter(Boolean).join(' · ')}</small></p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
