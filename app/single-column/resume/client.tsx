"use client";

import { useEffect, useState } from "react";
import SingleColumnResume from "../../../src/components/Resume/single-column/resume";
import { useFileManager } from "../../../src/contexts/FileManagerContext";
import { decodeFilePathFromUrl } from "../../../src/utils/urlSafeEncoding";
import type { CVData } from "../../../src/types";

interface SingleColumnResumePageClientProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function SingleColumnResumePageClient({
  searchParams,
}: SingleColumnResumePageClientProps) {
  const { parsedData, loadFile, currentFile } = useFileManager();
  const [resumeData, setResumeData] = useState<CVData | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const fileParam =
    typeof searchParams.file === "string" ? searchParams.file : null;
  const resumeParam =
    typeof searchParams.resume === "string" ? searchParams.resume : null;

  const rawPath = fileParam || resumeParam;
  const resumePath = rawPath ? decodeFilePathFromUrl(rawPath) : null;

  useEffect(() => {
    const initializeResume = async () => {
      try {
        if (resumePath && resumePath !== currentFile?.path) {
          console.log("Loading resume from server searchParams:", resumePath);
          await loadFile(resumePath);
        }
      } catch (error) {
        console.error("Failed to initialize resume from searchParams:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeResume();
  }, [resumePath, currentFile?.path, loadFile]);

  useEffect(() => {
    if (parsedData) {
      setResumeData(parsedData as CVData);
    }
  }, [parsedData]);

  if (isInitializing || !resumeData) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isInitializing ? "Initializing..." : "Loading resume data..."}
          </p>
          {resumePath && (
            <p className="text-sm text-gray-500 mt-2">Loading: {resumePath}</p>
          )}
        </div>
      </div>
    );
  }

  return <SingleColumnResume data={resumeData} />;
}
