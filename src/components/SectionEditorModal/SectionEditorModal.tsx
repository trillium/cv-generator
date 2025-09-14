"use client";

import * as yaml from "js-yaml";
import { getSectionMapping } from "../../../lib/sectionMapping";
import { useYamlData } from "../../contexts/ResumeContext";
import { useContextAwareYamlUpdater } from "../../hooks/useContextAwareYamlUpdater";
import EditableYamlViewer from "../EditableYamlViewer";

interface SectionEditorModalProps {
  onClose: () => void;
  yamlPath: string;
}

/**
 * Modal for editing a specific section of YAML data
 * Extracts only the relevant section and allows focused editing
 */
export default function SectionEditorModal({
  onClose,
  yamlPath,
}: SectionEditorModalProps) {
  const { yamlContent } = useYamlData();
  const { updateYamlContent } = useContextAwareYamlUpdater();
  const sectionMapping = getSectionMapping(yamlPath);

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

  const sectionYaml = getSectionYaml();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          Edit {sectionMapping?.displayName || yamlPath}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {sectionMapping?.description ||
            `Edit the ${yamlPath} section of your resume`}
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <EditableYamlViewer
          yamlContent={sectionYaml}
          onSave={handleSectionSave}
          className="h-full min-h-[400px]"
        />
      </div>
    </div>
  );
}
