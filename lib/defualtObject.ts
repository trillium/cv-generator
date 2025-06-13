import type { CVData, Project } from "../src/types";

function normalizeProjects(projects: any[] = []): Project[] {
  return projects.map((project) => ({
    ...project,
    lines: Array.isArray(project.lines)
      ? project.lines.flatMap((line: any) =>
          Array.isArray(line.text)
            ? line.text.map((t: string) => ({ text: t }))
            : [{ text: line.text }],
        )
      : [],
  }));
}

function defualtObject(scriptData: any, fallbackData: any): CVData {
  const isValidData = (data: any): data is CVData => {
    return !!(
      data &&
      typeof data === "object" &&
      "header" in data &&
      "workExperience" in data &&
      "profile" in data &&
      "technical" in data &&
      "languages" in data &&
      "education" in data
    );
  };
  const base = isValidData(scriptData) ? scriptData : fallbackData;
  const languages =
    typeof base === "object" &&
    base !== null &&
    "languages" in base &&
    Array.isArray((base as Record<string, unknown>).languages)
      ? ((base as { languages: unknown[] }).languages as CVData["languages"])
      : [];
  return {
    header: base.header || { name: "", resume: [], title: [] },
    workExperience: base.workExperience || [],
    projects: base.projects ? normalizeProjects(base.projects) : [],
    profile: base.profile || {
      shouldDisplayProfileImage: false,
      lines: [],
      links: [],
    },
    technical: base.technical || [],
    education: Array.isArray(base.education) ? base.education : [],
    languages,
  };
}

export default defualtObject;
