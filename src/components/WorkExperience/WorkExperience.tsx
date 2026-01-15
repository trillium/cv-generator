import Title from "@/components/Title/Title";
import LineList from "./LineList";
import EditableField from "@/components/EditableField";
import type { WorkExperience as WorkExperienceType } from "@/types";

const WorkExperience = ({
  data,
  showBubbles = true,
}: {
  data: WorkExperienceType[];
  showBubbles?: boolean;
}) => {
  if (!data || !Array.isArray(data)) {
    console.warn("WorkExperience component received invalid data:", data);
    return null;
  }

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
  item: WorkExperienceType;
  index: number;
  isLast: boolean;
  showBubbles?: boolean;
}) {
  return (
    <div className="flex flex-col">
      {item.position && (
        <div className="flex flex-row justify-between">
          <EditableField
            yamlPath={`workExperience.${index}.position`}
            value={item.position}
            fieldType="text"
          >
            <div className="font-bold">{item.position}</div>
          </EditableField>
        </div>
      )}
      {item.company && (
        <EditableField
          yamlPath={`workExperience.${index}.company`}
          value={item.company}
          fieldType="text"
        >
          <div className="text-base font-medium">{item.company}</div>
        </EditableField>
      )}
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
      {item.details.map((detail, detailIndex) => (
        <div key={detailIndex} className="flex flex-col mt-2">
          <div className="flex flex-row justify-between">
            {detail.subhead && (
              <EditableField
                yamlPath={`workExperience.${index}.details.${detailIndex}.subhead`}
                value={detail.subhead}
                fieldType="text"
              >
                <div className="font-medium">{detail.subhead}</div>
              </EditableField>
            )}
            {detail.years && (
              <EditableField
                yamlPath={`workExperience.${index}.details.${detailIndex}.years`}
                value={detail.years}
                fieldType="text"
              >
                <div className="text-base font-medium">{detail.years}</div>
              </EditableField>
            )}
          </div>
          <LineList
            lines={detail.lines}
            yamlBasePath={`workExperience.${index}.details.${detailIndex}`}
          />
        </div>
      ))}
    </div>
  );
}

export default WorkExperience;
