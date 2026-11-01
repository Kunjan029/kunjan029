// Page-width wrapper. Use `narrow` for text-heavy layouts, `as` to change the tag.
export default function Container({ as: Tag = 'div', narrow = false, className = '', children, ...rest }) {
  const classes = ['container', narrow && 'container--narrow', className].filter(Boolean).join(' ')
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  )
}
