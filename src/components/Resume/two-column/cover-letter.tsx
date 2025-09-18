"use client";

import Header from "../../Header/Header";
import type { CVData } from "../../../types";
import Title from "../../Title/Title";
import { ProfileHeader } from "../../Profile/Profile";
import EditableField from "../../EditableField/EditableField";

function TwoColumnCoverLetter({ data }: { data: CVData }) {
  return (
    <>
      <div className="min-h-screen w-full bg-white dark:bg-gray-800 flex flex-col items-center justify-center ">
        <div className="grid grid-cols-10 gap-10 w-full max-w-6xl mx-auto rounded-md bg-white dark:bg-gray-800">
          <div className="col-span-7 flex flex-col gap-2">
            <Header {...data.header} omitBlurb={true} />

            <Title text="Cover Letter" />

            <CoverLetterContent coverLetterLines={data.coverLetter || []} />
          </div>

          <div className="col-span-3 min-h-screen flex flex-col border-primary-500 border-l px-4 bg-neutral-100 dark:bg-gray-800 rounded-r-md max-w-xs w-full">
            <ProfileHeader {...data.profile} />
          </div>
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
  console.log(coverLetterLines);

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

export default TwoColumnCoverLetter;
