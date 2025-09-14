"use client";

import { useEffect, useState } from "react";
import TwoColumnCoverLetter from "../../../src/components/Resume/two-column/cover-letter";
import {
  useYamlData,
  useResumeContext,
} from "../../../src/contexts/ResumeContext";
import { decodeFilePathFromUrl } from "../../../src/utils/urlSafeEncoding";
import * as yaml from "js-yaml";
import type { CVData } from "../../../src/types";

interface TwoColumnCoverLetterPageClientProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function TwoColumnCoverLetterPageClient({
  searchParams,
}: TwoColumnCoverLetterPageClientProps) {
  const { yamlContent, parsedData } = useYamlData();
  const {
    loadResumeFile,
    loadAvailableFiles,
    availableFiles,
    currentResumeFile,
  } = useResumeContext();
  const [resumeData, setResumeData] = useState<CVData | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Extract resume path from server-side searchParams
  const resumeParam =
    typeof searchParams.resume === "string" ? searchParams.resume : null;
  const resumePath = resumeParam ? decodeFilePathFromUrl(resumeParam) : null;

  // Initialize resume loading from server-side searchParams
  useEffect(() => {
    const initializeResume = async () => {
      try {
        // Load available files first if not already loaded
        if (!availableFiles) {
          await loadAvailableFiles();
        }

        // If we have a resume path from URL and it's different from current
        if (resumePath && resumePath !== currentResumeFile) {
          console.log("Loading resume from server searchParams:", resumePath);
          await loadResumeFile(resumePath);
        }
      } catch (error) {
        console.error("Failed to initialize resume from searchParams:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeResume();
  }, [
    resumePath,
    currentResumeFile,
    availableFiles,
    loadAvailableFiles,
    loadResumeFile,
  ]);

  // Update resume data when YAML content changes
  useEffect(() => {
    if (parsedData) {
      setResumeData(parsedData as CVData);
    } else if (yamlContent) {
      try {
        const parsed = yaml.load(yamlContent) as CVData;
        setResumeData(parsed);
      } catch (error) {
        console.error("Error parsing YAML:", error);
        // Keep existing data if parsing fails
      }
    }
  }, [yamlContent, parsedData]);

  // Show loading state while initializing or waiting for data
  if (isInitializing || !resumeData) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isInitializing
              ? "Initializing..."
              : "Loading cover letter data..."}
          </p>
          {resumePath && (
            <p className="text-sm text-gray-500 mt-2">Loading: {resumePath}</p>
          )}
        </div>
      </div>
    );
  }

  return <TwoColumnCoverLetter data={resumeData} />;
}
