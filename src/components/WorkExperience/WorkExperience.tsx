import EditableField from '@/components/EditableField'
import Title from '@/components/Title/Title'
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

  const sectionGap = spacing?.workExperienceSectionGap ?? 4
  const itemGap = spacing?.workExperienceItemGap ?? 8

  return (
    <section className="flex flex-col items-start" style={{ gap: `${sectionGap}px` }}>
      <Title text={title} spacing={spacing} />
      <div className="flex flex-col" style={{ gap: `${itemGap}px` }}>
        {data.map((item, index) => (
          <WorkExperienceItem
            key={`${item.position}-${item.company}`}
            item={item}
            index={index}
            isLast={index !== data.length - 1}
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
  showBubbles = true,
  sectionKey = 'workExperience',
  spacing,
}: {
  item: WorkExperienceType
  index: number
  isLast: boolean
  showBubbles?: boolean
  sectionKey?: string
  spacing?: LayoutConfig['spacing']
}) {
  const innerGap = spacing?.workExperienceInnerGap ?? 4
  const detailMarginTop = spacing?.workExperienceDetailMarginTop ?? 8

  return (
    <div className="flex flex-col" style={{ gap: `${innerGap}px` }}>
      {item.position && (
        <div className="flex flex-row justify-between">
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
        <div className="flex flex-row justify-between">
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
          style={{ gap: `${innerGap}px`, marginTop: `${detailMarginTop}px` }}
        >
          <div className="flex flex-row justify-between">
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
          />
        </div>
      ))}
    </div>
  )
}

export default WorkExperience
