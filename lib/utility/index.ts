/**
 * Frontend utility functions for resume management
 *
 * Core file management operations that interact with the backend API
 */

import { CVData } from "../../src/types";

/**
 * Extracts the correct data for copying based on yamlPath and parsedData (CVData)
 * Handles arrays, array items, and specific lines/bubbles within array items
 *
 * ALWAYS includes the llm object from parsedData if present, merging it with the extracted data.
 *
 * Data Flow:
 * 1. API (/api/directory/load) loads directory and returns CVData with llm field
 * 2. DirectoryManagerContext stores this as parsedData
 * 3. EditableField receives parsedData from context via useDirectoryManager()
 * 4. EditModal receives parsedData as a prop from EditableField
 * 5. extractCopyData receives parsedData and merges llm into the copied data
 */
export function extractCopyData(yamlPath: string, parsedData: CVData): unknown {
  console.log("[extractCopyData] yamlPath:", yamlPath);
  console.log("[extractCopyData] parsedData:", parsedData);
  console.log("[extractCopyData] parsedData.llm:", parsedData?.llm);
  if (!yamlPath || !parsedData) return undefined;
  const pathParts = yamlPath.split(".");
  // Helper to merge llm if present
  function withLLM(obj: unknown): unknown {
    console.log("[extractCopyData] withLLM called with obj:", obj);
    console.log("[extractCopyData] withLLM - parsedData.llm:", parsedData.llm);
    if (
      parsedData.llm &&
      obj &&
      typeof obj === "object" &&
      !Array.isArray(obj)
    ) {
      const result = { ...obj, llm: parsedData.llm };
      console.log("[extractCopyData] withLLM - returning with llm:", result);
      return result;
    }
    console.log("[extractCopyData] withLLM - returning without llm");
    return obj;
  }

  // Helper to get value at path for known arrays
  function getArrayField(field: keyof CVData) {
    return Array.isArray(parsedData[field]) ? parsedData[field] : undefined;
  }

  // Supported array fields
  const arrayFields: (keyof CVData)[] = [
    "workExperience",
    "projects",
    "technical",
    "education",
    "languages",
    "coverLetter",
    "careerSummary",
  ];

  // Case 1: Array (e.g., workExperience)
  if (
    arrayFields.includes(pathParts[0] as keyof CVData) &&
    pathParts.length === 1
  ) {
    const arr = getArrayField(pathParts[0] as keyof CVData);
    if (arr && parsedData.llm) {
      return { [pathParts[0]]: arr, llm: parsedData.llm };
    }
    return arr;
  }

  // Case 2: Array item or direct property (e.g., workExperience.0, workExperience.0.position)
  if (
    arrayFields.includes(pathParts[0] as keyof CVData) &&
    pathParts.length >= 2
  ) {
    const arr = getArrayField(pathParts[0] as keyof CVData) as unknown[];
    // Helper type guard for WorkExperience-like objects
    function isWorkExperienceLike(obj: unknown): obj is {
      position?: string;
      company?: string;
      location?: string;
      icon?: string;
      years?: string;
      lines?: unknown[];
      bubbles?: unknown[];
    } {
      return (
        !!obj &&
        typeof obj === "object" &&
        "position" in obj &&
        "company" in obj
      );
    }
    const idx = Number(pathParts[1]);
    if (!isNaN(idx) && arr && arr[idx]) {
      // If path is workExperience.0
      if (pathParts.length === 2) return withLLM(arr[idx]);
      // If path is workExperience.0.position, workExperience.0.company, etc.
      if (
        [
          "position",
          "company",
          "location",
          "icon",
          "years",
          "bubbles",
          "lines",
        ].includes(pathParts[2])
      ) {
        return withLLM(arr[idx]);
      }
      // If path is workExperience.0.lines.N or workExperience.0.bubbles.N or workExperience.0.lines.N.text
      if (
        (pathParts[2] === "lines" || pathParts[2] === "bubbles") &&
        (pathParts.length === 4 || pathParts.length === 5)
      ) {
        const key = pathParts[2];
        const lineIdx = Number(pathParts[3]);
        if (!isNaN(lineIdx) && isWorkExperienceLike(arr[idx])) {
          const item = arr[idx];
          const linesOrBubbles = (item as { [k: string]: unknown[] })[key];
          if (Array.isArray(linesOrBubbles)) {
            return withLLM({
              position: item.position,
              company: item.company,
              location: item.location,
              icon: item.icon,
              years: item.years,
              [key.slice(0, -1)]: linesOrBubbles[lineIdx],
            });
          }
        }
      }
    }
  }

  // Fallback: just return undefined (do not support arbitrary string indexing)
  return undefined;
}
