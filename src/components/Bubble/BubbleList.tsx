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
      {bubbles.map((bubble, _bubble_index) => (
        <Bubble key={bubble} text={bubble} />
      ))}
    </div>
  )
}

export default BubbleList
