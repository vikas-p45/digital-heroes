export default function Card({ as: Tag = 'section', className = '', children, ...rest }) {
  return <Tag className={`card ${className}`} {...rest}>{children}</Tag>;
}
