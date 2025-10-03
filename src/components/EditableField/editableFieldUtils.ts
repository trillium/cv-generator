import { getNestedValue } from "../../hooks/useYamlPathUpdater";

/**
 * Determines if a field is part of an array that supports add above/below functionality
 */
export function shouldShowAddButtons(
  yamlPath: string,
  parsedData: unknown,
): boolean {
  // Safety check: ensure yamlPath is a valid string
  if (!yamlPath || typeof yamlPath !== "string") {
    return false;
  }

  // Check if the yaml path indicates this is an array item or a property of an array item
  const pathParts = yamlPath.split(".");

  // Look for a numeric index in the path, which indicates an array item
  for (let i = pathParts.length - 1; i >= 0; i--) {
    const part = pathParts[i];

    // If this part is a number, it's an array index
    if (!isNaN(Number(part))) {
      const parentPath = pathParts.slice(0, i).join(".");
      const parentValue = getNestedValue(parsedData, parentPath);

      // Check if parent is an array and if it's one of the supported array types
      if (Array.isArray(parentValue)) {
        // List of array paths that support add above/below functionality
        const supportedArrayPaths = [
          "workExperience",
          "projects",
          "technical",
          "languages",
          "education",
          "coverLetter",
          "profile.lines",
          "profile.links",
          "careerSummary",
        ];

        // Also support nested arrays like workExperience.0.lines, projects.0.lines, etc.
        const isNestedLinesArray = parentPath.includes(".lines");
        const isNestedBubblesArray = parentPath.includes(".bubbles");
        const isNestedLinksArray = parentPath.includes(".links");

        return (
          supportedArrayPaths.includes(parentPath) ||
          isNestedLinesArray ||
          isNestedBubblesArray ||
          isNestedLinksArray
        );
      }
    }
  }

  return false;
}

/**
 * Creates a new item template based on the current item structure
 */
export function createNewItemFromTemplate(currentItem: unknown): unknown {
  if (typeof currentItem === "string") {
    return "";
  }

  if (typeof currentItem === "object" && currentItem !== null) {
    const template: Record<string, unknown> = {};

    Object.keys(currentItem).forEach((key) => {
      const value = (currentItem as Record<string, unknown>)[key];

      if (typeof value === "string") {
        template[key] = "";
      } else if (typeof value === "number") {
        template[key] = 0;
      } else if (typeof value === "boolean") {
        template[key] = false;
      } else if (Array.isArray(value)) {
        template[key] = [];
      } else if (typeof value === "object" && value !== null) {
        template[key] = {};
      } else {
        template[key] = value;
      }
    });

    return template;
  }

  return currentItem;
}

/**
 * Finds the array index and parent path for array operations
 */
export function findArrayInfo(yamlPath: string, parsedData: unknown) {
  // Safety check: ensure yamlPath is a valid string
  if (!yamlPath || typeof yamlPath !== "string") {
    return null;
  }

  const pathParts = yamlPath.split(".");

  for (let i = pathParts.length - 1; i >= 0; i--) {
    const part = pathParts[i];

    if (!isNaN(Number(part))) {
      const currentIndex = Number(part);
      const parentPath = pathParts.slice(0, i).join(".");
      const parentValue = getNestedValue(parsedData, parentPath);

      if (Array.isArray(parentValue)) {
        return {
          currentIndex,
          parentPath,
          parentValue,
        };
      }
    }
  }

  return null;
}

/**
 * Checks if a field value is empty
 */
export function isFieldEmpty(value: unknown): boolean {
  return (
    !value ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) &&
      (value.length === 0 ||
        value.every(
          (item) => !item || (typeof item === "string" && item.trim() === ""),
        )))
  );
}
