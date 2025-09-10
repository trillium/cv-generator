import BubbleList from "../Bubble/BubbleList";
import Title from "../Title/Title";
import LineList from "./LineList";
import EditableField from "../EditableField";

type Lines = { text: string; bulletPoint?: boolean }[];

type WorkExperiences = {
  position: string;
  company: string;
  location: string;
  icon: string;
  years: string;
  bubbles: string[];
  lines: Lines;
};

const WorkExperience = ({
  data,
  showBubbles = true,
}: {
  data: WorkExperiences[];
  showBubbles?: boolean;
}) => {
  return (
    <section className="flex flex-col items-start gap-2">
      <Title text="Professional Experience" />
      <div className="flex flex-col gap-2">
        {data.map((item, index) => (
          <WorkExperienceItem
            key={index}
            item={item}
            index={index}
            isLast={index !== data.length - 1}
            showBubbles={showBubbles}
          />
        ))}
      </div>
    </section>
  );
};

function WorkExperienceItem({
  item,
  index,
  showBubbles = true,
}: {
  item: WorkExperiences;
  index: number;
  isLast: boolean;
  showBubbles?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between">
        <EditableField
          yamlPath={`workExperience.${index}.position`}
          value={item.position}
          fieldType="text"
        >
          <div className="font-bold">{item.position}</div>
        </EditableField>
        <EditableField
          yamlPath={`workExperience.${index}.years`}
          value={item.years}
          fieldType="text"
        >
          <div className="text-base font-medium">{item.years}</div>
        </EditableField>
      </div>
      <EditableField
        yamlPath={`workExperience.${index}.company`}
        value={item.company}
        fieldType="text"
      >
        <div className="text-base font-medium">{item.company}</div>
      </EditableField>
      {showBubbles && item.bubbles && item.bubbles.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {item.bubbles.map((bubble, bubbleIndex) => (
            <EditableField
              key={bubbleIndex}
              yamlPath={`workExperience.${index}.bubbles.${bubbleIndex}`}
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
      <LineList lines={item.lines} yamlBasePath={`workExperience.${index}`} />
    </div>
  );
}

export default WorkExperience;
