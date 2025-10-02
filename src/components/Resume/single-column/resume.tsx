import type { CVData } from "../../../types";
import Header from "./ui/Header";
import ProjectsList from "../../Projects/ProjectsList";
import CareerSummary from "./ui/CareerSummary";
import Footer from "./ui/Footer";
import WorkExperience from "../../WorkExperience/WorkExperience";

function TwoColumnResume({ data }: { data: CVData }) {
  const showBubbles = false;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-800 flex flex-col">
      {/* Header - stays at top */}
      <div className="w-full">
        <Header data={data} />
      </div>

      {/* Main content - grows to fill space */}
      <div className="flex-1 w-full max-w-5xl mx-auto rounded-md bg-white dark:bg-gray-800">
        <CareerSummary data={data} />
        <WorkExperience data={data.workExperience} showBubbles={showBubbles} />
        <ProjectsList projects={data.projects} showBubbles={showBubbles} />
      </div>

      {/* Footer - sticks to bottom */}
      <div className="w-full">
        <Footer data={data} />
      </div>
    </div>
  );
}

export default TwoColumnResume;
