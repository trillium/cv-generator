"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDirectoryManager } from "@/contexts/DirectoryManager/DirectoryManagerContext.hook";
import { encodeFilePathForUrl } from "@/utils/urlSafeEncoding";

export function useResumeNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { loadDirectory } = useDirectoryManager();

  const navigateToResume = useCallback(
    async (resumePath: string) => {
      try {
        await loadDirectory(resumePath);

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
    [loadDirectory, router, pathname],
  );

  const clearResume = useCallback(() => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete("resume");
    const newUrl = `${pathname}?${searchParams.toString()}`;
    router.push(newUrl);
  }, [router, pathname]);

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
