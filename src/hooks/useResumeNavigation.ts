"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useResumeContext } from "../contexts/ResumeContext";
import { encodeFilePathForUrl } from "../utils/urlSafeEncoding";

/**
 * Hook for navigating to different resumes via URL parameters
 * This version works with server-side searchParams and avoids rerender loops
 */
export function useResumeNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { loadResumeFile } = useResumeContext();

  // Function to switch to a different resume and update URL
  const navigateToResume = useCallback(
    async (resumePath: string) => {
      try {
        // First load the resume in the context
        await loadResumeFile(resumePath);

        // Then update the URL
        const encodedPath = encodeFilePathForUrl(resumePath);
        const searchParams = new URLSearchParams(window.location.search);

        if (encodedPath) {
          searchParams.set("resume", encodedPath);
        } else {
          searchParams.delete("resume");
        }

        const newUrl = `${pathname}?${searchParams.toString()}`;
        router.push(newUrl);
      } catch (error) {
        console.error("Failed to navigate to resume:", error);
        throw error;
      }
    },
    [loadResumeFile, router, pathname],
  );

  // Function to clear current resume and URL parameter
  const clearResume = useCallback(() => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete("resume");
    const newUrl = `${pathname}?${searchParams.toString()}`;
    router.push(newUrl);
  }, [router, pathname]);

  // Function to get a URL for a specific resume
  const getResumeUrl = useCallback(
    (resumePath: string) => {
      const encodedPath = encodeFilePathForUrl(resumePath);
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set("resume", encodedPath);
      return `${pathname}?${searchParams.toString()}`;
    },
    [pathname],
  );

  return {
    navigateToResume,
    clearResume,
    getResumeUrl,
  };
}
