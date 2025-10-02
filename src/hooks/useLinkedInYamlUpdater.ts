import * as yaml from "js-yaml";
import { useLinkedInData } from "../contexts/LinkedInContext";

export function getNestedValue(obj: any, path: string): any {
  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (!isNaN(Number(key))) {
      const index = Number(key);
      if (Array.isArray(current)) {
        current = current[index];
      } else {
        return undefined;
      }
    } else {
      current = current[key];
    }
  }

  return current;
}

function setNestedValue(obj: any, path: string, value: any) {
  const keys = path.split(".");
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    if (!isNaN(Number(key))) {
      const index = Number(key);
      if (!Array.isArray(current)) {
        throw new Error(
          `Expected array at path segment "${keys.slice(0, i + 1).join(".")}"`,
        );
      }
      current = current[index];
    } else {
      if (current[key] === undefined) {
        const nextKey = keys[i + 1];
        current[key] = !isNaN(Number(nextKey)) ? [] : {};
      }
      current = current[key];
    }
  }

  const lastKey = keys[keys.length - 1];
  if (!isNaN(Number(lastKey))) {
    const index = Number(lastKey);
    if (Array.isArray(current)) {
      current[index] = value;
    } else {
      throw new Error(`Expected array at path "${path}"`);
    }
  } else {
    current[lastKey] = value;
  }
}

export function useLinkedInYamlUpdater() {
  const { yamlContent, updateYamlContent, currentLinkedInFile } =
    useLinkedInData();

  const updateYamlPath = async (path: string, newValue: any) => {
    try {
      console.log(`🎯 useLinkedInYamlUpdater.updateYamlPath called with:`, {
        path,
        newValue,
        currentLinkedInFile,
        yamlContentLength: yamlContent.length,
      });

      const data = yaml.load(yamlContent) as Record<string, any>;
      console.log("📋 Parsed current YAML data:", data);

      setNestedValue(data, path, newValue);
      console.log("🔄 Updated data after setNestedValue:", data);

      const updatedYaml = yaml.dump(data, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        skipInvalid: true,
      });
      console.log("📄 Generated updated YAML:", {
        length: updatedYaml.length,
        preview: updatedYaml.substring(0, 200) + "...",
      });

      console.log("🚀 Calling updateYamlContent...");
      await updateYamlContent(updatedYaml);

      console.log(`✅ YAML path "${path}" updated successfully`);
    } catch (error) {
      console.error("❌ Error updating YAML path:", path, error);
      throw error;
    }
  };

  return {
    updateYamlPath,
    currentContext: currentLinkedInFile
      ? {
          filePath: currentLinkedInFile,
          fileName:
            currentLinkedInFile
              .split("/")
              .pop()
              ?.replace(/\.(yml|yaml)$/i, "") || "linkedin",
        }
      : null,
    isFileBasedMode: !!currentLinkedInFile,
  };
}
