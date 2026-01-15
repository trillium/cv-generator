import type { CVData } from "@/types";
import Header from "./ui/Header";
import ProjectsList from "@/components/Projects/ProjectsList";
import CareerSummary from "./ui/CareerSummary";
import Footer from "./ui/Footer";
import WorkExperience from "@/components/WorkExperience/WorkExperience";

function TwoColumnResume({ data }: { data: CVData }) {
  const showBubbles = false;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-full min-h-screen bg-white dark:bg-gray-800 flex flex-col justify-between max-w-5xl">
        {/* Header - stays at top */}
        <Header data={data} />

        {/* Main content - grows to fill space */}
        <CareerSummary data={data} />
        <WorkExperience data={data.workExperience} showBubbles={showBubbles} />
        <ProjectsList projects={data.projects} showBubbles={showBubbles} />

        {/* Footer - sticks to bottom */}
        <div className="w-full mx-auto">
          <Footer data={data} />
        </div>
      </div>
    </div>
  );
}

export default TwoColumnResume;
