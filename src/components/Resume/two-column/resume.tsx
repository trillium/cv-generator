import Header from '@/components/Header/Header'
import Profile from '@/components/Profile/Profile'
import ProjectsList from '@/components/Projects/ProjectsList'
import WorkExperience from '@/components/WorkExperience/WorkExperience'
import type { CVData } from '@/types'

function SingleColumnResume({ data }: { data: CVData }) {
  // Defensive check: ensure critical data exists
  if (!data.header || !data.workExperience) {
    console.warn('Two-column resume received incomplete data:', {
      hasHeader: !!data.header,
      hasWorkExperience: !!data.workExperience,
    })
    return (
      <div className="w-full bg-white dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
            Incomplete Resume Data
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Some required sections are missing from the resume data.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800 flex flex-col items-center justify-center ">
      <div className="grid grid-cols-10 gap-6 w-full max-w-6xl mx-auto rounded-md bg-white dark:bg-gray-800">
        <div className="col-span-7 flex flex-col gap-2">
          <Header {...data.header} />
          <WorkExperience data={data.workExperience} />
          <ProjectsList projects={data.projects} />
        </div>
        <div className="col-span-3 h-full flex flex-col border-primary-500 border-l px-4 bg-neutral-100 dark:bg-gray-800 rounded-r-md max-w-xs w-full">
          <Profile data={data} />
        </div>
      </div>
    </div>
  )
}

export default SingleColumnResume
