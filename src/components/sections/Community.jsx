import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
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
      { name: 'Echai', tag: 'Volunteer · Hands-on in nearly everything' },
      { name: 'The Drift Tour', tag: 'Volunteer · Gujarat Drift Tour, Ahmedabad' },
      { name: 'Pixelverse', tag: 'Founder · Design community, Ahmedabad' },
    ],
  },
  {
    heading: 'Also part of',
    items: [
      { name: 'Open Source Weekend', tag: 'Former volunteer · Design Lead' },
      { name: 'The Hackers Meetup', tag: 'Former volunteer · Core team' },
      { name: 'GDG Gandhinagar', tag: 'Past volunteer' },
      { name: 'GDG Cloud Gandhinagar', tag: 'Past volunteer' },
      { name: 'IT Sales Community', tag: 'Past volunteer' },
      { name: 'HR Professional Community', tag: 'Past volunteer' },
    ],
  },
]

// Event photos: put files in src/assets/community/ and list them as { file, title, where, year }.
const EVENTS = [
  { file: 'devfest-gandhinagar-2025.webp', title: 'DevFest Gandhinagar', where: 'GDG Gandhinagar · Volunteer', year: '2025' },
  { file: 'wtm-break-the-pattern-2026.webp', title: 'Women Techmakers: Break the Pattern', where: 'GDG Ahmedabad · Volunteer', year: '2026' },
  { file: 'gdg-cloud-ahmedabad.webp', title: 'GDG Cloud Ahmedabad', where: 'Volunteer' },
  { file: 'gdg-cloud-ahmedabad-2.webp', title: 'GDG Cloud Community Day', where: 'GDG Cloud Ahmedabad · Volunteer', year: '2025' },
  { file: 'echai.webp', title: 'Echai', where: 'Volunteer' },
  { file: 'echai-2.webp', title: 'Echai', where: 'Volunteer' },
  { file: 'pixelverse-design-system.webp', title: 'Design System session', where: 'Pixelverse, Ahmedabad' },
  { file: 'pixelverse-canva-masterclass-1.webp', title: 'Canva Masterclass', where: 'Pixelverse, Ahmedabad' },
  { file: 'pixelverse-canva-masterclass-2.webp', title: 'Canva Masterclass', where: 'Pixelverse, Ahmedabad' },
  { file: 'pixelverse-think-like-user.webp', title: 'Learn to Think Like User', where: 'Pixelverse, Ahmedabad' },
  { file: 'pixelverse-how-to-design-a-logo.webp', title: 'How to Design a Logo', where: 'Pixelverse, Ahmedabad' },
  { file: 'pixelverse-figma-ai-workshop.webp', title: 'Figma AI Workshop', where: 'Pixelverse, Ahmedabad' },
]
const FILES = import.meta.glob('../../assets/community/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' })
const fileUrl = (name) => Object.entries(FILES).find(([p]) => p.endsWith(`/${name}`))?.[1]

export default function Community() {
  const photos = EVENTS.map((e) => ({ ...e, url: fileUrl(e.file) })).filter((e) => e.url)
  const [open, setOpen] = useState(null) // index of the photo shown in the viewer
  const dlg = useRef(null)
  const lastBtn = useRef(null)
  const go = (d) => setOpen((i) => (i + d + photos.length) % photos.length)

  useEffect(() => {
    const d = dlg.current
    if (!d) return
    if (open !== null && !d.open) d.showModal()
    if (open === null && d.open) d.close()
  }, [open])
  return (
    <section id="community" className="cm" aria-labelledby="cm-title">
      <Container>
        <p className="cm__label">BEYOND DESIGN</p>
        <h2 id="cm-title" className="cm__title"><span className="line"><Reveal text="COMMUNITY." accentDots /></span></h2>
        <p className="cm__lead">Away from the screen, I’m part of Ahmedabad’s design and tech communities: showing up, volunteering and meeting people who build things.</p>
        <p className="cm__stat"><b>500+</b><span>I have volunteered in more than 500 events.</span></p>

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
          <h3 className="cm__ph">Events & moments</h3>
        )}
        {photos.length > 0 && (
          <ul className="cm__grid" role="list">
            {photos.map((e, i) => (
              <li key={e.file} className="cm__item">
                <button type="button" className="cm__thumb" onClick={(ev) => { lastBtn.current = ev.currentTarget; setOpen(i) }} aria-label={`View larger: ${e.title}`} data-cursor>
                  <img src={e.url} alt={e.title} loading="lazy" decoding="async" />
                </button>
                <p><b>{e.title}</b><small>{[e.where, e.year].filter(Boolean).join(' · ')}</small></p>
              </li>
            ))}
          </ul>
        )}
        <dialog ref={dlg} className="cm__view" aria-label="Photo viewer" onClose={() => { setOpen(null); lastBtn.current?.focus() }}
          onClick={(e) => { if (e.target === dlg.current) setOpen(null) }}
          onKeyDown={(e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1) }}>
          {open !== null && photos[open] && (
            <figure>
              <img src={photos[open].url} alt={photos[open].title} />
              <figcaption><b>{photos[open].title}</b><small>{[photos[open].where, photos[open].year].filter(Boolean).join(' · ')}</small></figcaption>
            </figure>
          )}
          <button type="button" className="cm__x" onClick={() => setOpen(null)} aria-label="Close"><X size={20} /></button>
          <button type="button" className="cm__nav cm__nav--l" onClick={() => go(-1)} aria-label="Previous photo"><ChevronLeft size={24} /></button>
          <button type="button" className="cm__nav cm__nav--r" onClick={() => go(1)} aria-label="Next photo"><ChevronRight size={24} /></button>
        </dialog>
      </Container>
    </section>
  )
}
