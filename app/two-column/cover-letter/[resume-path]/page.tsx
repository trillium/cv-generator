"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import TwoColumnCoverLetter from "@/src/components/Resume/two-column/cover-letter";
import { decodeFilePathFromUrl } from "@/src/utils/urlSafeEncoding";
import { useDirectoryManager } from "@/src/contexts/DirectoryManager/DirectoryManagerContext.hook";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/src/components/SharedUIStates";

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
      <LoadingState
        message={`Loading two-column cover letter: ${resumePath || encodedResumePath}...`}
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Cover Letter Not Found"
        message={error}
        buttonText="Go to Default Cover Letter"
        onButtonClickAction={() => router.push("/two-column/cover-letter")}
      />
    );
  }

  if (!parsedData) {
    return (
      <EmptyState
        title="No Cover Letter Data"
        message="The cover letter file was found but contains no data."
      />
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
