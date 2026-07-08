import EditableField from '@/components/EditableField'
import Title from '@/components/Title/Title'
import { resolveSpacingValue } from '@/lib/spacing'
import type { LayoutConfig, WorkExperience as WorkExperienceType } from '@/types'
import LineList from './LineList'

const WorkExperience = ({
  data,
  showBubbles = true,
  title = 'Professional Experience',
  sectionKey = 'workExperience',
  spacing,
}: {
  data: WorkExperienceType[]
  showBubbles?: boolean
  title?: string
  sectionKey?: string
  spacing?: LayoutConfig['spacing']
}) => {
  if (!data || !Array.isArray(data)) {
    console.warn('WorkExperience component received invalid data:', data)
    return null
  }

  return (
    <section className="flex flex-col items-start">
      <Title text={title} spacing={spacing} />
      <div className="flex flex-col">
        {data.map((item, index) => (
          <WorkExperienceItem
            key={`${item.position}-${item.company}`}
            item={item}
            index={index}
            isFirst={index === 0}
            showBubbles={showBubbles}
            sectionKey={sectionKey}
            spacing={spacing}
          />
        ))}
      </div>
    </section>
  )
}

function WorkExperienceItem({
  item,
  index,
  isFirst,
  showBubbles = true,
  sectionKey = 'workExperience',
  spacing,
}: {
  item: WorkExperienceType
  index: number
  isFirst: boolean
  showBubbles?: boolean
  sectionKey?: string
  spacing?: LayoutConfig['spacing']
}) {
  const we = spacing?.workExperience
  const positionMarginBottom = resolveSpacingValue(we?.positionMarginBottom, index, 2)
  const companyMarginBottom = resolveSpacingValue(we?.companyMarginBottom, index, 4)
  const subheadMarginBottom = resolveSpacingValue(we?.subheadMarginBottom, index, 2)
  const detailGap = resolveSpacingValue(we?.detailGap, index, 6)
  const bulletGap = resolveSpacingValue(we?.bulletGap, index, 0)
  const itemMarginTop = isFirst ? 0 : resolveSpacingValue(we?.itemGap, index - 1, 8)

  return (
    <div className="flex flex-col" style={{ marginTop: `${itemMarginTop}px` }}>
      {item.position && (
        <div
          className="flex flex-row justify-between"
          style={{ marginBottom: `${positionMarginBottom}px` }}
        >
          <EditableField
            yamlPath={`${sectionKey}.${index}.position`}
            value={item.position}
            fieldType="text"
          >
            <div className="font-bold">{item.position}</div>
          </EditableField>
        </div>
      )}
      {item.company && (
        <div
          className="flex flex-row justify-between"
          style={{ marginBottom: `${companyMarginBottom}px` }}
        >
          <EditableField
            yamlPath={`${sectionKey}.${index}.company`}
            value={item.company}
            fieldType="text"
          >
            <div className="text-base font-medium">{item.company}</div>
          </EditableField>
          {item.details.length === 1 && item.details[0].years && (
            <EditableField
              yamlPath={`${sectionKey}.${index}.details.0.years`}
              value={item.details[0].years}
              fieldType="text"
            >
              <div className="text-base font-medium">{item.details[0].years}</div>
            </EditableField>
          )}
        </div>
      )}
      {showBubbles && item.bubbles && item.bubbles.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {item.bubbles.map((bubble, bubbleIndex) => (
            <EditableField
              key={bubble}
              yamlPath={`${sectionKey}.${index}.bubbles.${bubbleIndex}`}
              value={bubble}
              fieldType="text"
            >
              <span className="inline-block px-2 py-1 rounded-full text-sm text-blue-800 bg-blue-100 mr-2 mb-1">
                {bubble}
              </span>
            </EditableField>
          ))}
        </div>
      )}
      {item.details.map((detail, detailIndex) => (
        <div
          key={`${detail.subhead}-${detail.years}`}
          className="flex flex-col"
          style={{ marginTop: detailIndex > 0 ? `${detailGap}px` : undefined, breakInside: 'avoid' }}
        >
          <div
            className="flex flex-row justify-between"
            style={{ marginBottom: `${subheadMarginBottom}px` }}
          >
            {detail.subhead && detail.subhead !== item.company && (
              <EditableField
                yamlPath={`${sectionKey}.${index}.details.${detailIndex}.subhead`}
                value={detail.subhead}
                fieldType="text"
              >
                <div className="font-medium">{detail.subhead}</div>
              </EditableField>
            )}
            {detail.years && item.details.length > 1 && (
              <EditableField
                yamlPath={`${sectionKey}.${index}.details.${detailIndex}.years`}
                value={detail.years}
                fieldType="text"
              >
                <div className="text-base font-medium">{detail.years}</div>
              </EditableField>
            )}
          </div>
          <LineList
            lines={detail.lines}
            yamlBasePath={`${sectionKey}.${index}.details.${detailIndex}`}
            bulletGap={bulletGap}
          />
        </div>
      ))}
    </div>
  )
}

export default WorkExperience
