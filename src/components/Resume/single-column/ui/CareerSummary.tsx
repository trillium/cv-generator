import Title from "../../../Title/Title";
import type { CVData } from "../../../../types";
import React from "react";

export default function CareerSummary({ data }: { data: CVData }) {
  const { careerSummary } = data;

  return (
    <section>
      <Title text="Career Summary" />
      <div className="grid grid-cols-10 gap-2">
        {careerSummary.map(({ title, text }, idx) => (
          <React.Fragment key={title}>
            <div className="col-span-2 list-none" key={idx}>
              <span className="font-semibold">{title}</span>
            </div>
            <div className="col-span-8 list-none">{text}</div>
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
