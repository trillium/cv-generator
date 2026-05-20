import React from 'react'
import EditableField from '@/components/EditableField'
import Title from '@/components/Title/Title'
import type { CVData } from '@/types'

export default function CareerSummary({ data }: { data: CVData }) {
  const { careerSummary = [] } = data
  const gapX = data.layout?.spacing?.careerSummaryGapX ?? 8
  const gapY = data.layout?.spacing?.careerSummaryGapY ?? 8

  return (
    <section>
      <Title text="Career Summary" spacing={data.layout?.spacing} />
      <div className="grid" style={{ gridTemplateColumns: '30% 1fr', rowGap: `${gapY}px` }}>
        {careerSummary.map(({ title, text }, idx) => (
          <React.Fragment key={title}>
            <div className="list-none">
              <EditableField yamlPath={`careerSummary.${idx}.title`} value={title} fieldType="text">
                <span className="font-semibold">{title}</span>
              </EditableField>
            </div>
            <div className="list-none" style={{ marginLeft: `${gapX}px` }}>
              <EditableField
                yamlPath={`careerSummary.${idx}.text`}
                value={text}
                fieldType="textarea"
              >
                <span>{text}</span>
              </EditableField>
            </div>
          </React.Fragment>
        ))}
      </div>
    </section>
  )
}
