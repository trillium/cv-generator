import Separator from '@/components/Separator/Separator'
import type { LayoutConfig } from '@/types'

const Title = ({ text, spacing }: { text: string; spacing?: LayoutConfig['spacing'] }) => {
  const marginTop = spacing?.sectionMarginTop ?? 12
  const separatorMarginBottom = spacing?.sectionSeparatorMarginBottom ?? 8

  return (
    <div className="w-full" style={{ marginTop: `${marginTop}px` }}>
      <div className="text-primary-500 rounded text-base font-bold">{text}</div>
      <Separator className="" style={{ marginBottom: `${separatorMarginBottom}px` }} />
    </div>
  )
}

export default Title
