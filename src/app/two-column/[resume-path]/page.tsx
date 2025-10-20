"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import TwoColumnResume from "@/src/components/Resume/two-column/resume";
import type { CVData } from "@/src/types";
import { decodeFilePathFromUrl } from "@/src/utils/urlSafeEncoding";
import { useDirectoryManager } from "@/src/contexts/DirectoryManager/DirectoryManagerContext.hook";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/src/components/SharedUIStates";

export default function DynamicTwoColumnResumePage() {
  const params = useParams();
  const router = useRouter();
  const { parsedData, ensureResumeLoaded, loading, error, currentDirectory } =
    useDirectoryManager();

  const encodedResumePath = params?.["resume-path"] as string | undefined;
  const resumePath = encodedResumePath
    ? decodeFilePathFromUrl(encodedResumePath)
    : null;

  useEffect(() => {
    async function loadResume() {
      if (!resumePath) {
        return;
      }

      try {
        console.log("🔄 Ensuring resume loaded:", resumePath);
        await ensureResumeLoaded(resumePath);
      } catch (err) {
        console.error("Error loading dynamic resume:", err);
      }
    }

    loadResume();
  }, [resumePath, ensureResumeLoaded]);

  if (loading) {
    return (
      <LoadingState
        message={`Loading two-column resume: ${resumePath || encodedResumePath}...`}
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Resume Not Found"
        message={error}
        buttonText="Go to Default Resume"
        onButtonClickAction={() => router.push("/two-column/resume")}
      />
    );
  }

  if (!parsedData) {
    return (
      <EmptyState
        title="No Resume Data"
        message="The resume file was found but contains no data."
      />
    );
  }

  return (
    <div>
      <div className="sr-only">
        Currently displaying resume:{" "}
        {currentDirectory || resumePath || encodedResumePath}
      </div>
      <TwoColumnResume data={parsedData as CVData} />
    </div>
  );
}
