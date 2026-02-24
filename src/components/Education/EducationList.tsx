import type { Education as EducationType } from '@/types'
import Education from './Education'

export default function EducationList({
  education = [],
  showEducation,
}: {
  education?: EducationType[]
  showEducation?: boolean
}) {
  if (!((education && education.length > 0) || showEducation === true)) {
    return null
  }

  return <Education data={education} />
}
