"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import TwoColumnResume from "../../../../src/components/Resume/two-column/resume";
import type { CVData } from "../../../../src/types";
import { listAllResumeFiles } from "../../../../lib/utility";
import { decodeFilePathFromUrl } from "../../../../src/utils/urlSafeEncoding";
import { useFileManager } from "../../../../src/contexts/FileManagerContext";

export default function DynamicTwoColumnResumePage() {
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

        const filesResponse = await listAllResumeFiles();

        if (!filesResponse.success || !filesResponse.data) {
          throw new Error("Failed to fetch available resume files");
        }

        const { allFiles } = filesResponse.data;

        let fileToLoad = null;

        if (allFiles.includes(resumePath)) {
          fileToLoad = resumePath;
        } else if (
          !resumePath.endsWith(".yml") &&
          !resumePath.endsWith(".yaml")
        ) {
          const withExtension = `${resumePath}.yml`;
          if (allFiles.includes(withExtension)) {
            fileToLoad = withExtension;
          }
        } else if (
          resumePath.endsWith(".yml") ||
          resumePath.endsWith(".yaml")
        ) {
          const withoutExtension = resumePath.replace(/\.(yml|yaml)$/i, "");
          if (allFiles.includes(withoutExtension)) {
            fileToLoad = withoutExtension;
          }
        }

        if (!fileToLoad) {
          throw new Error(
            `Resume file not found: ${resumePath}. Available files: ${allFiles.join(", ")}`,
          );
        }

        console.log("🔄 Loading resume file:", fileToLoad);
        await loadFile(fileToLoad);
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
  }, [encodedResumePath, resumePath, loadFile]);

  if (loading || contextLoading) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 dark:border-primary-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading two-column resume: {resumePath || encodedResumePath}...
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
            Resume Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {displayError}
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
            The resume file was found but contains no data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sr-only">
        Currently displaying resume:{" "}
        {resolvedFilePath || resumePath || encodedResumePath}
      </div>
      <TwoColumnResume data={parsedData as CVData} />
    </div>
  );
}
