"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SingleColumnResume from "@/components/Resume/single-column/resume";
import type { CVData } from "@/types";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/src/components/SharedUIStates";

import { useDirectoryManager } from "@/contexts/DirectoryManager/DirectoryManagerContext.hook";

export default function DynamicSingleColumnMultiResumePage() {
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
    return <LoadingState message={`Loading directory: ${dirPath}...`} />;
  }

  const displayError = error || contextError;
  if (displayError) {
    return (
      <ErrorState
        title="Directory Not Found"
        message={displayError}
        path={dirPath}
        buttonText="Go to Default Resume"
        onButtonClickAction={() => router.push("/single-column/resume")}
      />
    );
  }

  if (!parsedData) {
    return (
      <EmptyState
        title="No Resume Data"
        message="The directory was found but contains no data files."
      />
    );
  }

  return (
    <div>
      <div className="sr-only">
        Currently displaying directory: {resolvedDirPath || dirPath}
      </div>
      <SingleColumnResume data={parsedData as CVData} />
    </div>
  );
}
