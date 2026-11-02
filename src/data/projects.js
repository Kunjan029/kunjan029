/*
  HOW TO ADD YOUR WORK
  1. Put image files in src/assets/projects/  (exact sizes: see src/assets/projects/README.md)
  2. Add an entry to RAW_PROJECTS below. The moment ONE real project exists, every placeholder
     disappears automatically, and filter chips with no projects hide themselves.

  {
    id: 'my-project',                 // REQUIRED  unique, no spaces
    title: 'Real Project Title',      // REQUIRED
    category: 'social-media',         // REQUIRED  social-media | carousel | e-commerce | advertising | photo-editing
    method: 'non-ai',                 // REQUIRED  non-ai | ai-assisted | ai  (how the work was made)
    size: 'feature',                  // optional, no longer needed: the grid now alternates 7/5 columns by itself
    images: [                         // REQUIRED  gallery shown in the popup, never cropped there
      img('my-project-1.jpg'),
      { src: img('my-project-2.jpg'), alt: 'Describe the image', caption: 'Optional caption' },
    ],

    // HOW THE POPUP PRESENTS IT (real-world context, original images only):
    //   social-media  -> Instagram-style post (several images = several posts, picked with 01 02 ...)
    //   carousel      -> Instagram-style carousel, slides in exactly the order of `images`
    //   e-commerce    -> format: 'listing' | 'detail' | 'gallery' | 'ad'   (default: gallery if 2+ images, else listing)
    //   advertising   -> format: 'hero-banner' | 'promo-banner' | 'display-ad' | 'social-ad' | 'poster'  (default 'poster')
    //   photo-editing -> compare: [{ before: img('a-before.jpg'), after: img('a-after.jpg') }]  (no `images` needed)
    // Add `presentation: 'viewer'` to any project to skip the context view and use the plain image viewer.

    // everything below is OPTIONAL and simply hidden when left out
    cover: img('my-project-cover.jpg'), // separate card image at the exact size ratio (default: first gallery image)
    fit: 'cover',                     // 'cover' fills the card (crops) | 'contain' shows the whole artwork
    focus: 'center top',              // which part stays visible when cover crops, e.g. 'left center'
    year: 2024,
    client: 'Client or brand name',   // only if you have permission to show it
    role: 'Design',                   // e.g. 'Design and art direction'
    tools: ['Photoshop', 'Illustrator'],
    tags: ['Instagram', 'Carousel'],  // up to 4 shown on the card
    description: 'One or two lines.', // shown on the card and in the popup
    details: 'Longer text for the popup. Separate paragraphs with a blank line.',
    link: 'https://...',              // shows a "View case study" button
  }
*/

const files = import.meta.glob('../assets/projects/*.{png,jpg,jpeg,webp,avif,svg,gif}', {
  eager: true,
  query: '?url',
  import: 'default',
})

// img('file.jpg') -> resolved URL of src/assets/projects/file.jpg
export const img = (name) => {
  const url = files[`../assets/projects/${name}`]
  if (!url && import.meta.env.DEV) console.warn(`[projects] Image not found in src/assets/projects/: ${name}`)
  return url
}

export const CATEGORIES = [
  { id: 'all', label: 'All Work' },
  { id: 'social-media', label: 'Social Media' },
  { id: 'carousel', label: 'Carousel Design' },
  { id: 'e-commerce', label: 'E-commerce' },
  { id: 'advertising', label: 'Advertising' },
  { id: 'ui-ux', label: 'UI/UX' },
  { id: 'photo-editing', label: 'Photo Editing' }, // chip appears automatically once a project uses it
]

export const METHODS = [
  { id: 'all', label: 'All' },
  { id: 'non-ai', label: 'Non-AI Design' },
  { id: 'ai-assisted', label: 'AI-Assisted' },
  { id: 'ai', label: 'AI Design' },
]

