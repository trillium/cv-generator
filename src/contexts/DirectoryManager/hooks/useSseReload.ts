"use client";

import { useCallback, useEffect } from "react";
import type { DirectoryLoadResult } from "@/types/multiFileManager.types";

const SELF_UPDATE_DEBOUNCE_MS = 2000;

export function useSseReload(
  currentResumeKey: string | null,
  recentUpdateTimestamp: number | null,
  setAllResumes: React.Dispatch<
    React.SetStateAction<Record<string, DirectoryLoadResult>>
  >,
) {
  const handleReloadEvent = useCallback(
    async (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "connected") return;

        const changedPath = payload.path;

        if (!currentResumeKey) return;

        const now = Date.now();
        const timeSinceLastUpdate = recentUpdateTimestamp
          ? now - recentUpdateTimestamp
          : Infinity;

        if (timeSinceLastUpdate < SELF_UPDATE_DEBOUNCE_MS) return;

        const normalizedResumeKey = currentResumeKey.replace(/^resumes\//, "");
        const shouldReload =
          changedPath.startsWith(normalizedResumeKey) ||
          changedPath.startsWith(currentResumeKey);

        if (shouldReload) {
          try {
            const response = await fetch(
              `/api/directory/load?path=${encodeURIComponent(currentResumeKey)}`,
            );
            const result = await response.json();

            if (result.success) {
              setAllResumes((prev) => ({
                ...prev,
                [currentResumeKey]: {
                  data: result.data,
                  sources: result.sources,
                  metadata: result.metadata,
                  pdfMetadata: result.pdfMetadata,
                  validationErrors: result.validationErrors,
                },
              }));
            }
          } catch (err) {
            console.error("[Reload] Failed to reload:", err);
          }
        }
      } catch (err) {
        console.error("[Reload] Error handling SSE event:", err);
      }
    },
    [currentResumeKey, recentUpdateTimestamp, setAllResumes],
  );

  useEffect(() => {
    const eventSource = new EventSource("/api/directory/reload");

    eventSource.onmessage = handleReloadEvent;

    eventSource.onerror = (err) => {
      console.error("[Reload] SSE connection error:", err);
    };

    return () => {
      eventSource.close();
    };
  }, [handleReloadEvent]);
}
