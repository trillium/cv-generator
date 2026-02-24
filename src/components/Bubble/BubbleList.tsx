import clsx from 'clsx'
import Bubble from '@/components/Bubble/Bubble'

function BubbleList({
  bubbles = [],
  className = 'gap-2',
}: {
  bubbles: string[]
  className?: string
}) {
  return (
    <div className={clsx('flex text-xs', className)}>
      {bubbles.map((bubble, bubble_index) => (
        <Bubble key={bubble_index} text={bubble} />
      ))}
    </div>
  )
}

export default BubbleList
