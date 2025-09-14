import { describe, test, expect } from 'vitest';
import {
    encodeFilePathForUrl,
    decodeFilePathFromUrl,
    createUrlWithResumePath,
    getResumePathFromUrl
} from '../src/utils/urlSafeEncoding';

describe('URL Safe Encoding Utilities', () => {
    test('encodeFilePathForUrl removes file extension and converts slashes', () => {
        const testPath = 'resumes/software-engineer/google/2025-01-15/data.yml';
        const encoded = encodeFilePathForUrl(testPath);
        expect(encoded).toBe('resumes-ashes-software-engineer-ashes-google-ashes-2025-01-15-ashes-data');
    });

    test('decodeFilePathFromUrl restores original path with .yml extension', () => {
        const encodedPath = 'resumes-ashes-software-engineer-ashes-google-ashes-2025-01-15-ashes-data';
        const decoded = decodeFilePathFromUrl(encodedPath);
        expect(decoded).toBe('resumes/software-engineer/google/2025-01-15/data.yml');
    });

    test('round trip encoding/decoding preserves original path', () => {
        const originalPaths = [
            'data.yml',
            'resumes/frontend/data.yml',
            'resumes/software-engineer/google/2025-01-15/data.yml',
            'simple-file.yaml'
        ];

        originalPaths.forEach(path => {
            const encoded = encodeFilePathForUrl(path);
            const decoded = decodeFilePathFromUrl(encoded);
            expect(decoded).toBe(path.endsWith('.yaml') ? path : path);
        });
    });

    test('createUrlWithResumePath creates correct URL', () => {
        const basePath = '/single-column/resume';
        const resumePath = 'resumes/software-engineer/google/2025-01-15/data.yml';
        const url = createUrlWithResumePath(basePath, resumePath);
        expect(url).toBe('/single-column/resume?resume=resumes-ashes-software-engineer-ashes-google-ashes-2025-01-15-ashes-data');
    });

    test('getResumePathFromUrl extracts path from URLSearchParams', () => {
        const searchParams = new URLSearchParams('resume=resumes-ashes-software-engineer-ashes-google-ashes-2025-01-15-ashes-data');
        const path = getResumePathFromUrl(searchParams);
        expect(path).toBe('resumes/software-engineer/google/2025-01-15/data.yml');
    });

    test('handles empty and null values gracefully', () => {
        expect(encodeFilePathForUrl('')).toBe('');
        expect(decodeFilePathFromUrl('')).toBe('');

        const emptySearchParams = new URLSearchParams();
        expect(getResumePathFromUrl(emptySearchParams)).toBe(null);
    });

    test('handles yaml extension correctly', () => {
        const yamlPath = 'resumes/frontend/data.yaml';
        const encoded = encodeFilePathForUrl(yamlPath);
        const decoded = decodeFilePathFromUrl(encoded);
        expect(decoded).toBe('resumes/frontend/data.yaml');
    });

    test('handles paths without extension', () => {
        const pathWithoutExt = 'resumes/frontend/data';
        const encoded = encodeFilePathForUrl(pathWithoutExt);
        const decoded = decodeFilePathFromUrl(encoded);
        expect(decoded).toBe('resumes/frontend/data.yml');
    });
});
