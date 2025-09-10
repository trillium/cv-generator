"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import * as yaml from "js-yaml";
import { getSectionMapping } from "../../../lib/sectionMapping";
import { useYamlData } from "../../contexts/YamlDataContext";
import EditableYamlViewer from "../EditableYamlViewer";

interface SectionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  yamlPath: string;
}

/**
 * Modal for editing a specific section of YAML data
 * Extracts only the relevant section and allows focused editing
 */
export default function SectionEditorModal({
  isOpen,
  onClose,
  yamlPath,
}: SectionEditorModalProps) {
  const [mounted, setMounted] = useState(false);
  const { yamlContent, updateYamlContent } = useYamlData();
  const sectionMapping = getSectionMapping(yamlPath);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Extract the specific section from the full YAML
  const getSectionYaml = (): string => {
    try {
      const fullData = yaml.load(yamlContent) as Record<string, any>;
      const sectionData = fullData[yamlPath];

      if (sectionData === undefined) {
        return `# Section "${yamlPath}" not found\n# Add content below:\n${yamlPath}:\n  # Add your content here`;
      }

      const sectionObj = { [yamlPath]: sectionData };
      return yaml.dump(sectionObj, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        skipInvalid: true,
      });
    } catch (error) {
      console.error("Error extracting section YAML:", error);
      return `# Error extracting section "${yamlPath}"\n# Please check your YAML syntax`;
    }
  };

  // Update the specific section in the full YAML
  const handleSectionSave = async (sectionYamlContent: string) => {
    try {
      // Parse the section YAML
      const sectionData = yaml.load(sectionYamlContent) as Record<string, any>;

      if (
        !sectionData ||
        typeof sectionData !== "object" ||
        !sectionData[yamlPath]
      ) {
        throw new Error(
          `Invalid YAML structure. Expected "${yamlPath}" at root level.`,
        );
      }

      // Parse the full YAML
      const fullData = yaml.load(yamlContent) as Record<string, any>;

      // Update the specific section
      fullData[yamlPath] = sectionData[yamlPath];

      // Convert back to YAML string
      const updatedYamlContent = yaml.dump(fullData, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        skipInvalid: true,
      });

      // Save via context
      await updateYamlContent(updatedYamlContent);

      // Close modal on successful save
      onClose();
    } catch (error) {
      console.error("Error saving section:", error);
      // You might want to show an error message to the user here
      alert(
        `Error saving section: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  if (!mounted || !isOpen) return null;

  const sectionYaml = getSectionYaml();

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Edit {sectionMapping?.displayName || yamlPath}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {sectionMapping?.description ||
                `Edit the ${yamlPath} section of your resume`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="p-6 h-full overflow-y-auto">
            <EditableYamlViewer
              yamlContent={sectionYaml}
              onSave={handleSectionSave}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
