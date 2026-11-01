import Container from './Container.jsx'

// Standard section shell: vertical rhythm + Container. Pass `alt` for the secondary background.
export default function Section({ id, alt = false, narrow = false, className = '', children, ...rest }) {
  const classes = ['section', alt && 'section--alt', className].filter(Boolean).join(' ')
  return (
    <section id={id} className={classes} {...rest}>
      <Container narrow={narrow}>{children}</Container>
    </section>
  )
}
