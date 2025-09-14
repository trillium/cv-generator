"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SingleColumnResume from "../../../../src/components/Resume/single-column/resume";
import type { CVData } from "../../../../src/types";
import { listAllResumeFiles } from "../../../../lib/utility";
import { decodeFilePathFromUrl } from "../../../../src/utils/urlSafeEncoding";
import { useResumeContext } from "../../../../src/contexts/ResumeContext";

export default function DynamicSingleColumnResumePage() {
  const params = useParams();
  const router = useRouter();
  const {
    currentResume,
    loadResumeFile,
    loading: contextLoading,
    error: contextError,
  } = useResumeContext();

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
        setError("No resume path provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First, validate that the resume path exists
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
            `Resume file not found: ${encodedResumePath} (decoded: ${resumePath}). Available files: ${allFiles.join(", ")}`,
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
          "🔄 Loading resume file through ResumeContext:",
          fileToLoad,
        );
        await loadResumeFile(fileToLoad);
        setResolvedFilePath(fileToLoad);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : `Failed to load resume: ${encodedResumePath} (decoded: ${resumePath})`;
        setError(errorMessage);
        console.error("Error loading dynamic resume:", err);
      } finally {
        setLoading(false);
      }
    }

    validateAndLoadResume();
  }, [encodedResumePath, resumePath, loadResumeFile]); // Listen to both encoded and decoded paths

  // Loading state - combine local loading and context loading
  if (loading || contextLoading) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Loading resume: {resumePath || encodedResumePath}...
          </p>
        </div>
      </div>
    );
  }

  // Error state - check both local and context errors
  const displayError = error || contextError;
  if (displayError) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Resume Not Found
          </h1>
          <p className="text-gray-600 mb-4">{displayError}</p>
          <button
            onClick={() => router.push("/single-column/resume")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Go to Default Resume
          </button>
        </div>
      </div>
    );
  }

  // Success state - render the resume using ResumeContext data
  if (!currentResume) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-yellow-600 mb-2">
            No Resume Data
          </h1>
          <p className="text-gray-600">
            The resume file was found but contains no data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Optional: Show which resume is being displayed */}
      <div className="sr-only">
        Currently displaying resume:{" "}
        {resolvedFilePath || resumePath || encodedResumePath}
      </div>
      <SingleColumnResume data={currentResume} />
    </div>
  );
}
