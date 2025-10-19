/**
 * Maps CV data sections to which PDFs need regeneration
 * This allows intelligent PDF regeneration based on what changed
 */

export type PdfType = "resume" | "cover";

/**
 * Mapping of section keys to which PDFs they affect
 */
export const SECTION_TO_PDF_MAP: Record<string, PdfType[]> = {
  info: ["resume", "cover"],
  header: ["resume", "cover"],
  careerSummary: ["resume"],
  workExperience: ["resume"],
  projects: ["resume"],
  profile: ["resume"],
  technical: ["resume"],
  languages: ["resume"],
  education: ["resume"],
  coverLetter: ["cover"],
  metadata: [],
  linkedIn: [],
  notes: [],
  llm: [],
};

/**
 * Determine which PDFs need regeneration based on the changed section
 * @param yamlPath - Dot-notation path (e.g., 'workExperience[0].position')
 * @returns Array of PDF types to regenerate
 */
export function getPdfsToRegenerate(yamlPath: string): PdfType[] {
  const section = yamlPath.split(".")[0].replace(/\[\d+\]/, "");

  const pdfs = SECTION_TO_PDF_MAP[section];

  if (!pdfs) {
    console.warn(`Unknown section: ${section}, regenerating both PDFs`);
    return ["resume", "cover"];
  }

  if (pdfs.length === 0) {
    console.log(
      `Section ${section} doesn't affect PDFs, skipping regeneration`,
    );
    return [];
  }

  return pdfs;
}
