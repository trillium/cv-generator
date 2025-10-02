"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SingleColumnCoverLetter from "../../../../src/components/Resume/single-column/cover-letter";
import { listAllResumeFiles } from "../../../../lib/utility";
import { decodeFilePathFromUrl } from "../../../../src/utils/urlSafeEncoding";
import { useFileManager } from "../../../../src/contexts/FileManagerContext";

export default function DynamicSingleColumnCoverLetterPage() {
  const params = useParams();
  const router = useRouter();
  const {
    parsedData,
    loadFile,
    loading: contextLoading,
    error: contextError,
  } = useFileManager();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedFilePath, setResolvedFilePath] = useState<string | null>(null);

  // Extract resume path from params and decode it
  const encodedResumePath = params["resume-path"] as string;
  const resumePath = encodedResumePath
    ? decodeFilePathFromUrl(encodedResumePath)
    : null;

  useEffect(() => {
    async function validateAndLoadResume() {
      if (!resumePath) {
        setError("No cover letter path provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First, validate that the cover letter data exists
        const filesResponse = await listAllResumeFiles();

        if (!filesResponse.success || !filesResponse.data) {
          throw new Error("Failed to fetch available resume files");
        }

        const { allFiles } = filesResponse.data;

        // Check if the requested resume path exists in the available files
        // Support both exact matches and partial matches
        const possiblePaths = [
          resumePath,
          resumePath.endsWith(".yml") ? resumePath.slice(0, -4) : resumePath,
          resumePath.endsWith(".yml") ? resumePath : `${resumePath}.yml`,
        ];

        const validPath = possiblePaths.find((path) =>
          allFiles.some(
            (file) =>
              file === path ||
              file.endsWith(`/${path}`) ||
              // Handle nested paths properly (e.g., resumes/software-engineer/data.yml)
              file.includes(path),
          ),
        );

        if (!validPath) {
          throw new Error(
            `Cover letter file not found: ${encodedResumePath} (decoded: ${resumePath}). Available files: ${allFiles.join(", ")}`,
          );
        }

        // Determine the actual file path to load
        const fileToLoad = allFiles.find(
          (file) =>
            file === validPath ||
            file.endsWith(`/${validPath}`) ||
            file === `${validPath}.yml` ||
            file.endsWith(`/${validPath}.yml`) ||
            file.includes(validPath),
        );

        if (!fileToLoad) {
          throw new Error(
            `Could not resolve file path for: ${encodedResumePath} (decoded: ${resumePath})`,
          );
        }

        // Use ResumeContext to load the file - this will handle all the data management
        console.log(
          "🔄 Loading cover letter file through ResumeContext:",
          fileToLoad,
        );
        await loadFile(fileToLoad);
        setResolvedFilePath(fileToLoad);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : `Failed to load cover letter: ${encodedResumePath} (decoded: ${resumePath})`;
        setError(errorMessage);
        console.error("Error loading dynamic cover letter:", err);
      } finally {
        setLoading(false);
      }
    }

    validateAndLoadResume();
  }, [encodedResumePath, resumePath, loadFile]); // Listen to both encoded and decoded paths

  // Loading state - combine local loading and context loading
  if (loading || contextLoading) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading cover letter: {resumePath || encodedResumePath}...
          </p>
        </div>
      </div>
    );
  }

  // Error state - check both local and context errors
  const displayError = error || contextError;
  if (displayError) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            Cover Letter Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {displayError}
          </p>
          <button
            onClick={() => router.push("/single-column/cover-letter")}
            className="bg-blue-500 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-800 transition-colors"
          >
            Go to Default Cover Letter
          </button>
        </div>
      </div>
    );
  }

  // Success state - render the cover letter using ResumeContext data
  if (!parsedData) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
            No Cover Letter Data
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            The cover letter file was found but contains no data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Optional: Show which cover letter is being displayed */}
      <div className="sr-only">
        Currently displaying cover letter:{" "}
        {resolvedFilePath || resumePath || encodedResumePath}
      </div>
      <SingleColumnCoverLetter data={parsedData} />
    </div>
  );
}
