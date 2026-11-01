import './Reveal.css'

// Words wrapped in masks for staggered reveals (animate `.rv__in`). accentDots colours sentence-ending periods.
export default function Reveal({ text, accentDots = false }) {
  return text.split(' ').map((w, i, arr) => {
    const dot = accentDots && w.endsWith('.')
    return (
      <span key={i}>
        <span className="rv"><span className="rv__in">{dot ? w.slice(0, -1) : w}{dot && <span className="dot">.</span>}</span></span>
        {i < arr.length - 1 && ' '}
      </span>
    )
  })
}