// Placeholder slots only: no real projects, clients or results are implied.
// `placeholderCount` just shows how many image slots the gallery will have.
const RAW_PROJECTS = [
  // ---- Real work (migrated from the Framer portfolio). No clients, years or results are claimed. ----
  { id: 'ecommerce', title: 'E-Commerce', category: 'e-commerce', method: 'non-ai', presentation: 'instagram', fit: 'contain', images: ['velor-1.jpg', 'veera-1.jpg', 'luxor-1.jpg'].map((f) => img(f)) },
  {
    id: 'gitex', title: 'GITEX', category: 'advertising', method: 'ai-assisted', presentation: 'instagram', fit: 'contain',
    images: ['gitex-1.png', 'gitex-2.png', 'gitex-3.png', 'gitex-4.png', 'gitex-5.png', 'gitex-6.png'].map((f) => img(f)),
  },
  {
    id: 'event-posters', title: 'Event Posters', category: 'social-media', method: 'ai-assisted',
    images: ['event-posters-1.jpg', 'event-posters-2.jpg', 'event-posters-3.jpg'].map((f) => img(f)),
  },
  { id: 'republic-day', title: 'Republic Day', category: 'social-media', method: 'non-ai', images: [img('keroluxe-festive-1.jpg')] },
  { id: 'navratri', title: 'Navratri', category: 'social-media', method: 'non-ai', images: [img('keroluxe-festive-2.jpg')] },
  { id: 'travel-ad', title: 'Travel Ad', category: 'advertising', method: 'ai', presentation: 'instagram', fit: 'contain', images: [img('travel-ad-1.jpg')] },
  {
    id: 'banners', title: 'Banners', category: 'advertising', method: 'non-ai', presentation: 'instagram', format: 'display-ad', fit: 'contain',
    images: ['banners-1.jpg', 'banners-2.jpg', 'banners-3.jpg'].map((f) => img(f)),
  },
  { id: 'ganesh-chaturthi', title: 'Ganesh Chaturthi', category: 'social-media', method: 'non-ai', images: [img('festive-1.jpg')] },
  { id: 'christmas', title: 'Christmas', category: 'social-media', method: 'non-ai', images: [img('festive-2.jpg')] },
  { id: 'new-year', title: 'New Year', category: 'social-media', method: 'non-ai', images: [img('festive-3.jpg')] },
  { id: 'independence-day', title: 'Independence Day', category: 'social-media', method: 'non-ai', images: [img('festive-4.jpg')] },
  {
    id: 'product-retouching', title: 'Product Retouching', category: 'photo-editing', method: 'non-ai', presentation: 'viewer', fit: 'contain', wide: true,
    images: ['retouching-1.jpg', 'retouching-2.jpg', 'retouching-3.jpg', 'retouching-4.jpg', 'retouching-5.jpg'].map((f) => img(f)),
  },
  {
    id: 'photo-editing', title: 'Photo Editing', category: 'photo-editing', method: 'non-ai', presentation: 'viewer', fit: 'contain',
    images: ['photo-editing-1.jpg', 'photo-editing-2.jpg', 'photo-editing-3.jpg'].map((f) => img(f)),
  },
  // ---- UI/UX (migrated from the Framer portfolio). Long pages: the card shows the top of the design, the popup scrolls the whole page ----
  {
    id: 'spotify-design-system', title: 'Spotify Design System', category: 'ui-ux', method: 'non-ai', tall: true, fit: 'cover', focus: 'top',
    description: 'Reusable components, inspired by Spotify.',
    images: [img('uiux-spotify.jpg')],
  },
  {
    id: 'all-veggies', title: 'All Veggies', category: 'ui-ux', method: 'non-ai', tall: true, fit: 'cover', focus: 'top',
    description: 'A vibrant UI experiment inspired by veggies: one-page storytelling with bold structure and clear hierarchy.',
    images: [img('uiux-all-veggies.jpg')],
  },
  {
    id: 'white-label', title: 'White Label', category: 'ui-ux', method: 'non-ai', tall: true, fit: 'cover', focus: 'top',
    description: 'A bright, component-driven e-commerce UI covering the full journey from signup to checkout, built to scale across brands.',
    images: [img('uiux-white-label.jpg')],
  },
  // ---- Placeholders (hidden automatically because real projects exist above) ----
  { id: 'placeholder-01', placeholder: true, placeholderCount: 3, title: 'Project Title 01', category: 'social-media', method: 'non-ai', size: 'feature', images: [] },
  { id: 'placeholder-02', placeholder: true, placeholderCount: 2, title: 'Project Title 02', category: 'e-commerce', method: 'non-ai', size: 'tall', images: [] },
  { id: 'placeholder-03', placeholder: true, title: 'Project Title 03', category: 'advertising', method: 'ai', size: 'small', images: [] },
  { id: 'placeholder-04', placeholder: true, title: 'Project Title 04', category: 'advertising', method: 'non-ai', size: 'wide', images: [] },
  { id: 'placeholder-05', placeholder: true, title: 'Project Title 05', category: 'social-media', method: 'ai', size: 'tall', images: [] },
  { id: 'placeholder-06', placeholder: true, title: 'Project Title 06', category: 'e-commerce', method: 'ai-assisted', size: 'feature', images: [] },
]

