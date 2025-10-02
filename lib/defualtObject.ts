import { CVData as CVDataSchema } from "../src/types/cvdata.zod";
import type { CVData, Project } from "../src/types";

/**
 * A fully-populated default CVData object with all required and optional properties.
 * Used as a base to ensure all fields are present when merging data sources.
 */
const defaultCVData: CVData = {
  info: {
    firstName: "",
    lastName: "",
    website: "",
    phone: "",
    email: "",
    bluesky: "",
    role: "",
    github: "",
  },
  header: {
    name: "",
    title: [],
    resume: [],
    omitTitle: false,
    omitBlurb: false,
  },
  workExperience: [],
  projects: [],
  profile: {
    shouldDisplayProfileImage: false,
    lines: [],
    links: [],
  },
  technical: [],
  education: [],
  languages: [],
  coverLetter: [],
  careerSummary: [],
};

/**
 * Normalizes a single project's lines property to always be an array of objects with a text property.
 * @param project - The project object to normalize.
 * @returns The normalized project.
 */
function normalizeProject(project: Partial<Project>): Project {
  return {
    ...project,
    lines: Array.isArray(project.lines)
      ? project.lines.flatMap((line: any) =>
          Array.isArray(line.text)
            ? line.text.map((t: string) => ({ text: t }))
            : [{ text: line.text }],
        )
      : [],
  };
}

/**
 * Normalizes the lines property of each project in an array.
 * @param projects - The array of project objects to normalize.
 * @returns The normalized array of projects.
 */
function normalizeProjects(projects: Partial<Project>[] = []): Project[] {
  return projects.map(normalizeProject);
}

/**
 * Checks if the provided data is a valid CVData object using Zod validation.
 * @param data - The data to check.
 * @returns True if valid, false otherwise.
 */
function isValidData(data: unknown): data is CVData {
  const result = CVDataSchema.safeParse(data);
  return result.success;
}

/**
 * Safely extracts the languages array from a base object, or returns an empty array if not present.
 * @param base - The object to extract languages from.
 * @returns The languages array or an empty array.
 */
function extractLanguages(base: unknown): CVData["languages"] {
  if (typeof base !== "object" || base === null) {
    return [];
  }
  if (!("languages" in base)) {
    return [];
  }
  const langs = (base as Record<string, unknown>).languages;
  if (!Array.isArray(langs)) {
    return [];
  }
  return langs as CVData["languages"];
}

/**
 * Returns a CVData object by merging scriptData and fallbackData, ensuring all required fields are present.
 * If scriptData is valid, it is used as the base; otherwise, fallbackData is used.
 * @param scriptData - The primary data source (may be incomplete or invalid).
 * @param fallbackData - The fallback data source (should be complete and valid).
 * @returns A fully-populated CVData object.
 */
function defualtObject(
  scriptData: Partial<CVData>,
  fallbackData: Partial<CVData>,
): CVData {
  const base = isValidData(scriptData) ? scriptData : fallbackData;
  const languages = extractLanguages(base);
  const result: CVData = {
    ...defaultCVData,
    ...base,
    header: { ...defaultCVData.header, ...base.header },
    profile: { ...defaultCVData.profile, ...base.profile },
    projects: base.projects ? normalizeProjects(base.projects) : [],
    languages,
  };
  if (base.coverLetter) {
    result.coverLetter = base.coverLetter;
  }
  return result;
}

export default defualtObject;
