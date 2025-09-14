/**
 * Utility functions for safely encoding/decoding file paths in URLs
 * Converts slashes to a safe separator for URL search parameters
 */

const SEPARATOR = '-ashes-'; // Safe replacement for slashes

/**
 * Encode a file path for safe use in URL search parameters
 * @param filePath - The file path to encode (e.g., "resumes/software-engineer/google/2025-01-15/data.yml")
 * @returns Encoded string safe for URLs (e.g., "resumes-ashes-software-engineer-ashes-google-ashes-2025-01-15-ashes-data")
 */
export function encodeFilePathForUrl(filePath: string): string {
    if (!filePath) return '';

    // Remove .yml or .yaml extension since it's assumed
    const pathWithoutExtension = filePath.replace(/\.(yml|yaml)$/i, '');

    return pathWithoutExtension.replace(/\//g, SEPARATOR); // Replace slashes
}

/**
 * Decode a URL-safe file path back to its original form
 * @param encodedPath - The encoded path from URL (e.g., "resumes-ashes-software-engineer-ashes-google-ashes-2025-01-15-ashes-data")
 * @returns Original file path (e.g., "resumes/software-engineer/google/2025-01-15/data.yml")
 */
export function decodeFilePathFromUrl(encodedPath: string): string {
    if (!encodedPath) return '';

    const decodedPath = encodedPath.replace(new RegExp(SEPARATOR, 'g'), '/'); // Replace separators with slashes

    // Add .yml extension since it's assumed
    return decodedPath.endsWith('.yml') || decodedPath.endsWith('.yaml')
        ? decodedPath
        : `${decodedPath}.yml`;
}

/**
 * Update the current URL with a new resume path parameter
 * @param resumePath - The resume file path to encode and add to URL
 * @param router - Next.js router instance
 * @param pathname - Current pathname
 */
export function updateUrlWithResumePath(
    resumePath: string,
    router: any,
    pathname: string
): void {
    const encodedPath = encodeFilePathForUrl(resumePath);
    const searchParams = new URLSearchParams(window.location.search);

    if (encodedPath) {
        searchParams.set('resume', encodedPath);
    } else {
        searchParams.delete('resume');
    }

    const newUrl = `${pathname}?${searchParams.toString()}`;
    router.replace(newUrl, { scroll: false });
}

/**
 * Get the resume path from current URL search parameters
 * @param searchParams - URL search parameters
 * @returns Decoded file path or null if not found
 */
export function getResumePathFromUrl(searchParams: URLSearchParams): string | null {
    const encodedPath = searchParams.get('resume');
    return encodedPath ? decodeFilePathFromUrl(encodedPath) : null;
}

/**
 * Create a URL with the resume path parameter
 * @param basePath - Base path (e.g., "/single-column/resume")
 * @param resumePath - Resume file path to encode
 * @returns Full URL with resume parameter
 */
export function createUrlWithResumePath(basePath: string, resumePath: string): string {
    const encodedPath = encodeFilePathForUrl(resumePath);
    return `${basePath}?resume=${encodedPath}`;
}
