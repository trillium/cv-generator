"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { clsx } from "clsx";

interface LayoutOption {
  value: string;
  label: string;
}

const layouts: LayoutOption[] = [
  { value: "single-column", label: "Single Column" },
  { value: "two-column", label: "Two Column" },
];

export default function LayoutSelector() {
  const pathname = usePathname();
  const router = useRouter();

  // Extract current layout and type from pathname
  const pathParts = pathname.split("/").filter(Boolean);
  const currentLayout = pathParts[0] || "single-column";
  const currentType = pathParts[1] || "resume";

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
  };

  const currentLayoutOption = layouts.find((l) => l.value === currentLayout);

  return (
    <Menu>
      <MenuButton className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md border border-gray-300 dark:border-gray-600 transition-colors">
        {currentLayoutOption?.label || "Single Column"}
        <svg
          className="w-4 h-4"
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
      </MenuButton>

      <MenuItems
        anchor={{ to: "bottom", padding: "20px" }}
        className="bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 min-w-[140px] z-50 focus:outline-none"
      >
        {layouts.map((layout) => (
          <MenuItem key={layout.value}>
            {({ active }) => (
              <button
                onClick={() => handleLayoutChange(layout.value)}
                className={clsx(
                  "w-full text-left px-3 py-2 text-sm first:rounded-t-md last:rounded-b-md transition-all hover:font-semibold",
                  {
                    "bg-gray-50 dark:bg-gray-700": active,
                    "bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium":
                      currentLayout === layout.value,
                    "text-gray-700 dark:text-gray-300":
                      currentLayout !== layout.value,
                  },
                )}
              >
                {layout.label}
              </button>
            )}
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
