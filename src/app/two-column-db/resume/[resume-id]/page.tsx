import DynamicDbPage from "@/src/app/DynamicDbPage";

interface PageProps {
  params: Promise<{ "resume-id": string }>;
}

export default async function TwoColumnDbResumePage({ params }: PageProps) {
  const { "resume-id": resumeIdStr } = await params;
  const resumeId = parseInt(resumeIdStr, 10);

  return (
    <DynamicDbPage resumeId={resumeId} variant="resume" layout="two-column" />
  );
}
