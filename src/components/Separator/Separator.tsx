import { clsx } from 'clsx'
import type { CSSProperties } from 'react'

const Separator = ({
  className = 'my-2.5',
  style,
}: {
  className?: string
  style?: CSSProperties
}) => {
  return (
    <div
      className={clsx('h-0 w-full bg-primary-500 border-b border-primary-500', className)}
      style={style}
    ></div>
  )
}

export default Separator
