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

export function getFullResume(resumeId: number): CVData | null {
  const resume = getResume(resumeId);
  if (!resume) return null;

  const header = getHeader(resumeId);
  const profile = getProfile(resumeId);
  const careerSummary = getCareerSummary(resumeId);
  const workExperiences = getWorkExperiences(resumeId);
  const projects = getProjects(resumeId);
  const technicalCategories = getTechnicalCategories(resumeId);
  const education = getEducation(resumeId);
  const languages = getLanguages(resumeId);
  const coverLetter = getCoverLetter(resumeId);

  const cvData: CVData = {
    info: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "",
    },
    header: {
      name: header?.name || "",
      resume: header ? getHeaderResumeLines(header.id).map((l) => l.text) : [],
      title: header ? getHeaderTitleLines(header.id).map((l) => l.text) : [],
    },
    careerSummary: careerSummary.map((item) => ({
      title: item.title,
      text: item.text,
    })),
    workExperience: workExperiences.map((we): WorkExperience => {
      const lines = getWorkExperienceLines(we.id);
      const bubbles = getWorkExperienceBubbles(we.id);

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
    projects: projects.map((p): Project => {
      const lines = getProjectLines(p.id);
      const links = getProjectLinks(p.id);
      const bubbles = getProjectBubbles(p.id);

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
          icon: link.icon || undefined,
        })),
      };
    }),
    profile: {
      shouldDisplayProfileImage: profile?.should_display_profile_image === 1,
      lines: profile ? getProfileLines(profile.id).map((l) => l.text) : [],
      links: profile
        ? getProfileLinks(profile.id).map((link) => ({
            name: link.name,
            link: link.link,
            icon: link.icon || undefined,
          }))
        : [],
    },
    technical: technicalCategories.map(
      (cat): TechnicalCategory => ({
        category: cat.category,
        bubbles: getTechnicalBubbles(cat.id).map((b) => b.text),
      }),
    ),
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
          name: lang.name,
          proficiency: lang.proficiency || undefined,
        }))
      : undefined,
    coverLetter: coverLetter.length
      ? coverLetter.map((line) => line.text || null)
      : undefined,
  };

  return cvData;
}
