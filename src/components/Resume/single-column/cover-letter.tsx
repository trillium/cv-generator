"use client";

import type { CVData } from "../../../types";
import Header from "./ui/Header";
import Title from "../../Title/Title";
import Footer from "./ui/Footer";
import EditableField from "../../EditableField/EditableField";

function SingleColumnCoverLetter({ data }: { data: CVData }) {
  return (
    <>
      <div className="min-h-screen w-full bg-white dark:bg-gray-800 flex flex-col items-center justify-between">
        <div className="w-full max-w-5xl mx-auto rounded-md bg-white dark:bg-gray-800">
          <Header data={data} />

          <Title text="Cover Letter" />

          <CoverLetterContent coverLetterLines={data.coverLetter || []} />
        </div>
        <div className="w-full">
          <Footer data={data} />
        </div>
      </div>
    </>
  );
}

function CoverLetterContent({
  coverLetterLines,
}: {
  coverLetterLines: string[];
}) {
  console.log("CoverLetterContent received:", coverLetterLines);

  // If no cover letter lines exist, show a placeholder to start editing
  if (!coverLetterLines || coverLetterLines.length === 0) {
    return (
      <div className="my-4">
        <EditableField
          yamlPath="coverLetter.0"
          value=""
          fieldType="text"
          className="!block !relative w-full"
        >
          <p className="my-2 leading-loose text-gray-400 italic">
            Click here to start writing your cover letter...
          </p>
        </EditableField>
      </div>
    );
  }

  return (
    <div>
      {coverLetterLines.map((line, index) => {
        const text = line !== null ? line : "\u00A0";
        console.log(`Line ${index}:`, {
          line,
          text,
          yamlPath: `coverLetter.${index}`,
        });
        return (
          <EditableField
            key={index}
            yamlPath={`coverLetter.${index}`}
            value={line || ""}
            fieldType="text"
            className="!block !relative w-full"
          >
            <p className="my-2 leading-loose">{text}</p>
          </EditableField>
        );
      })}
    </div>
  );
}

export default SingleColumnCoverLetter;
