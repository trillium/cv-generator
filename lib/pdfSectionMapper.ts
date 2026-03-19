/**
 * Maps CV data sections to which PDFs need regeneration
 * This allows intelligent PDF regeneration based on what changed
 */

import path from 'node:path'
import { parseNumberedArrayFile, SECTION_KEY_TO_FILENAME } from './multiFileMapper'

export type PdfType = 'resume' | 'cover'

const LIBRARY_DIR_TO_SECTION: Record<string, string> = {
  header: 'header',
  'career-summary': 'careerSummary',
  workExperience: 'workExperience',
  projects: 'projects',
  technical: 'technical',
  education: 'education',
  'cover-letter': 'coverLetter',
  profile: 'profile',
  languages: 'languages',
}

function libraryDirToSectionKey(dirName: string): string | null {
  return LIBRARY_DIR_TO_SECTION[dirName] || null
}

/**
 * Mapping of section keys to which PDFs they affect
 */
export const SECTION_TO_PDF_MAP: Record<string, PdfType[]> = {
  info: ['resume', 'cover'],
  header: ['resume', 'cover'],
  careerSummary: ['resume'],
  workExperience: ['resume'],
  projects: ['resume'],
  profile: ['resume'],
  technical: ['resume'],
  languages: ['resume'],
  education: ['resume'],
  coverLetter: ['cover'],
  metadata: [],
  linkedIn: [],
  notes: [],
  llm: [],
}

/**
 * Determine which PDFs need regeneration based on the changed section
 * @param yamlPath - Dot-notation path (e.g., 'workExperience[0].position')
 * @returns Array of PDF types to regenerate
 */
export function getPdfsToRegenerate(yamlPath: string): PdfType[] {
  const section = yamlPath.split('.')[0].replace(/\[\d+\]/, '')

  const pdfs = SECTION_TO_PDF_MAP[section]

  if (!pdfs) {
    console.warn(`Unknown section: ${section}, regenerating both PDFs`)
    return ['resume', 'cover']
  }

  if (pdfs.length === 0) {
    console.log(`Section ${section} doesn't affect PDFs, skipping regeneration`)
    return []
  }

  return pdfs
}

/**
 * Determine which PDFs need regeneration based on the changed file
 * @param filePath - File path (e.g., 'experience.yaml' or 'google/cover-letter.yml')
 * @returns Array of PDF types to regenerate
 */
export function getPdfsToRegenerateFromFile(filePath: string): PdfType[] {
  const filename = path.basename(filePath)

  const libraryMatch = filePath.match(/library\/([^/]+)\//)
  if (libraryMatch) {
    const librarySection = libraryMatch[1]
    const sectionKey = libraryDirToSectionKey(librarySection)
    if (sectionKey) {
      const pdfs = SECTION_TO_PDF_MAP[sectionKey]
      if (pdfs && pdfs.length > 0) return pdfs
      if (pdfs && pdfs.length === 0) {
        console.log(
          `Library file ${filename} (section: ${sectionKey}) doesn't affect PDFs, skipping regeneration`,
        )
        return []
      }
    }
    console.warn(`Unknown library section: ${librarySection}, regenerating both PDFs`)
    return ['resume', 'cover']
  }

  const numberedFile = parseNumberedArrayFile(filename)
  if (numberedFile) {
    const pdfs = SECTION_TO_PDF_MAP[numberedFile.sectionKey]

    if (!pdfs) {
      console.warn(`Unknown section for numbered file: ${filename}, regenerating both PDFs`)
      return ['resume', 'cover']
    }

    if (pdfs.length === 0) {
      console.log(
        `Numbered file ${filename} (section: ${numberedFile.sectionKey}) doesn't affect PDFs, skipping regeneration`,
      )
      return []
    }

    return pdfs
  }

  const basename = path.basename(filename, path.extname(filename))

  for (const [sectionKey, filenames] of Object.entries(SECTION_KEY_TO_FILENAME)) {
    if (filenames.includes(basename)) {
      const pdfs = SECTION_TO_PDF_MAP[sectionKey]

      if (!pdfs) {
        console.warn(`Unknown section for file: ${basename}, regenerating both PDFs`)
        return ['resume', 'cover']
      }

      if (pdfs.length === 0) {
        console.log(
          `File ${basename} (section: ${sectionKey}) doesn't affect PDFs, skipping regeneration`,
        )
        return []
      }

      return pdfs
    }
  }

  console.warn(`Unknown file: ${basename}, regenerating both PDFs`)
  return ['resume', 'cover']
}
