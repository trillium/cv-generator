import * as yaml from "js-yaml";
import { useYamlData } from "../contexts/ResumeContext";
import { useContextAwareYamlUpdater } from "./useContextAwareYamlUpdater";

/**
 * Hook for updating specific YAML paths granularly
 */
export function useYamlPathUpdater() {
  const { yamlContent } = useYamlData();
  const { updateYamlContent, currentContext, isFileBasedMode } = useContextAwareYamlUpdater();

  /**
   * Update a specific path in the YAML data
   * @param path - Dot-separated path to the field (e.g., 'workExperience.0.position')
   * @param newValue - New value to set
   */
  const updateYamlPath = async (path: string, newValue: any) => {
    try {
      console.log(`🎯 useYamlPathUpdater.updateYamlPath called with:`, {
        path,
        newValue,
        currentContext,
        isFileBasedMode,
        yamlContentLength: yamlContent.length
      });

      // Parse current YAML
      const data = yaml.load(yamlContent) as Record<string, any>;
      console.log("📋 Parsed current YAML data:", data);

      // Update the specific path
      setNestedValue(data, path, newValue);
      console.log("🔄 Updated data after setNestedValue:", data);

      // Convert back to YAML
      const updatedYaml = yaml.dump(data, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        skipInvalid: true,
      });
      console.log("📄 Generated updated YAML:", {
        length: updatedYaml.length,
        preview: updatedYaml.substring(0, 200) + "..."
      });

      // Update via context-aware updater
      console.log("🚀 Calling updateYamlContent...");
      await updateYamlContent(updatedYaml);

      console.log(`✅ YAML path "${path}" updated successfully`);
    } catch (error) {
      console.error("❌ Error updating YAML path:", path, error);
      throw error;
    }
  };

  return { updateYamlPath, currentContext, isFileBasedMode };
}

/**
 * Set a nested value in an object using a dot-separated path
 */
function setNestedValue(obj: any, path: string, value: any) {
  const keys = path.split(".");
  let current = obj;

  // Navigate to the parent of the target field
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    // Handle array indices
    if (!isNaN(Number(key))) {
      const index = Number(key);
      if (!Array.isArray(current)) {
        throw new Error(
          `Expected array at path ${keys.slice(0, i).join(".")}, but got ${typeof current}`,
        );
      }
      if (!current[index]) {
        current[index] = {};
      }
      current = current[index];
    } else {
      // Handle object properties
      if (typeof current !== "object" || current === null) {
        throw new Error(
          `Expected object at path ${keys.slice(0, i).join(".")}, but got ${typeof current}`,
        );
      }
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
  }

  // Set the final value
  const finalKey = keys[keys.length - 1];
  if (!isNaN(Number(finalKey)) && Array.isArray(current)) {
    current[Number(finalKey)] = value;
  } else {
    current[finalKey] = value;
  }
}

/**
 * Get a nested value from an object using a dot-separated path
 */
export function getNestedValue(obj: any, path: string): any {
  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (!isNaN(Number(key)) && Array.isArray(current)) {
      current = current[Number(key)];
    } else if (typeof current === "object") {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current;
}
