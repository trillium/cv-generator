import type {
  CVData,
  WorkExperience,
  Project,
  TechnicalCategory,
} from "@/types";
import {
  getResume,
  getHeader,
  getHeaderResumeLines,
  getHeaderTitleLines,
  getProfile,
  getProfileLines,
  getProfileLinks,
  getCareerSummary,
  getWorkExperiences,
  getWorkExperienceBubbles,
  getWorkExperienceLines,
  getProjects,
  getProjectBubbles,
  getProjectLines,
  getProjectLinks,
  getTechnicalCategories,
  getTechnicalBubbles,
  getEducation,
  getLanguages,
  getCoverLetter,
} from "@/lib/db/queries";

export async function getFullResume(resumeId: number): Promise<CVData | null> {
  const resume = await getResume(resumeId);
  if (!resume) return null;

  const header = await getHeader(resumeId);
  const profile = await getProfile(resumeId);
  const careerSummary = await getCareerSummary(resumeId);
  const workExperiences = await getWorkExperiences(resumeId);
  const projects = await getProjects(resumeId);
  const technicalCategories = await getTechnicalCategories(resumeId);
  const education = await getEducation(resumeId);
  const languages = await getLanguages(resumeId);
  const coverLetter = await getCoverLetter(resumeId);

  const workExperienceData: WorkExperience[] = await Promise.all(
    workExperiences.map(async (we): Promise<WorkExperience> => {
      const lines = await getWorkExperienceLines(we.id);
      const bubbles = await getWorkExperienceBubbles(we.id);

      return {
        position: we.position,
        company: we.company,
        location: we.location || "",
        icon: we.icon || "",
        bubbles: bubbles.length > 0 ? bubbles.map((b) => b.text) : undefined,
        details: [
          {
            subhead: we.subhead || we.company,
            years: we.years || undefined,
            lines: lines.map((line) => ({
              text: line.text,
              bulletPoint: line.bullet_point === 1,
            })),
          },
        ],
      };
    }),
  );

  const projectData: Project[] = await Promise.all(
    projects.map(async (p): Promise<Project> => {
      const lines = await getProjectLines(p.id);
      const links = await getProjectLinks(p.id);
      const bubbles = await getProjectBubbles(p.id);

      return {
        name: p.name,
        duration: p.duration || undefined,
        bubbles: bubbles.length > 0 ? bubbles.map((b) => b.text) : undefined,
        lines: lines.map((line) => ({
          text: line.text,
        })),
        links: links.map((link) => ({
          name: link.name,
          link: link.link,
          icon: link.icon ?? "",
        })),
      };
    }),
  );

  const headerResumeLines = header ? await getHeaderResumeLines(header.id) : [];
  const headerTitleLines = header ? await getHeaderTitleLines(header.id) : [];
  const profileLines = profile ? await getProfileLines(profile.id) : [];
  const profileLinks = profile ? await getProfileLinks(profile.id) : [];

  const technicalData: TechnicalCategory[] = await Promise.all(
    technicalCategories.map(
      async (cat): Promise<TechnicalCategory> => ({
        category: cat.category,
        bubbles: (await getTechnicalBubbles(cat.id)).map((b) => b.text),
      }),
    ),
  );

  const cvData: CVData = {
    info: {
      firstName: header?.first_name || "",
      lastName: header?.last_name || "",
      email: header?.email || "",
      phone: header?.phone || "",
      role: header?.role || "",
      website: header?.website || "",
    },
    header: {
      name: header?.name || "",
      resume: headerResumeLines.map((l) => l.text),
      title: headerTitleLines.map((l) => l.text),
    },
    careerSummary: careerSummary.map((item) => ({
      title: item.title,
      text: item.text,
    })),
    workExperience: workExperienceData,
    projects: projectData,
    profile: {
      shouldDisplayProfileImage: profile?.should_display_profile_image === 1,
      lines: profileLines.map((l) => l.text),
      links: profileLinks.map((link) => ({
        name: link.name,
        link: link.link,
        icon: link.icon ?? "",
      })),
    },
    technical: technicalData,
    education: education.length
      ? education.map((edu) => ({
          degree: edu.degree || "",
          school: edu.school,
          location: edu.location || "",
          years: edu.years || "",
        }))
      : undefined,
    languages: languages.length
      ? languages.map((lang) => ({
          language: lang.name,
          abbreviation: "",
          level: lang.proficiency ?? "",
        }))
      : undefined,
    coverLetter: coverLetter.length
      ? coverLetter.map((line) => line.text ?? "")
      : undefined,
  };

  return cvData;
}
