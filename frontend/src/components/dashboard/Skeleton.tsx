import type { CSSProperties } from 'react'

interface Props {
  className?: string
  style?: CSSProperties
}

export default function Skeleton({ className = '', style }: Props) {
  return (
    <div className={`animate-pulse rounded-md bg-surface-200 dark:bg-surface-700 ${className}`} style={style} />
  )
}
