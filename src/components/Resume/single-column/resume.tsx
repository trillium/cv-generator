import EducationList from '@/components/Education/EducationList'
import ProjectsList from '@/components/Projects/ProjectsList'
import WorkExperience from '@/components/WorkExperience/WorkExperience'
import type { CVData } from '@/types'
import CareerSummary from './ui/CareerSummary'
import Footer from './ui/Footer'
import Header from './ui/Header'

function TwoColumnResume({ data }: { data: CVData }) {
  const showBubbles = false

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-full min-h-screen bg-white dark:bg-gray-800 flex flex-col justify-between max-w-5xl">
        {/* Header - stays at top */}
        <Header data={data} />

        {/* Main content - grows to fill space */}
        <CareerSummary data={data} />
        <WorkExperience data={data.workExperience} showBubbles={showBubbles} />
        <ProjectsList projects={data.projects} showBubbles={showBubbles} />
        <EducationList education={data.education} showEducation={data.showEducation} />

        {/* Footer - sticks to bottom */}
        <div className="w-full mx-auto">
          <Footer data={data} />
        </div>
      </div>
    </div>
  )
}

export default TwoColumnResume
