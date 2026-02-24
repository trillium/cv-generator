import { getFullResume } from "@/lib/utils/resume-builder";
import DynamicDbPage from "@/src/app/DynamicDbPage";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ "resume-id": string }>;
}

export default async function TwoColumnDbResumePage({ params }: PageProps) {
  const { "resume-id": resumeIdStr } = await params;
  const resumeId = parseInt(resumeIdStr, 10);

  const cvData = await getFullResume(resumeId);

  if (!cvData) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold text-red-600">Resume not found</h1>
        <p className="mt-4">
          Resume ID {resumeId} does not exist in the database.
        </p>
      </div>
    );
  }

  return <DynamicDbPage cvData={cvData} variant="resume" layout="two-column" />;
}
