import BubbleList from "../Bubble/BubbleList";
import Title from "../Title/Title";
import LineList from "./LineList";

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

const WorkExperience = ({ data }: { data: WorkExperiences[] }) => {
  return (
    <section className="flex flex-col items-start gap-2">
      <Title text="Professional Experience" />
      <div className="flex flex-col gap-2">
        {data.map((item, index) => (
          <WorkExperienceItem
            key={index}
            item={item}
            isLast={index !== data.length - 1}
          />
        ))}
      </div>
    </section>
  );
};

function WorkExperienceItem({
  item,
}: {
  item: WorkExperiences;
  isLast: boolean;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between">
        <div className="font-bold ">{item.position}</div>
        <div className="text-base font-medium">{item.years}</div>
      </div>
      <div className="text-base font-medium">{item.company}</div>
      <BubbleList bubbles={item.bubbles} />
      <LineList lines={item.lines} />
    </div>
  );
}

export default WorkExperience;
