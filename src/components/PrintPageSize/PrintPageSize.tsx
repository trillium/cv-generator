"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useModal } from "../../contexts/ModalContext";

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
  onPageSizeChange?: (pageSize: PageSize) => void;
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
  onPageSizeChange,
}: PrintPageSizeProps) {
  const [pageCount, setPageCount] = useState<number>(1);
  const [pendingPageCount, setPendingPageCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const observersRef = useRef<{
    resizeObserver?: ResizeObserver;
    mutationObserver?: MutationObserver;
  }>({});

  const { openModal, closeModal } = useModal();

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

  // Handle opening the paper size selection modal
  const handleOpenPaperSizeModal = () => {
    const PaperSizeModalContent = () => (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Select Paper Size
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Choose the paper size for your resume
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(DEFAULT_PAGE_SIZES).map(([key, size]) => (
            <button
              key={key}
              onClick={() => {
                onPageSizeChange?.(size);
                closeModal();
              }}
              className={`p-3 rounded-lg border text-left transition-all hover:shadow-md ${
                size.name === pageSize.name
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
            >
              <div className="font-medium text-sm">{size.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {size.width}" × {size.height}"
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={closeModal}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );

    openModal(<PaperSizeModalContent />, "md");
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
      onClick={onPageSizeChange ? handleOpenPaperSizeModal : undefined}
      role={onPageSizeChange ? "button" : undefined}
      tabIndex={onPageSizeChange ? 0 : -1}
      onKeyDown={
        onPageSizeChange
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleOpenPaperSizeModal();
              }
            }
          : undefined
      }
    >
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
        {error ? (
          <span className="text-red-500 dark:text-red-400">Error</span>
        ) : (
          <>
            {pageCount} page{pageCount !== 1 ? "s" : ""}
          </>
        )}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
        ({pageSize.name})
      </span>
      {error && (
        <span
          className="text-xs text-red-500 dark:text-red-400 ml-2"
          title={error}
        >
          {error}
        </span>
      )}
    </div>
  );
}
