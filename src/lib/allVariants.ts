import { resumeComponentMap } from "../routes/$resumeType.resume";
import { coverLetterComponentMap } from "../routes/$resumeType.cover-letter";

/**
 * allVariants: all unique resume/cover-letter types available in the app.
 */
export const allVariants = Array.from(
  new Set([
    ...Object.keys(resumeComponentMap),
    ...Object.keys(coverLetterComponentMap),
  ]),
);
