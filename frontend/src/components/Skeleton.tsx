import type { CSSProperties } from 'react'

export default function Skeleton({
  className = '',
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return <div aria-hidden="true" className={`sk ${className}`} style={style} />
}
