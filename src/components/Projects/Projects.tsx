import Title from "../Title/Title";
import BubbleList from "../Bubble/BubbleList";
import LineList from "../WorkExperience/LineList";
import ProjectLinks from "./ProjectLinks";
import EditableField from "../EditableField";
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
        {data.map((item, num) => {
          return (
            <ProjectItem
              key={num}
              data={item}
              showBubbles={showBubbles}
              index={num}
            />
          );
        })}
      </div>
    </section>
  );
};

function ProjectItem({
  data,
  showBubbles = true,
  index,
}: {
  data: Project;
  showBubbles: boolean;
  index: number;
}) {
  const { bubbles = [], lines = [], links = [] } = data;
  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between">
        <EditableField
          yamlPath={`projects.${index}.name`}
          value={data.name}
          fieldType="text"
        >
          <div className="font-bold">{data.name}</div>
        </EditableField>
        <ProjectLinks
          links={Array.isArray(links) ? links : []}
          projectIndex={index}
        />
      </div>
      {showBubbles && bubbles.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {bubbles.map((bubble, bubbleIndex) => (
            <EditableField
              key={bubbleIndex}
              yamlPath={`projects.${index}.bubbles.${bubbleIndex}`}
              value={bubble}
              fieldType="text"
            >
              <span className="inline-block px-2 py-1 rounded-full text-sm text-blue-800 bg-blue-100 mr-2 mb-1">
                {bubble}
              </span>
            </EditableField>
          ))}
        </div>
      )}
      <LineList lines={lines} yamlBasePath={`projects.${index}`} />
    </div>
  );
}

export default Projects;
