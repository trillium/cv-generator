import { getFullResume } from "@/lib/utils/resume-builder";
import { Header } from "@/components/Header/Header";
import { Profile } from "@/components/Profile/Profile";
import { CareerSummary } from "@/components/CareerSummary/CareerSummary";
import { WorkExperience } from "@/components/WorkExperience/WorkExperience";
import { Projects } from "@/components/Projects/Projects";
import { Technical } from "@/components/Technical/Technical";
import { Education } from "@/components/Education/Education";

export default function DbResumePage() {
  const cvData = getFullResume(1);

  if (!cvData) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold text-red-600">Resume not found</h1>
        <p className="mt-4">Resume ID 1 does not exist in the database.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-4 rounded bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          📊 This resume is loaded from the SQLite database at{" "}
          <code className="rounded bg-blue-100 px-1">pii/db.sqlite</code>
        </p>
      </div>

      <div className="resume-container bg-white p-8 shadow-lg">
        <Header {...cvData.header} />

        {cvData.profile && (
          <Profile
            shouldDisplayProfileImage={cvData.profile.shouldDisplayProfileImage}
            lines={cvData.profile.lines}
            links={cvData.profile.links}
          />
        )}

        {cvData.careerSummary && cvData.careerSummary.length > 0 && (
          <CareerSummary careerSummary={cvData.careerSummary} />
        )}

        {cvData.workExperience && cvData.workExperience.length > 0 && (
          <WorkExperience workExperience={cvData.workExperience} />
        )}

        {cvData.projects && cvData.projects.length > 0 && (
          <Projects projects={cvData.projects} />
        )}

        {cvData.technical && cvData.technical.length > 0 && (
          <Technical technical={cvData.technical} />
        )}

        {cvData.education && cvData.education.length > 0 && (
          <Education education={cvData.education} />
        )}
      </div>
    </div>
  );
}
