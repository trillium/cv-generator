import type { CVData } from "../../../types";
import Header from "./ui/Header";
import Title from "../../Title/Title";
import Footer from "./ui/Footer";
import ClickableSection from "../../ClickableSection/ClickableSection";
import SectionEditorModal from "../../SectionEditorModal/SectionEditorModal";
import { useSectionEditor } from "../../../hooks/useSectionEditor";

function SingleColumnCoverLetter({ data }: { data: CVData }) {
  const { currentEditingSection, openSectionEditor, closeSectionEditor } =
    useSectionEditor();

  return (
    <>
      <div className="min-h-screen w-full bg-white flex flex-col items-center justify-between">
        <div className="w-full max-w-5xl mx-auto rounded-md bg-white">
          <ClickableSection
            yamlPath="header"
            onSectionClick={openSectionEditor}
          >
            <Header data={data} />
          </ClickableSection>

          <Title text="Cover Letter" />

          <ClickableSection
            yamlPath="coverLetter"
            onSectionClick={openSectionEditor}
          >
            <CoverLetterContent coverLetterLines={data.coverLetter || []} />
          </ClickableSection>
        </div>
        <div className="w-full">
          <Footer data={data} />
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

export default SingleColumnCoverLetter;
