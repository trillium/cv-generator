import Title from "../Title/Title";
import BubbleList from "../Bubble/BubbleList";
import LineList from "../WorkExperience/LineList";
import ProjectLinks from "./ProjectLinks";
import type { Project } from "../../types";

const Projects = ({ data }: { data: Project[] }) => {
  return (
    <section className="flex flex-col items-start gap-2">
      <Title text="Projects" />
      <div>
        {data.map((item) => {
          return <ProjectItem data={item} />;
        })}
      </div>
    </section>
  );
};

function ProjectItem({ data }: { data: Project }) {
  const { bubbles = [], lines = [], links = [] } = data;
  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between">
        {/* <div className="font-bold text-lg">{data.name}</div> */}
        <div className="font-bold">{data.name}</div>
        <ProjectLinks links={Array.isArray(links) ? links : []} />
      </div>
      <BubbleList bubbles={bubbles} />
      <LineList lines={lines} />
    </div>
  );
}

export default Projects;
