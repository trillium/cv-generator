import * as yaml from "js-yaml";
import { useFileManager } from "../contexts/FileManagerContext";
import { useContextAwareYamlUpdater } from "./useContextAwareYamlUpdater";

export function useYamlPathUpdater() {
  const { content: yamlContent } = useFileManager();
  const { updateYamlContent, currentContext, isFileBasedMode } =
    useContextAwareYamlUpdater();

  /**
   * Update a specific path in the YAML data
   * @param path - Dot-separated path to the field (e.g., 'workExperience.0.position')
   * @param newValue - New value to set
   */
  const updateYamlPath = async (path: string, newValue: unknown) => {
    try {
      console.log(`🎯 useYamlPathUpdater.updateYamlPath called with:`, {
        path,
        newValue,
        currentContext,
        isFileBasedMode,
        yamlContentLength: yamlContent.length,
      });

      // Parse current YAML
      const data = yaml.load(yamlContent) as Record<string, unknown>;
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
        preview: updatedYaml.substring(0, 200) + "...",
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
 * Validates against CVData type constraints
 */
function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
) {
  const keys = path.split(".");
  let current = obj;

  // Validate the path structure against CVData schema
  validatePathStructure(path, value);

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

      // Validate array structure based on path
      validateArrayStructure(keys.slice(0, i + 1).join("."), current);

      if (!current[index]) {
        // Create appropriate default object based on path
        current[index] = createDefaultObjectForPath(
          keys.slice(0, i + 1).join("."),
        );
      }
      current = current[index];
    } else {
      // Handle object properties
      if (typeof current !== "object" || current === null) {
        throw new Error(
          `Expected object at path ${keys.slice(0, i).join(".")}, but got ${typeof current}`,
        );
      }

      // Validate object structure
      validateObjectStructure(keys.slice(0, i + 1).join("."), current);

      if (!current[key]) {
        // Create appropriate default value based on path
        current[key] = createDefaultValueForPath(
          keys.slice(0, i + 1).join("."),
        );
      }
      current = current[key];
    }
  }

  // Set the final value with type validation
  const finalKey = keys[keys.length - 1];
  if (!isNaN(Number(finalKey)) && Array.isArray(current)) {
    // Validate array item type
    validateArrayItemType(keys.slice(0, keys.length - 1).join("."), value);
    current[Number(finalKey)] = value;
  } else {
    // Validate property type
    validatePropertyType(path, value);
    current[finalKey] = value;
  }
}

/**
 * Get a nested value from an object using a dot-separated path
 */
