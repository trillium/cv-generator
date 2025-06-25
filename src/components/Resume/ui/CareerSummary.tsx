import Title from "../../Title/Title";
import type { CVData } from "../../../types";

export default function CareerSummary({ data }: { data: CVData }) {
  const { careerSummary } = data;

  return (
    <section>
      <Title text="Career Summary" />
      <div className="grid grid-cols-10 gap-2">
        {careerSummary.map(({ title, text }, idx) => (
          <>
            <div className="col-span-2 list-none" key={idx}>
              <span className="font-semibold">{title}</span>
            </div>
            <div className="col-span-8 list-none" key={idx}>
              {text}
            </div>
          </>
        ))}
      </div>
    </section>
  );
}
