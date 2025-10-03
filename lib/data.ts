import type { CVData } from "../src/types";
import fallbackData from "../src/data.json";
import scriptData from "../src/script-data.json";

export function mergeData(
  fallback: Partial<CVData>,
  script: Partial<CVData>,
): CVData {
  // Ensure header has omitTitle and omitBlurb
  const mergedHeader = {
    name: script.header?.name ?? fallback.header?.name ?? "",
    title: script.header?.title ?? fallback.header?.title ?? [],
    resume: script.header?.resume ?? fallback.header?.resume ?? [],
    omitTitle: script.header?.omitTitle ?? fallback.header?.omitTitle ?? false,
    omitBlurb: script.header?.omitBlurb ?? fallback.header?.omitBlurb ?? false,
  };

  return {
    info: script.info ?? fallback.info!,
    careerSummary: script.careerSummary ?? fallback.careerSummary ?? [],
    header: mergedHeader,
    workExperience: script.workExperience ?? fallback.workExperience ?? [],
    projects: script.projects ?? fallback.projects ?? [],
    profile: script.profile ?? fallback.profile!,
    technical: script.technical ?? fallback.technical ?? [],
    languages: script.languages ?? fallback.languages ?? [],
    education: script.education ?? fallback.education ?? [],
    coverLetter: script.coverLetter ?? fallback.coverLetter ?? [],
    metadata: script.metadata ?? fallback.metadata,
  } as CVData;
}

export function getDefaultData(): CVData {
  return mergeData(fallbackData as Partial<CVData>, scriptData as Partial<CVData>);
}
