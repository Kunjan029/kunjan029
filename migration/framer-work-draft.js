/*
  DRAFT, not imported anywhere. Paste into RAW_PROJECTS in src/data/projects.js
  only AFTER the files in framer-assets.tsv exist in src/assets/projects/ and are verified.
  method: null = waiting for the user's confirmation (required field, do not guess).
  No client, year, tools or description are set on purpose.
*/
export const DRAFT = [
  { id: 'velor', title: 'Velor', category: 'e-commerce', method: null, focus: 'center', images: [img('velor-1.jpg')] },
  { id: 'veera', title: 'Veera', category: 'e-commerce', method: null, focus: 'center', images: [img('veera-1.jpg')] },
  { id: 'luxor', title: 'Luxor', category: 'e-commerce', method: null, focus: 'center', images: [img('luxor-1.jpg')] },
  {
    id: 'gitex', title: 'GITEX', category: 'advertising', method: null,
    images: ['gitex-1.png', 'gitex-2.png', 'gitex-3.png', 'gitex-4.png', 'gitex-5.png', 'gitex-6.png'].map((f) => img(f)),
  },
  {
    id: 'event-posters', title: 'Event Posters', category: 'social-media', method: null,
    images: ['event-posters-1.jpg', 'event-posters-2.jpg', 'event-posters-3.jpg'].map((f) => img(f)),
  },
  {
    id: 'keroluxe-festive', title: 'Keroluxe Festive', category: 'social-media', method: null,
    images: ['keroluxe-festive-1.jpg', 'keroluxe-festive-2.jpg'].map((f) => img(f)),
  },
]
