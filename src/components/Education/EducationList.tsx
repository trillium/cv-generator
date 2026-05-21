import type { Education as EducationType, LayoutConfig } from '@/types'
import Education from './Education'

export default function EducationList({
  education = [],
  showEducation,
  spacing,
}: {
  education?: EducationType[]
  showEducation?: boolean
  spacing?: LayoutConfig['spacing']
}) {
  if (!((education && education.length > 0) || showEducation === true)) {
    return null
  }

  return <Education data={education} spacing={spacing} />
}
