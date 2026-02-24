import { getFullResume } from "@/lib/utils/resume-builder";
import { DbResumeDisplay } from "./DbResumeDisplay";

export const dynamic = "force-dynamic";

export default async function DbResumePage() {
  const cvData = await getFullResume(1);

  if (!cvData) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold text-red-600">Resume not found</h1>
        <p className="mt-4">Resume ID 1 does not exist in the database.</p>
      </div>
    );
  }

  return <DbResumeDisplay cvData={cvData} />;
}
