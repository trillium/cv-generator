import EditableField from '@/components/EditableField'
import Title from '@/components/Title/Title'
import type { Education as EducationType } from '@/types'

const Education = ({ data }: { data: EducationType[] }) => {
  if (!data || !Array.isArray(data)) {
    console.warn('Education component received invalid data:', data)
    return null
  }

  return (
    <section className="flex flex-col items-start gap-2">
      <Title text="Education" />
      <div className="w-full">
        {data.map((item, num) => {
          return <EducationItem key={num} data={item} index={num} />
        })}
      </div>
    </section>
  )
}

function EducationItem({ data, index }: { data: EducationType; index: number }) {
  const hasDegree = data.degree && data.degree.trim().length > 0

  return (
    <div className="flex w-full flex-col">
      {hasDegree ? (
        <>
          <EditableField
            yamlPath={`education.${index}.degree`}
            value={data.degree}
            fieldType="text"
          >
            <div className="font-bold">{data.degree}</div>
          </EditableField>
          <div className="flex flex-row justify-between">
            <EditableField
              yamlPath={`education.${index}.school`}
              value={data.school}
              fieldType="text"
            >
              <div className="text-base font-medium">{data.school}</div>
            </EditableField>
            <EditableField
              yamlPath={`education.${index}.years`}
              value={data.years}
              fieldType="text"
            >
              <div className="text-base font-medium">{data.years}</div>
            </EditableField>
          </div>
        </>
      ) : (
        <div className="flex flex-row w-full justify-between">
          <EditableField
            yamlPath={`education.${index}.school`}
            value={data.school}
            fieldType="text"
          >
            <div className="font-bold">{data.school}</div>
          </EditableField>
          <EditableField yamlPath={`education.${index}.years`} value={data.years} fieldType="text">
            <div className="text-base font-medium">{data.years}</div>
          </EditableField>
        </div>
      )}
      <EditableField
        yamlPath={`education.${index}.location`}
        value={data.location}
        fieldType="text"
      >
        <div className="text-sm text-neutral-500 dark:text-neutral-400">{data.location}</div>
      </EditableField>
    </div>
  )
}

export default Education
