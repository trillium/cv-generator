"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  getRouteTypeFromPath,
  getModalConfig,
  filterYamlForRoute,
} from "../../../lib/filterYaml";
import YamlDataModal from "../YamlDataModal/YamlDataModal";
import { useYamlData } from "../../contexts/YamlDataContext";

interface YamlViewerProps {
  className?: string;
}

export default function YamlViewer({ className = "" }: YamlViewerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();
  const { yamlContent, hasUnsavedChanges } = useYamlData();

  // Get route-specific configuration
  const routeType = getRouteTypeFromPath(pathname);
  const modalConfig = getModalConfig(routeType);

  // Filter YAML content based on current route
  const filteredYamlContent = useMemo(() => {
    if (!yamlContent) return "";
    return filterYamlForRoute(yamlContent, routeType);
  }, [yamlContent, routeType]);

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsModalOpen(true)}
          className={`p-2 text-gray-500 hover:text-gray-700 transition-colors relative ${className}`}
          title="View/Edit YAML data"
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
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>

          {/* Unsaved changes indicator */}
          {hasUnsavedChanges && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></div>
          )}
        </button>
      </div>

      <YamlDataModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        yamlData={filteredYamlContent}
        title={modalConfig.title}
        description={modalConfig.description}
      />
    </>
  );
}
