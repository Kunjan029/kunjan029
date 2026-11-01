// Renders <a> when `href` is passed, otherwise <button>.
// variant: primary | secondary | ghost    size: sm | md | lg
export default function Button({
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  const classes = ['btn', `btn--${variant}`, size !== 'md' && `btn--${size}`, className]
    .filter(Boolean)
    .join(' ')

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  )
}
