// Shared by api/track.js (recording) and api/stats.js (dashboard)

// Clicks that count as "reached out" for the conversion rate: any WhatsApp button, email, Let's talk, resume, brief
export const isConversion = (n) =>
  /whatsapp/.test(n) || n.startsWith('project cta:') || ['email', "let's talk", 'resume download', 'cta strip: send a brief', 'brief sent'].includes(n)

// Time-on-page buckets: [upper limit in seconds, label]
export const TIME_BUCKETS = [[10, '0–10s'], [30, '10–30s'], [60, '30s–1m'], [180, '1–3m'], [600, '3–10m'], [Infinity, '10m+']]

// Page sections in their current order, for the scroll drop-off funnel (ids match src/utils/track.js)
export const SECTION_ORDER = [
  ['top', 'Hero (page loaded)'], ['why', 'Why hire me'], ['work', 'Work'], ['cta', 'CTA strip'], ['testimonials', 'Testimonials'],
  ['process', 'Process'], ['services', 'Services'], ['about', 'About'], ['contact', 'Contact'],
]
