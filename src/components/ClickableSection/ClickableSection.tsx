"use client";

import React, { useState } from "react";
import { getSectionMapping } from "../../../lib/sectionMapping";

interface ClickableSectionProps {
  yamlPath: string;
  children: React.ReactNode;
  className?: string;
  onSectionClick?: (yamlPath: string) => void;
}

/**
 * Higher-order component that wraps resume sections to make them clickable and hoverable
 * This component adds hover states and click handlers to navigate to YAML editing
 */
export default function ClickableSection({
  yamlPath,
  children,
  className = "",
  onSectionClick,
}: ClickableSectionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const sectionMapping = getSectionMapping(yamlPath);

  const handleClick = () => {
    if (onSectionClick && sectionMapping) {
      onSectionClick(yamlPath);
    }
  };

  const hoverStyles = isHovered
    ? "ring-2 ring-blue-300 ring-opacity-50 bg-blue-50 bg-opacity-30"
    : "";

  const baseStyles =
    "relative transition-all duration-200 cursor-pointer rounded-md";

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      title={
        sectionMapping
          ? `Click to edit ${sectionMapping.displayName}`
          : "Click to edit"
      }
      data-yaml-section={yamlPath}
    >
      {/* Hover indicator */}
      {isHovered && (
        <div className="absolute top-0 right-0 -mt-2 -mr-2 z-10">
          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-md shadow-md">
            <svg
              className="w-3 h-3 inline mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit {sectionMapping?.displayName}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
