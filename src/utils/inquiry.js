// Builds the prepared project inquiry and the links that carry it. No contact details live here.
export function buildInquiry({ opportunity, services, timeline, message, name, email }) {
  return [
    'Hi Kunjan, I came across your portfolio and would like to get in touch.',
    '',
    `Opportunity: ${opportunity}`,
    ...(services.length ? [`Design areas: ${services.join(', ')}`] : []),
    `Timeline: ${timeline || 'Not sure yet'}`,
    '',
    'Details:',
    message.trim(),
    '',
    `Name: ${name.trim()}`,
    `Email: ${email.trim()}`,
  ].join('\n')
}

export const whatsappUrl = (number, text) => `https://wa.me/${String(number).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`

// Opens a Gmail compose window (new tab) with the address, subject and message filled in
export const mailtoUrl = (email, subject = '', body = '') =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email.trim())}${subject ? `&su=${encodeURIComponent(subject)}` : ''}${body ? `&body=${encodeURIComponent(body)}` : ''}`

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
