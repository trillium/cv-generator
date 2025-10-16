"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TwoColumnResume from "@/components/Resume/two-column/resume";
import type { CVData } from "@/types";

import { useDirectoryManager } from "@/contexts/DirectoryManager/DirectoryManagerContext.hook";

export default function DynamicTwoColumnMultiResumePage() {
  const params = useParams();
  const router = useRouter();
  const {
    parsedData,
    loadDirectory,
    loading: contextLoading,
    error: contextError,
  } = useDirectoryManager();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedDirPath, setResolvedDirPath] = useState<string | null>(null);

  // Extract directory path from params - catch-all route returns an array
  const resumePathSegments = params?.["resume-path"] as string[] | undefined;
  const dirPath = resumePathSegments ? resumePathSegments.join("/") : undefined;

  useEffect(() => {
    async function validateAndLoadResume() {
      if (!dirPath) {
        setError("No directory path provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load directory instead of file
        await loadDirectory(dirPath);
        setResolvedDirPath(dirPath);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : `Failed to load directory: ${dirPath}`;
        setError(errorMessage);
        console.error("Error loading directory:", err);
      } finally {
        setLoading(false);
      }
    }

    validateAndLoadResume();
  }, [dirPath, loadDirectory]);

  if (loading || contextLoading) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 dark:border-primary-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading directory: {dirPath}...
          </p>
        </div>
      </div>
    );
  }

  const displayError = error || contextError;
  if (displayError) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            Directory Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-wrap">
            {displayError}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Path attempted:{" "}
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {dirPath}
            </code>
          </p>
          <button
            onClick={() => router.push("/two-column/resume")}
            className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
          >
            Go to Default Resume
          </button>
        </div>
      </div>
    );
  }

  if (!parsedData) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
            No Resume Data
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            The directory was found but contains no data files.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sr-only">
        Currently displaying directory: {resolvedDirPath || dirPath}
      </div>
      <TwoColumnResume data={parsedData as CVData} />
    </div>
  );
}
