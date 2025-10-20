"use client";

import { useDirectoryManager } from "@/contexts/DirectoryManager/DirectoryManagerContext.hook";
import type { PrintPageSizeProps } from "./PrintPageSize.constants";

export default function PrintPageSize({
  pdfType = "resume",
}: PrintPageSizeProps) {
  const { pdfJobs, storedPdfMetadata } = useDirectoryManager();

  console.log("PrintPageSize DEBUG:", {
    pdfType,
    storedPdfMetadata,
    hasPdfKey: storedPdfMetadata?.pdf !== undefined,
    resumeData: storedPdfMetadata?.pdf?.resume,
    coverLetterData: storedPdfMetadata?.pdf?.coverLetter,
  });

  const currentPdfJob = pdfJobs.find(
    (job) =>
      job.pdfTypes.includes(pdfType) &&
      (job.status === "processing" || job.status === "complete"),
  );

  const isGenerating = currentPdfJob?.status === "processing";
  const storedMetadata =
    storedPdfMetadata?.pdf?.[pdfType as "resume" | "coverLetter"];

  const pageCount = storedMetadata?.pages;
  const hasPdfMetadata = pageCount !== undefined;

  return (
    <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600">
      <svg
        className="w-4 h-4 text-gray-500 dark:text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <span className="font-medium">
        {isGenerating ? (
          <span className="text-blue-500 dark:text-blue-400">
            Generating...
          </span>
        ) : !hasPdfMetadata ? (
          <span className="text-red-500 dark:text-red-400">PDF missing</span>
        ) : (
          <>
            {pageCount} page{pageCount !== 1 ? "s" : ""}
          </>
        )}
      </span>
    </div>
  );
}
