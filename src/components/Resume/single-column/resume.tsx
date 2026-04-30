import EducationList from '@/components/Education/EducationList'
import PaperSheet from '@/components/PaperSheet'
import ProjectsList from '@/components/Projects/ProjectsList'
import WorkExperience from '@/components/WorkExperience/WorkExperience'
import type { CVData } from '@/types'
import CareerSummary from './ui/CareerSummary'
import Footer from './ui/Footer'
import Header from './ui/Header'

function TwoColumnResume({ data }: { data: CVData }) {
  const showBubbles = false

  return (
    <PaperSheet>
      <div className="w-full flex-1 bg-white dark:bg-gray-800 flex flex-col">
        <Header data={data} />
        <CareerSummary data={data} />
        <div className="flex-1 flex flex-col justify-evenly">
          <WorkExperience data={data.workExperience} showBubbles={showBubbles} />
          <ProjectsList projects={data.projects} showBubbles={showBubbles} />
          <EducationList education={data.education} showEducation={data.showEducation} />
        </div>
        <div className="w-full">
          <Footer data={data} />
        </div>
      </div>
    </PaperSheet>
  )
}

export default TwoColumnResume
