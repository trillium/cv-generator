"use client";

import { useState, useCallback } from "react";
import type { PdfJobState } from "../DirectoryManagerContext";

const MAX_POLL_ATTEMPTS = 60;
const POLL_INTERVAL_MS = 1000;

export function usePdfPolling(
  currentDirectory: string | null,
  loadDirectory: (path: string) => Promise<void>,
) {
  const [pdfJobs, setPdfJobs] = useState<PdfJobState[]>([]);

  const pollPdfStatus = useCallback(
    async (jobId: string) => {
      let attempts = 0;

      const poll = async (): Promise<void> => {
        if (attempts >= MAX_POLL_ATTEMPTS) {
          setPdfJobs((prev) =>
            prev.map((job) =>
              job.jobId === jobId ? { ...job, status: "failed" as const } : job,
            ),
          );
          return;
        }

        try {
          const response = await fetch(`/api/pdf/status?jobId=${jobId}`);

          if (response.status === 404) {
            setPdfJobs((prev) => prev.filter((job) => job.jobId !== jobId));
            return;
          }

          const result = await response.json();

          if (!result.success) {
            setPdfJobs((prev) =>
              prev.map((job) =>
                job.jobId === jobId
                  ? { ...job, status: "failed" as const }
                  : job,
              ),
            );
            return;
          }

          const { job } = result;

          if (!job) return;

          if (job.status === "complete") {
            setPdfJobs((prev) =>
              prev.map((j) =>
                j.jobId === jobId ? { ...j, status: "complete" as const } : j,
              ),
            );

            if (currentDirectory) {
              await loadDirectory(currentDirectory);
            }

            return;
          }

          if (job.status === "failed") {
            setPdfJobs((prev) =>
              prev.map((j) =>
                j.jobId === jobId ? { ...j, status: "failed" as const } : j,
              ),
            );
            return;
          }

          attempts++;
          setTimeout(poll, POLL_INTERVAL_MS);
        } catch {
          setPdfJobs((prev) =>
            prev.map((job) =>
              job.jobId === jobId ? { ...job, status: "failed" as const } : job,
            ),
          );
        }
      };

      await poll();
    },
    [currentDirectory, loadDirectory],
  );

  const addPdfJob = useCallback(
    (jobId: string, pdfTypes: string[]) => {
      setPdfJobs((prev) => [
        ...prev,
        { jobId, pdfTypes, status: "processing" },
      ]);
      pollPdfStatus(jobId);
    },
    [pollPdfStatus],
  );

  return { pdfJobs, addPdfJob };
}
