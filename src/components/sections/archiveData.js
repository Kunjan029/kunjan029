import { HAS_REAL_WORK, PROJECTS } from '../../data/projects.js'

/*
  The Creative Archive: four chapters, using ONLY what Kunjan has stated.
  - `year` is shown only where a real year exists (2011). Nothing else is dated.
  - `examples` are the visual slots inside each book. `art` picks the placeholder drawing used until real artwork is connected.
  - Books 3 and 4 automatically show real portfolio images (from src/data/projects.js) as soon as real projects exist.
*/
export const BOOKS = [
  {
    id: 'beginning', num: '01', title: 'The Beginning', year: '2011',
    story: 'Started designing wedding albums and banners using Adobe Photoshop.',
    hue: '#FFC6A8', cover: 'album', h: 15.2, t: 2.6,
    examples: [{ label: 'Wedding album designs', art: 'album' }, { label: 'Banners', art: 'banner' }],
  },
  {
    id: 'learning', num: '02', title: 'The Learning Years', year: '',
    story: 'Developing Photoshop skills, exploring composition, typography, image manipulation and creative techniques.',
    hue: '#D9C7FF', cover: 'type', h: 14.4, t: 3.1,
    examples: [{ label: 'Composition', art: 'composition' }, { label: 'Typography', art: 'type' }, { label: 'Image manipulation', art: 'manipulation' }, { label: 'Creative techniques', art: 'brush' }],
  },
  {
    id: 'evolution', num: '03', title: 'The Evolution', year: '',
    story: 'Expanding into social media creatives, advertising campaigns, e-commerce product visuals and photo editing.',
    hue: '#BCEBDF', cover: 'grid', h: 15.6, t: 2.9, fromWork: 4,
    examples: [{ label: 'Social media creatives', art: 'social' }, { label: 'Advertising campaigns', art: 'poster' }, { label: 'E-commerce product visuals', art: 'product' }, { label: 'Photo editing', art: 'photo' }],
  },
  {
    id: 'present', num: '04', title: 'The Present', year: '',
    story: 'An experienced graphic designer continuing to create visual experiences for brands and businesses.',
    hue: '#C6FF4D', cover: 'burst', h: 14.8, t: 2.4, fromWork: 2,
    examples: [{ label: 'Brand visuals', art: 'burst' }, { label: 'Business creatives', art: 'poster' }],
  },
]

// Real portfolio images where they exist, otherwise the placeholder slots above
export function examplesFor(book) {
  if (!book.fromWork || !HAS_REAL_WORK) return book.examples.map((e) => ({ ...e, placeholder: true }))
  const real = PROJECTS.filter((p) => p.cover).slice(0, book.fromWork).map((p) => ({ label: p.title, src: p.cover.src, alt: p.cover.alt, fit: p.fit, focus: p.focus }))
  return real.length ? real : book.examples.map((e) => ({ ...e, placeholder: true }))
}
