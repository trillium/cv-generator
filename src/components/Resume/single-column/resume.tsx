import type { CVData } from "../../../types";
import Header from "./ui/Header";
import ProjectsList from "../../Projects/ProjectsList";
import CareerSummary from "./ui/CareerSummary";
import Footer from "./ui/Footer";
import WorkExperience from "../../WorkExperience/WorkExperience";

function TwoColumnResume({ data }: { data: CVData }) {
  const showBubbles = false;
  return (
    <>
      <div className="min-h-screen w-full bg-white flex flex-col items-center justify-between">
        <div className="w-full max-w-5xl mx-auto rounded-md bg-white">
          <Header data={data} />
          <CareerSummary data={data} />
          <WorkExperience
            data={data.workExperience}
            showBubbles={showBubbles}
          />
          <ProjectsList projects={data.projects} showBubbles={showBubbles} />
        </div>

        <div className="w-full">
          <Footer data={data} />
        </div>
      </div>
    </>
  );
}

export default TwoColumnResume;
