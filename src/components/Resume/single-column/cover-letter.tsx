import type { CVData } from "../../../types";
import Header from "../ui/Header";
import Title from "../../Title/Title";
import Footer from "./ui/Footer";

function SingleColumnCoverLetter({ data }: { data: CVData }) {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-between">
      <div className="w-full max-w-5xl mx-auto rounded-md bg-white">
        <Header data={data} />
        <Title text="Cover Letter" />
        <CoverLetterContent coverLetterLines={data.coverLetter || []} />
      </div>
      <div className="w-full">
        <Footer data={data} />
      </div>
    </div>
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
