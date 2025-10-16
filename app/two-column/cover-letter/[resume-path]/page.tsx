"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import TwoColumnCoverLetter from "../../../../src/components/Resume/two-column/cover-letter";
import { decodeFilePathFromUrl } from "../../../../src/utils/urlSafeEncoding";
import { useDirectoryManager } from "../../../../src/contexts/DirectoryManagerContext.hook";

export default function DynamicTwoColumnCoverLetterPage() {
  const params = useParams();
  const router = useRouter();
  const { parsedData, ensureResumeLoaded, loading, error, currentDirectory } =
    useDirectoryManager();

  const encodedResumePath = params?.["resume-path"] as string | undefined;
  const resumePath = encodedResumePath
    ? decodeFilePathFromUrl(encodedResumePath)
    : null;

  useEffect(() => {
    async function loadCoverLetter() {
      if (!resumePath) {
        return;
      }

      try {
        console.log("🔄 Ensuring cover letter loaded:", resumePath);
        await ensureResumeLoaded(resumePath);
      } catch (err) {
        console.error("Error loading dynamic cover letter:", err);
      }
    }

    loadCoverLetter();
  }, [resumePath, ensureResumeLoaded]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading two-column cover letter: {resumePath || encodedResumePath}
            ...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            Cover Letter Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => router.push("/two-column/cover-letter")}
            className="bg-blue-500 dark:bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-800 transition-colors"
          >
            Go to Default Cover Letter
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
      <div className="sr-only">
        Currently displaying cover letter:{" "}
        {currentDirectory || resumePath || encodedResumePath}
      </div>
      <TwoColumnCoverLetter data={parsedData} />
    </div>
  );
}
