/*
  YOUR CONTACT DETAILS: fill these in. Leave a value as '' to hide that channel everywhere
  (Contact section, confirmation screen and footer). Nothing is hardcoded anywhere else.

  whatsapp : digits only, with country code, no "+" or spaces
  email    : plain address
  linkedin : full profile URL
  instagram: optional, full profile URL
  resume   : link or path to your resume (PDF). Leave '' until you have one: the Download Resume
             button then shows as "coming soon" instead of linking anywhere.
*/
export const CONTACT = {
  whatsapp: '919537095635', // from the existing Framer portfolio
  email: 'kunjan029@gmail.com', // confirmed by Kunjan
  linkedin: 'https://www.linkedin.com/in/kunjan-atara-768b86107/', // from the existing Framer portfolio
  instagram: '',
  resume: 'https://drive.google.com/uc?export=download&id=1xYVu0V8hu_8Jd1RssQMvsQ1I0ZDKvBVn',
}

export const getResume = () => CONTACT.resume?.trim() || ''

const digits = (v) => String(v || '').replace(/\D/g, '')

// Channels that are actually configured, ready to render as links
export function getChannels() {
  const out = []
  if (digits(CONTACT.whatsapp)) out.push({ id: 'whatsapp', label: 'WhatsApp', hint: 'Chat on WhatsApp', href: `https://wa.me/${digits(CONTACT.whatsapp)}`, external: true })
  if (CONTACT.email?.trim()) out.push({ id: 'email', label: 'Email', hint: CONTACT.email.trim(), href: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT.email.trim())}`, external: true })
  if (CONTACT.linkedin?.trim()) out.push({ id: 'linkedin', label: 'LinkedIn', hint: 'View my profile', href: CONTACT.linkedin.trim(), external: true })
  if (CONTACT.instagram?.trim()) out.push({ id: 'instagram', label: 'Instagram', href: CONTACT.instagram.trim(), external: true })
  return out
}

// One channel by id (or undefined if it isn't configured)
export const getChannel = (id) => getChannels().find((c) => c.id === id)
