// Tiny bridge so any section can pre-fill the Contact brief (e.g. a Services card) and jump to it.
export const SERVICE_OPTIONS = ['Social Media Creatives', 'Carousel Design', 'E-commerce Product Visuals', 'Advertising Creatives', 'Photo Editing']

export function startBrief(service) {
  window.dispatchEvent(new CustomEvent('kd:brief', { detail: { service } }))
}