export function getNestedValue(obj: unknown, path: string): unknown {
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

/**
 * Validate path structure against CVData schema
 */
function validatePathStructure(path: string, _value: unknown): void {
  const keys = path.split(".");

  // Basic path validation
  if (keys.length === 0) {
    throw new Error("Empty path is not allowed");
  }

  // Validate root level properties
  const rootProperties = [
    "info",
    "header",
    "workExperience",
    "projects",
    "profile",
    "technical",
    "languages",
    "education",
    "coverLetter",
    "careerSummary",
  ];

  if (!rootProperties.includes(keys[0])) {
    throw new Error(`Unknown root property: ${keys[0]}`);
  }
}

/**
 * Validate array structure based on path
 */
function validateArrayStructure(path: string, array: unknown[]): void {
  if (!Array.isArray(array)) {
    throw new Error(`Expected array at path ${path}, but got ${typeof array}`);
  }

  // Validate specific array types
  if (path === "workExperience") {
    // Each work experience should have required fields
    array.forEach((item, index) => {
      if (typeof item !== "object" || item === null) {
        throw new Error(`workExperience[${index}] must be an object`);
      }
      if (
        !item.position ||
        !item.company ||
        !item.location ||
        !item.icon ||
        !item.years ||
        !item.lines
      ) {
        throw new Error(`workExperience[${index}] is missing required fields`);
      }
    });
  } else if (path === "technical") {
    // Each technical category should have category and bubbles
    array.forEach((item, index) => {
      if (typeof item !== "object" || item === null) {
        throw new Error(`technical[${index}] must be an object`);
      }
      if (!item.category || !Array.isArray(item.bubbles)) {
        throw new Error(
          `technical[${index}] must have category (string) and bubbles (array)`,
        );
      }
    });
  } else if (path === "education") {
    // Each education should have school
    array.forEach((item, index) => {
      if (typeof item !== "object" || item === null) {
        throw new Error(`education[${index}] must be an object`);
      }
      if (!item.school) {
        throw new Error(`education[${index}] must have school field`);
      }
    });
  }
}

/**
 * Validate object structure based on path
 */
function validateObjectStructure(path: string, obj: unknown): void {
  if (typeof obj !== "object" || obj === null) {
    throw new Error(`Expected object at path ${path}, but got ${typeof obj}`);
  }

  // Validate specific object structures
  if (path.startsWith("workExperience.")) {
    const requiredFields = [
      "position",
      "company",
      "location",
      "icon",
      "years",
      "lines",
    ];
    requiredFields.forEach((field) => {
      if (!(field in obj)) {
        throw new Error(`${path} is missing required field: ${field}`);
      }
    });
  } else if (path.startsWith("technical.")) {
    if (!("category" in obj) || !("bubbles" in obj)) {
      throw new Error(`${path} must have category and bubbles fields`);
    }
  } else if (path.startsWith("profile.")) {
    if (
      !("shouldDisplayProfileImage" in obj) ||
      !("lines" in obj) ||
      !("links" in obj)
    ) {
      throw new Error(`${path} is missing required fields`);
    }
  }
}

/**
 * Create default object for path
 */
function createDefaultObjectForPath(path: string): Record<string, unknown> {
  if (path.startsWith("workExperience.")) {
    return {
      position: "",
      company: "",
      location: "",
      icon: "",
      years: "",
      lines: [],
    };
  } else if (path.startsWith("technical.")) {
    return {
      category: "",
      bubbles: [],
    };
  } else if (path.startsWith("education.")) {
    return {
      school: "",
      degree: "",
      location: "",
      years: "",
    };
  } else if (path.startsWith("projects.")) {
    return {
      name: "",
      lines: [],
    };
  }
  return {};
}

/**
 * Create default value for path
 */
function createDefaultValueForPath(path: string): unknown {
  if (path.includes("lines")) {
    return [];
  } else if (path.includes("bubbles")) {
    return [];
  } else if (path.includes("links")) {
    return [];
  } else if (path.includes("shouldDisplayProfileImage")) {
    return false;
  }
  return "";
}

/**
 * Validate array item type
 */
function validateArrayItemType(arrayPath: string, value: unknown): void {
  if (arrayPath === "technical") {
    if (typeof value !== "object" || value === null) {
      throw new Error("Technical category must be an object");
    }
    if (!value.category || !Array.isArray(value.bubbles)) {
      throw new Error(
        "Technical category must have category (string) and bubbles (array)",
      );
    }
  } else if (arrayPath === "workExperience") {
    if (typeof value !== "object" || value === null) {
      throw new Error("Work experience must be an object");
    }
  } else if (arrayPath === "education") {
    if (typeof value !== "object" || value === null) {
      throw new Error("Education must be an object");
    }
  } else if (arrayPath === "languages") {
    // Languages can be any type for flexibility
  } else if (arrayPath === "coverLetter") {
    if (typeof value !== "string" && value !== null) {
      throw new Error("Cover letter item must be a string or null");
    }
  } else if (arrayPath === "careerSummary") {
    if (typeof value !== "object" || value === null) {
      throw new Error("Career summary item must be an object");
    }
  }
}

/**
 * Validate property type
 */
function validatePropertyType(path: string, value: unknown): void {
  // Validate specific property types
  if (
    path.endsWith("position") ||
    path.endsWith("company") ||
    path.endsWith("location") ||
    path.endsWith("icon") ||
    path.endsWith("years") ||
    path.endsWith("category") ||
    path.endsWith("school") ||
    path.endsWith("degree") ||
    path.endsWith("name") ||
    path.endsWith("title") ||
    path.endsWith("text")
  ) {
    if (typeof value !== "string") {
      throw new Error(`${path} must be a string`);
    }
  } else if (path.endsWith("shouldDisplayProfileImage")) {
    if (typeof value !== "boolean") {
      throw new Error(`${path} must be a boolean`);
    }
  } else if (
    path.endsWith("lines") ||
    path.endsWith("bubbles") ||
    path.endsWith("links")
  ) {
    if (!Array.isArray(value)) {
      throw new Error(`${path} must be an array`);
    }
  }
}
