/**
 * Frontend utility functions for resume management
 *
 * Core file management operations that interact with the backend API
 */

import { CVData } from "../../src/types";

/**
 * Extracts the correct data for copying based on yamlPath and parsedData (CVData)
 * Handles arrays, array items, and specific lines/bubbles within array items
 */
export function extractCopyData(yamlPath: string, parsedData: CVData): unknown {
  if (!yamlPath || !parsedData) return undefined;
  const pathParts = yamlPath.split(".");

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
    return getArrayField(pathParts[0] as keyof CVData);
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
      if (pathParts.length === 2) return arr[idx];
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
        return arr[idx];
      }
      // If path is workExperience.0.lines.N or workExperience.0.bubbles.N
      if (
        (pathParts[2] === "lines" || pathParts[2] === "bubbles") &&
        pathParts.length === 4
      ) {
        const key = pathParts[2];
        const lineIdx = Number(pathParts[3]);
        if (!isNaN(lineIdx) && isWorkExperienceLike(arr[idx])) {
          const item = arr[idx];
          const linesOrBubbles = (item as { [k: string]: unknown[] })[key];
          if (Array.isArray(linesOrBubbles)) {
            return {
              position: item.position,
              company: item.company,
              location: item.location,
              icon: item.icon,
              years: item.years,
              [key.slice(0, -1)]: linesOrBubbles[lineIdx],
            };
          }
        }
      }
    }
  }

  // Fallback: just return undefined (do not support arbitrary string indexing)
  return undefined;
}
