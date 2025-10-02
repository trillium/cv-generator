"use client";

import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { toast } from "sonner";

export default function TypeToggle() {
  const pathname = usePathname();
  const router = useRouter();

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
  );
}
