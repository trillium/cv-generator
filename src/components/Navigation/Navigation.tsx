"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { clsx } from "clsx";
import PrintPageSize, { DEFAULT_PAGE_SIZES } from "../PrintPageSize";
import ResumeSelector from "../ResumeSelector/ResumeSelector";
import ThemeSwitch from "../ThemeSwitch";
import LayoutSelector from "./LayoutSelector";
import { ColorPickerSwitch } from "../ColorPicker";
import {
  filterYamlForRoute,
  getRouteTypeFromPath,
  getModalConfig,
} from "../../../lib/filterYaml";
import { useYamlData } from "../../contexts/ResumeContext";
import { toast } from "sonner";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { yamlContent } = useYamlData();

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

  const types = [
    { value: "resume", label: "Resume" },
    { value: "cover-letter", label: "Cover Letter" },
  ];

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

    toast.success(
      `Switched to ${newType === "resume" ? "Resume" : "Cover Letter"} view`,
    );
  };

  return (
    <>
      <nav className={clsx("print:hidden top-4 right-4 z-40")}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <ResumeSelector />

            {/* Print Page Size Indicator - Show for both resume and cover letter */}
            <PrintPageSize
              pageSize={DEFAULT_PAGE_SIZES.letter}
              margins={{ top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 }}
            />

            {/* Layout Selector */}
            <LayoutSelector />

            {/* Type Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
              {types.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleTypeChange(type.value)}
                  className={clsx(
                    "px-3 py-1 text-sm font-medium rounded transition-colors",
                    {
                      "bg-white dark:bg-gray-800 text-primary-700 dark:text-primary-300 shadow-sm":
                        currentType === type.value,
                      "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200":
                        currentType !== type.value,
                    },
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Theme Switch */}
            <ThemeSwitch />

            {/* Color Picker */}
            <ColorPickerSwitch />

            {/* Home Link */}
            <button
              onClick={() => {
                router.push("/");
                toast.info("Navigating to home");
              }}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
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
      </nav>
    </>
  );
}
