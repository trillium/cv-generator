import Title from "../Title/Title";
import BubbleList from "../Bubble/BubbleList";
import LineList from "../WorkExperience/LineList";
import ProjectLinks from "./ProjectLinks";
import type { Project } from "../../types";

const Projects = ({
  data,
  showBubbles,
}: {
  data: Project[];
  showBubbles: boolean;
}) => {
  return (
    <section className="flex flex-col items-start gap-2">
      <Title text="Projects" />
      <div>
        {data.map((item) => {
          return <ProjectItem data={item} showBubbles={showBubbles} />;
        })}
      </div>
    </section>
  );
};

function ProjectItem({
  data,
  showBubbles = true,
}: {
  data: Project;
  showBubbles: boolean;
}) {
  const { bubbles = [], lines = [], links = [] } = data;
  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between">
        <div className="font-bold">{data.name}</div>
        <ProjectLinks links={Array.isArray(links) ? links : []} />
      </div>
      {showBubbles && <BubbleList bubbles={bubbles} />}
      <LineList lines={lines} />
    </div>
  );
}

export default Projects;
