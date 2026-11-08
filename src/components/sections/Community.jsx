import Container from '../ui/Container.jsx'
import Reveal from '../ui/Reveal.jsx'
import './Community.css'

// Only what Kunjan has confirmed. Add `note` for a one-line detail once he shares it.
const GROUPS = [
  {
    heading: 'Currently involved',
    items: [
      { name: 'GDG Ahmedabad', tag: 'Volunteer' },
      { name: 'GDG Cloud Ahmedabad', tag: 'Volunteer' },
      { name: 'Echai', tag: 'Volunteer' },
      { name: 'Pixelverse', tag: 'Founder · Design community, Ahmedabad' },
    ],
  },
  {
    heading: 'Also part of',
    items: [
      { name: 'Open Source Weekend', tag: 'Former Design Lead' },
      { name: 'The Hackers Meetup', tag: 'Former core team member' },
      { name: 'GDG Gandhinagar', tag: 'Past volunteer' },
      { name: 'GDG Cloud Gandhinagar', tag: 'Past volunteer' },
    ],
  },
]

// Event photos: put files in src/assets/community/ and list them as { file, title, where, year }.
const EVENTS = [
  { file: 'pixelverse-design-system.webp', title: 'Design System session', where: 'Pixelverse, Ahmedabad' },
  { file: 'pixelverse-canva-masterclass-1.webp', title: 'Canva Masterclass', where: 'Pixelverse, Ahmedabad' },
  { file: 'pixelverse-canva-masterclass-2.webp', title: 'Canva Masterclass', where: 'Pixelverse, Ahmedabad' },
]
const FILES = import.meta.glob('../../assets/community/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })
const fileUrl = (name) => Object.entries(FILES).find(([p]) => p.endsWith(`/${name}`))?.[1]

export default function Community() {
  const photos = EVENTS.map((e) => ({ ...e, url: fileUrl(e.file) })).filter((e) => e.url)
  return (
    <section id="community" className="cm" aria-labelledby="cm-title">
      <Container>
        <p className="cm__label">BEYOND DESIGN</p>
        <h2 id="cm-title" className="cm__title"><span className="line"><Reveal text="COMMUNITY." accentDots /></span></h2>
        <p className="cm__lead">Away from the screen, I’m part of Ahmedabad’s design and tech communities: showing up, volunteering and meeting people who build things.</p>

        <div className="cm__groups">
          {GROUPS.map((g) => (
            <div key={g.heading} className="cm__group">
              <h3>{g.heading}</h3>
              <ul role="list">
                {g.items.map((i) => (
                  <li key={i.name}>
                    <span className="cm__name">{i.name}</span>
                    {i.tag && <span className="cm__tag">{i.tag}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {photos.length > 0 && (
          <h3 className="cm__ph">Events I organised with Pixelverse</h3>
        )}
        {photos.length > 0 && (
          <ul className="cm__grid" role="list">
            {photos.map((e) => (
              <li key={e.file} className="cm__item">
                <img src={e.url} alt={e.title} loading="lazy" decoding="async" />
                <p><b>{e.title}</b><small>{[e.where, e.year].filter(Boolean).join(' · ')}</small></p>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  )
}
