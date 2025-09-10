"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface PageSize {
  name: string;
  width: number; // in inches
  height: number; // in inches
}

interface PrintPageSizeProps {
  targetSelector?: string;
  pageSize?: PageSize;
  margins?: {
    top: number; // in inches
    bottom: number; // in inches
    left: number; // in inches
    right: number; // in inches
  };
  dpi?: number;
}

const DEFAULT_PAGE_SIZES: Record<string, PageSize> = {
  letter: { name: "US Letter", width: 8.5, height: 11 },
  a4: { name: "A4", width: 8.27, height: 11.69 },
  legal: { name: "US Legal", width: 8.5, height: 14 },
  tabloid: { name: "Tabloid", width: 11, height: 17 },
};

// Export the page sizes and types for use in other components
export { DEFAULT_PAGE_SIZES };
export type { PageSize, PrintPageSizeProps };

export default function PrintPageSize({
  targetSelector = ".resume-content",
  pageSize = DEFAULT_PAGE_SIZES.letter,
  margins = { top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 },
  dpi = 96,
}: PrintPageSizeProps) {
  const [pageCount, setPageCount] = useState<number>(1);
  const [pendingPageCount, setPendingPageCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const observersRef = useRef<{
    resizeObserver?: ResizeObserver;
    mutationObserver?: MutationObserver;
  }>({});

  // Memoize the calculation parameters to prevent unnecessary recalculations
  const calculationParams = useCallback(
    () => ({
      pageWidthPx: pageSize.width * dpi,
      pageHeightPx: pageSize.height * dpi,
      topMarginPx: margins.top * dpi,
      bottomMarginPx: margins.bottom * dpi,
      leftMarginPx: margins.left * dpi,
      rightMarginPx: margins.right * dpi,
    }),
    [
      pageSize.width,
      pageSize.height,
      margins.top,
      margins.bottom,
      margins.left,
      margins.right,
      dpi,
    ],
  );

  const calculatePageCount = useCallback(() => {
    setError(null);
    try {
      const params = calculationParams();
      const usableHeight =
        params.pageHeightPx - (params.topMarginPx + params.bottomMarginPx);
      const usableWidth =
        params.pageWidthPx - (params.leftMarginPx + params.rightMarginPx);
      const targetElement = document.querySelector(targetSelector);
      if (!targetElement) {
        setError(
          `PrintPageSize: Could not find element with selector "${targetSelector}"`,
        );
        return;
      }
      const clone = targetElement.cloneNode(true) as HTMLElement;
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "-9999px";
      clone.style.width = `${usableWidth}px`;
      clone.style.visibility = "hidden";
      clone.style.pointerEvents = "none";
      const originalMedia =
        document.documentElement.style.getPropertyValue("--print-simulation");
      document.documentElement.style.setProperty("--print-simulation", "true");
      document.body.appendChild(clone);
      const contentHeight = clone.scrollHeight;
      document.body.removeChild(clone);
      if (originalMedia) {
        document.documentElement.style.setProperty(
          "--print-simulation",
          originalMedia,
        );
      } else {
        document.documentElement.style.removeProperty("--print-simulation");
      }
      const calculatedPages = Math.max(
        1,
        Math.ceil(contentHeight / usableHeight),
      );
      setPendingPageCount(calculatedPages);
    } catch (e: any) {
      setError(e?.message || "Unknown error during page calculation");
    }
  }, [targetSelector, calculationParams]);

  useEffect(() => {
    // Clean up any existing observers first
    if (observersRef.current.resizeObserver) {
      observersRef.current.resizeObserver.disconnect();
    }
    if (observersRef.current.mutationObserver) {
      observersRef.current.mutationObserver.disconnect();
    }

    // Initial calculation
    calculatePageCount();

    // Set up ResizeObserver to watch for content changes
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
      return;
    }
    let debounceTimeout: NodeJS.Timeout | null = null;
    const debouncedCalculation = () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      debounceTimeout = setTimeout(() => {
        calculatePageCount();
        debounceTimeout = null;
      }, 150);
    };
    const resizeObserver = new ResizeObserver(debouncedCalculation);
    const mutationObserver = new MutationObserver(debouncedCalculation);
    observersRef.current = { resizeObserver, mutationObserver };
    resizeObserver.observe(targetElement);
    mutationObserver.observe(targetElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
    // Cleanup
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [targetSelector]);

  // Separate effect for when calculation parameters change
  useEffect(() => {
    calculatePageCount();
  }, [calculationParams]);

  // When a new calculation finishes, update the visible page count
  useEffect(() => {
    if (pendingPageCount !== null) {
      setPageCount(pendingPageCount);
      setPendingPageCount(null);
    }
  }, [pendingPageCount]);

  // Recalculate when window is resized (affects print layout)
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(() => {
        calculatePageCount();
        resizeTimeout = null;
      }, 300);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [targetSelector, calculationParams]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-md border border-gray-300">
      <svg
        className="w-4 h-4 text-gray-500"
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
        {error ? (
          <span className="text-red-500">Error</span>
        ) : (
          <>
            {pageCount} page{pageCount !== 1 ? "s" : ""}
          </>
        )}
      </span>
      <span className="text-xs text-gray-500 ml-1">({pageSize.name})</span>
      {error && (
        <span className="text-xs text-red-500 ml-2" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
