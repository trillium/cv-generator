"use client";

import type { CVData } from "@/types";
import Header from "@/components/Header/Header";
import Profile from "@/components/Profile/Profile";
import WorkExperience from "@/components/WorkExperience/WorkExperience";
import Projects from "@/components/Projects/Projects";

export function DbResumeDisplay({ cvData }: { cvData: CVData }) {
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
            data={{
              profile: cvData.profile,
              technical: cvData.technical,
              languages: cvData.languages,
              education: cvData.education,
            }}
          />
        )}

        {cvData.careerSummary && cvData.careerSummary.length > 0 && (
          <div className="mt-4">
            <h2 className="text-xl font-bold">Career Summary</h2>
            <div className="mt-2 grid grid-cols-10 gap-2">
              {cvData.careerSummary.map((item, i) => (
                <div key={`summary-${i}`} className="contents">
                  <div className="col-span-2">
                    <span className="font-semibold">{item.title}</span>
                  </div>
                  <div className="col-span-8">
                    <span>{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {cvData.workExperience && cvData.workExperience.length > 0 && (
          <WorkExperience data={cvData.workExperience} />
        )}

        {cvData.projects && cvData.projects.length > 0 && (
          <Projects data={cvData.projects} showBubbles={false} />
        )}

        {cvData.technical && cvData.technical.length > 0 && (
          <div className="mt-4">
            <h2 className="text-xl font-bold">Technical Skills</h2>
            {cvData.technical.map((cat, i) => (
              <div key={i} className="mt-2">
                <h3 className="font-semibold">{cat.category}</h3>
                <p>{cat.bubbles.join(", ")}</p>
              </div>
            ))}
          </div>
        )}

        {cvData.education && cvData.education.length > 0 && (
          <div className="mt-4">
            <h2 className="text-xl font-bold">Education</h2>
            {cvData.education.map((edu, i) => (
              <div key={i} className="mt-2">
                <p className="font-semibold">{edu.degree}</p>
                <p>
                  {edu.school} - {edu.location}
                </p>
                <p className="text-sm text-gray-600">{edu.years}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
