import Header from "../../Header/Header";
import WorkExperience from "../../WorkExperience/WorkExperience";
import Profile from "../../Profile/Profile";
import ProjectsList from "../../Projects/ProjectsList";
import type { CVData } from "../../../types";

function SingleColumnResume({ data }: { data: CVData }) {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-800 flex flex-col items-center justify-center ">
      <div className="grid grid-cols-10 gap-6 w-full max-w-6xl mx-auto rounded-md bg-white dark:bg-gray-800">
        <div className="col-span-7 flex flex-col gap-2">
          <Header {...data.header} />
          <WorkExperience data={data.workExperience} />
          <ProjectsList projects={data.projects} />
        </div>
        <div className="col-span-3 min-h-screen flex flex-col border-primary-500 border-l px-4 bg-neutral-100 dark:bg-gray-800 rounded-r-md max-w-xs w-full">
          <Profile data={data} />
        </div>
      </div>
    </div>
  );
}

export default SingleColumnResume;
