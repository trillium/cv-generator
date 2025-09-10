import Header from "../../Header/Header";
import type { CVData } from "../../../types";
import Title from "../../Title/Title";
import { ProfileHeader } from "../../Profile/Profile";
import ClickableSection from "../../ClickableSection/ClickableSection";
import SectionEditorModal from "../../SectionEditorModal/SectionEditorModal";
import { useSectionEditor } from "../../../hooks/useSectionEditor";

function TwoColumnCoverLetter({ data }: { data: CVData }) {
  const { currentEditingSection, openSectionEditor, closeSectionEditor } =
    useSectionEditor();

  return (
    <>
      <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center ">
        <div className="grid grid-cols-10 gap-10 w-full max-w-6xl mx-auto rounded-md bg-white">
          <div className="col-span-7 flex flex-col gap-2">
            <ClickableSection
              yamlPath="header"
              onSectionClick={openSectionEditor}
            >
              <Header {...data.header} omitBlurb={true} />
            </ClickableSection>

            <Title text="Cover Letter" />

            <ClickableSection
              yamlPath="coverLetter"
              onSectionClick={openSectionEditor}
            >
              <CoverLetterContent coverLetterLines={data.coverLetter || []} />
            </ClickableSection>
          </div>

          <div className="col-span-3 min-h-screen flex flex-col border-primary-500 border-l px-4 bg-neutral-100 rounded-r-md max-w-xs w-full">
            <ClickableSection
              yamlPath="profile"
              onSectionClick={openSectionEditor}
            >
              <ProfileHeader {...data.profile} />
            </ClickableSection>
          </div>
        </div>
      </div>

      {/* Section Editor Modal */}
      {currentEditingSection && (
        <SectionEditorModal
          isOpen={true}
          onClose={closeSectionEditor}
          yamlPath={currentEditingSection}
        />
      )}
    </>
  );
}

function CoverLetterContent({
  coverLetterLines,
}: {
  coverLetterLines: string[];
}) {
  console.log(coverLetterLines);
  return (
    <div>
      {coverLetterLines.map((line, index) => {
        const text = line !== null ? line : "\u00A0";
        return (
          <p key={index} className="my-2 leading-loose">
            {text}
          </p>
        );
      })}
    </div>
  );
}

export default TwoColumnCoverLetter;
