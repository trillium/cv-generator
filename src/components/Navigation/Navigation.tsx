"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { clsx } from "clsx";
import PrintPageSize, { DEFAULT_PAGE_SIZES } from "../PrintPageSize";
import ResumeSelector from "../ResumeSelector/ResumeSelector";
import {
  filterYamlForRoute,
  getRouteTypeFromPath,
  getModalConfig,
} from "../../../lib/filterYaml";
import { useYamlData } from "../../contexts/ResumeContext";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const {
    yamlContent,
    hasUnsavedChanges,
    isLoading,
    error,
    commitChanges,
    discardChanges,
  } = useYamlData();

  // Get route type and modal configuration
  const routeType = useMemo(() => getRouteTypeFromPath(pathname), [pathname]);
  const modalConfig = useMemo(() => getModalConfig(routeType), [routeType]);

  // Filter YAML content based on current route
  const filteredYamlContent = useMemo(() => {
    if (!yamlContent) return undefined;
    return filterYamlForRoute(yamlContent, routeType);
  }, [yamlContent, routeType]);

  // Extract current layout and type from pathname
  const pathParts = pathname.split("/").filter(Boolean);
  const currentLayout = pathParts[0] || "single-column";
  const currentType = pathParts[1] || "resume";

  const layouts = [
    { value: "single-column", label: "Single Column" },
    { value: "two-column", label: "Two Column" },
  ];

  const types = [
    { value: "resume", label: "Resume" },
    { value: "cover-letter", label: "Cover Letter" },
  ];

  const handleLayoutChange = (newLayout: string) => {
    // Check if we're currently on a dynamic route with a resume path
    const pathParts = pathname.split("/").filter(Boolean);

    if (pathParts.length >= 3) {
      // We're on a dynamic route like /single-column/resume/[resume-path]
      // Preserve the resume path when switching layouts
      const resumePath = pathParts.slice(2).join("/"); // Get everything after layout/type
      const newPath = `/${newLayout}/${currentType}/${resumePath}`;
      router.push(newPath);
    } else {
      // We're on a base route, just switch the layout
      const newPath = `/${newLayout}/${currentType}`;
      router.push(newPath);
    }
    setIsOpen(false);
  };

  const handleTypeChange = (newType: string) => {
    // Check if we're currently on a dynamic route with a resume path
    const pathParts = pathname.split("/").filter(Boolean);

    if (pathParts.length >= 3) {
      // We're on a dynamic route like /single-column/resume/[resume-path]
      // Preserve the resume path when switching types
      const resumePath = pathParts.slice(2).join("/"); // Get everything after layout/type
      const newPath = `/${currentLayout}/${newType}/${resumePath}`;
      router.push(newPath);
    } else {
      // We're on a base route, just switch the type
      const newPath = `/${currentLayout}/${newType}`;
      router.push(newPath);
    }
  };

  return (
    <>
      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="print:hidden fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="text-amber-800 font-medium">
                You have unsaved changes
              </span>
              {error && <span className="text-red-600 text-sm">• {error}</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={discardChanges}
                disabled={isLoading}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 border border-gray-300 rounded transition-colors"
              >
                {isLoading ? "Loading..." : "Discard"}
              </button>
              <button
                onClick={commitChanges}
                disabled={isLoading}
                className="px-3 py-1 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 border border-amber-600 rounded transition-colors"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        className={clsx(
          "print:hidden top-4 right-4 z-40",
          hasUnsavedChanges && "mt-12",
        )}
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Resume Selector - New Multi-Resume Feature */}
            <ResumeSelector />

            {/* Print Page Size Indicator - Show for both resume and cover letter */}
            <PrintPageSize
              pageSize={DEFAULT_PAGE_SIZES.letter}
              margins={{ top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 }}
            />

            {/* Layout Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-300 transition-colors"
              >
                {layouts.find((l) => l.value === currentLayout)?.label}
                <svg
                  className={clsx(
                    "w-4 h-4 transition-transform",
                    isOpen && "rotate-180",
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isOpen && (
                <div className="absolute top-full mt-1 right-0 bg-white rounded-md shadow-lg border border-gray-200 min-w-[140px]">
                  {layouts.map((layout) => (
                    <button
                      key={layout.value}
                      onClick={() => handleLayoutChange(layout.value)}
                      className={clsx(
                        "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-md last:rounded-b-md",
                        {
                          "bg-primary-50 text-primary-700 font-medium":
                            currentLayout === layout.value,
                          "text-gray-700": currentLayout !== layout.value,
                        },
                      )}
                    >
                      {layout.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Type Toggle */}
            <div className="flex bg-gray-100 rounded-md p-1">
              {types.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleTypeChange(type.value)}
                  className={clsx(
                    "px-3 py-1 text-sm font-medium rounded transition-colors",
                    {
                      "bg-white text-primary-700 shadow-sm":
                        currentType === type.value,
                      "text-gray-600 hover:text-gray-900":
                        currentType !== type.value,
                    },
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Home Link */}
            <button
              onClick={() => router.push("/")}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Go to home"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Click outside to close dropdown */}
        {isOpen && (
          <div
            className="fixed inset-0 z-[-1]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </nav>
    </>
  );
}