/* ---------- Normalisation: components only ever see this clean shape ---------- */
const toImage = (v, fallbackAlt) => {
  if (!v) return null
  const o = typeof v === 'string' ? { src: v } : v
  return o.src ? { src: o.src, alt: o.alt || fallbackAlt, caption: o.caption || '' } : null
}

function normalize(p) {
  // Photo editing: each pair is shown side by side; the viewer gets them as original, edited, original, edited...
  const compare = (Array.isArray(p.compare) ? p.compare : [])
    .map((c, i) => {
      const before = toImage(c.before, `${p.title}, original ${i + 1}`)
      const after = toImage(c.after, `${p.title}, edited ${i + 1}`)
      return before && after ? { before: { ...before, caption: before.caption || 'Original' }, after: { ...after, caption: after.caption || 'Edited' } } : null
    })
    .filter(Boolean)
  const raw = compare.length ? compare.flatMap((c) => [c.before, c.after]) : Array.isArray(p.images) ? p.images : []
  const gallery = raw.map((v, i) => toImage(v, `${p.title}, image ${i + 1}`)).filter(Boolean)
  const cover = toImage(p.cover, `${p.title}, cover`) || (compare.length ? compare[0].after : null) || gallery[0] || null
  // A project with only a cover still gets a working one-image gallery in the popup
  const images = gallery.length ? gallery : cover ? [cover] : []
  return {
    ...p,
    compare,
    images,
    cover,
    fit: p.fit === 'contain' ? 'contain' : 'cover',
    focus: p.focus || 'center',
    tags: p.tags || [],
    tools: p.tools || [],
  }
}

// Development-only checks so a typo is caught immediately instead of silently misbehaving
function validate(list) {
  const seen = new Set()
  const cats = CATEGORIES.map((c) => c.id).filter((id) => id !== 'all')
  const methods = METHODS.map((m) => m.id).filter((id) => id !== 'all')
  list.forEach((p) => {
    const warn = (msg) => console.warn(`[projects] "${p.id || p.title || '?'}": ${msg}`)
    if (!p.id) warn('missing id')
    else if (seen.has(p.id)) warn('duplicate id')
    seen.add(p.id)
    if (!p.title) warn('missing title')
    if (!cats.includes(p.category)) warn(`category must be one of: ${cats.join(', ')}`)
    if (!methods.includes(p.method)) warn(`method must be one of: ${methods.join(', ')}`)
    if (!p.placeholder && !p.images.length) warn('no images found, check the file names in img()')
  })
}

const ALL = RAW_PROJECTS.map(normalize)
const REAL = ALL.filter((p) => !p.placeholder)

export const HAS_REAL_WORK = REAL.length > 0
// As soon as one real project exists, every placeholder disappears automatically.
export const PROJECTS = HAS_REAL_WORK ? REAL : ALL

if (import.meta.env.DEV) validate(ALL)
