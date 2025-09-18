import Title from "../../../Title/Title";
import EditableField from "../../../EditableField";
import type { CVData } from "../../../../types";
import React from "react";

export default function CareerSummary({ data }: { data: CVData }) {
  const { careerSummary } = data;

  return (
    <section>
      <Title text="Career Summary" />
      <div className="grid grid-cols-10 gap-2">
        {careerSummary.map(({ title, text }, idx) => (
          <React.Fragment key={`career-summary-${idx}`}>
            <div className="col-span-2 list-none" key={idx}>
              <EditableField
                yamlPath={`careerSummary.${idx}.title`}
                value={title}
                fieldType="text"
              >
                <span className="font-semibold">{title}</span>
              </EditableField>
            </div>
            <div className="col-span-8 list-none">
              <EditableField
                yamlPath={`careerSummary.${idx}.text`}
                value={text}
                fieldType="textarea"
              >
                <span>{text}</span>
              </EditableField>
            </div>
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
