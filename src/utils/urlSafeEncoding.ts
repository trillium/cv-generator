/**
 * Utility functions for safely encoding/decoding file paths in URLs
 * Converts slashes to a safe separator for URL search parameters
 * This ensures file paths like "resumes/software-engineer/data.yml" can be safely used in URLs
 */

const URL_SAFE_SEPARATOR = "-slash-"; // Safe replacement for forward slashes in file paths

/**
 * Encode a file path for safe use in URL search parameters
 * @param filePath - The file path to encode (e.g., "resumes/software-engineer/data.yml")
 * @returns Encoded string safe for URLs (e.g., "resumes-slash-software-engineer-slash-data.yml")
 * @example encodeFilePathForUrl("resumes/software-engineer/data.yml") // "resumes-slash-software-engineer-slash-data.yml"
 */
export function encodeFilePathForUrl(filePath: string): string {
  if (!filePath) return "";

  // Replace all forward slashes with the safe separator
  return filePath.replace(/\//g, URL_SAFE_SEPARATOR);
}

/**
 * Decode a URL-safe file path back to its original form
 * @param encodedPath - The encoded path from URL (e.g., "resumes-slash-software-engineer-slash-data.yml")
 * @returns Original file path (e.g., "resumes/software-engineer/data.yml")
 * @example decodeFilePathFromUrl("resumes-slash-software-engineer-slash-data.yml") // "resumes/software-engineer/data.yml"
 */
export function decodeFilePathFromUrl(encodedPath: string): string {
  if (!encodedPath) return "";

  // Replace the safe separators back with forward slashes
  return encodedPath.replace(new RegExp(URL_SAFE_SEPARATOR, "g"), "/");
}

/**
 * Update the current URL with a new resume path parameter
 * @param resumePath - The resume file path to encode and add to URL (e.g., "resumes/software-engineer/data.yml")
 * @param router - Next.js router instance
 * @param pathname - Current pathname
 * @example updateUrlWithResumePath("resumes/software-engineer/data.yml", router, "/single-column/resume")
 */
export function updateUrlWithResumePath(
  resumePath: string,
  router: any,
  pathname: string,
): void {
  const encodedPath = encodeFilePathForUrl(resumePath);
  const searchParams = new URLSearchParams(window.location.search);

  if (encodedPath) {
    searchParams.set("resume", encodedPath);
  } else {
    searchParams.delete("resume");
  }

  const newUrl = `${pathname}?${searchParams.toString()}`;
  router.replace(newUrl, { scroll: false });
}

/**
 * Get the resume path from current URL search parameters
 * @param searchParams - URL search parameters
 * @returns Decoded file path or null if not found (e.g., "resumes/software-engineer/data.yml")
 * @example getResumePathFromUrl(searchParams) // "resumes/software-engineer/data.yml"
 */
export function getResumePathFromUrl(
  searchParams: URLSearchParams,
): string | null {
  const encodedPath = searchParams.get("resume");
  return encodedPath ? decodeFilePathFromUrl(encodedPath) : null;
}

/**
 * Create a URL with the resume path parameter
 * @param basePath - Base path (e.g., "/single-column/resume")
 * @param resumePath - Resume file path to encode (e.g., "resumes/software-engineer/data.yml")
 * @returns Full URL with resume parameter (e.g., "/single-column/resume?resume=resumes-slash-software-engineer-slash-data.yml")
 * @example createUrlWithResumePath("/single-column/resume", "resumes/software-engineer/data.yml") // "/single-column/resume?resume=resumes-slash-software-engineer-slash-data.yml"
 */
export function createUrlWithResumePath(
  basePath: string,
  resumePath: string,
): string {
  const encodedPath = encodeFilePathForUrl(resumePath);
  return `${basePath}?resume=${encodedPath}`;
}
