import './Availability.css'

export default function Availability({ label = 'Available for projects', className = '' }) {
  return (
    <span className={`avail ${className}`.trim()}>
      <span className="avail__dot" aria-hidden="true" />
      <span className="avail__label">{label}</span>
    </span>
  )
}
