import './ProjectVisual.css'

// variant="card"  -> the card preview: uses `cover`, honours fit + focus
// variant="full"  -> popup stage: the whole artwork, never cropped
// variant="thumb" -> small gallery thumbnail
// With no real image supplied it shows a clearly labelled placeholder.
export default function ProjectVisual({ project, index = 0, eager = false, variant = 'card', number }) {
  const image = variant === 'card' && index === 0 ? project.cover : project.images?.[index]

  if (image?.src) {
    const style =
      variant === 'card'
        ? { objectFit: project.fit, objectPosition: project.focus }
        : variant === 'full'
          ? { objectFit: 'contain' }
          : undefined
    return (
      <img
        className={`pv__img pv__img--${variant}`}
        src={image.src}
        alt={variant === 'thumb' ? '' : image.alt}
        style={style}
        draggable={false}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    )
  }

  // Layout-test slot only; disappears as soon as real artwork is supplied
  const slot = String(number ?? index + 1).padStart(2, '0')
  return (
    <span className="pv" role="img" aria-label={`Image slot for ${project.title}, image ${index + 1}`}>
      <span className="pv__frame">
        <span className="pv__name">{slot}</span>
        <span className="pv__tag">Image slot</span>
        {import.meta.env.DEV && <span className="pv__hint">Replace in src/data/projects.js</span>}
      </span>
    </span>
  )
}

export const imageCount = (p) => p.images?.length || (p.placeholderCount ?? 1)
