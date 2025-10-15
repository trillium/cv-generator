"use client";

import { useEffect, useState } from "react";
import SingleColumnResume from "@/components/Resume/single-column/resume";
import { useDirectoryManager } from "@/contexts/DirectoryManagerContext.hook";
import type { CVData } from "@/types";

interface SingleColumnResumePageClientProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function SingleColumnResumePageClient({
  searchParams,
}: SingleColumnResumePageClientProps) {
  const { parsedData, loadDirectory, currentDirectory } = useDirectoryManager();
  const [resumeData, setResumeData] = useState<CVData | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Get directory path from search params, default to 'base'
  const dirParam =
    typeof searchParams.dir === "string" ? searchParams.dir : "base";

  useEffect(() => {
    const initializeResume = async () => {
      try {
        if (dirParam && dirParam !== currentDirectory) {
          console.log("Loading directory:", dirParam);
          await loadDirectory(dirParam);
        } else if (!currentDirectory) {
          // Load default directory if none loaded
          console.log("Loading default directory: base");
          await loadDirectory("base");
        }
      } catch (error) {
        console.error("Failed to initialize resume from directory:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeResume();
  }, [dirParam, currentDirectory, loadDirectory]);

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
          {dirParam && (
            <p className="text-sm text-gray-500 mt-2">Loading: {dirParam}</p>
          )}
        </div>
      </div>
    );
  }

  return <SingleColumnResume data={resumeData} />;
}
