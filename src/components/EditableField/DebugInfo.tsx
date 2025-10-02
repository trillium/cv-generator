"use client";

import { getNestedValue } from "../../hooks/useYamlPathUpdater";
import { CVData } from "../../types";

interface DebugInfoProps {
  yamlPath: string;
  fieldType: "text" | "textarea" | "array" | "link";
  parsedData: CVData;
}

export default function DebugInfo({
  yamlPath,
  fieldType,
  parsedData,
}: DebugInfoProps) {
  const pathParts = yamlPath.split(".");

  // Use the same logic as shouldShowAddButtons to find array info
  let arrayInfo = null;
  for (let i = pathParts.length - 1; i >= 0; i--) {
    const part = pathParts[i];
    if (!isNaN(Number(part))) {
      const parentPath = pathParts.slice(0, i).join(".");
      const parentValue = getNestedValue(parsedData, parentPath);
      arrayInfo = {
        isArrayItem: true,
        arrayIndex: part,
        parentPath,
        parentValue,
        isParentArray: Array.isArray(parentValue),
        arrayLength: Array.isArray(parentValue) ? parentValue.length : 0,
        pathLevel: i,
      };
      break;
    }
  }

  if (!arrayInfo) {
    arrayInfo = { isArrayItem: false };
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs space-y-1 border dark:border-gray-600">
      <div className="font-semibold text-gray-700 dark:text-gray-300">
        Debug Info:
      </div>
      <div>
        <strong>Field Type:</strong> {fieldType}
      </div>
      {arrayInfo.isArrayItem && (
        <>
          <div>
            <strong>Array Index:</strong> {arrayInfo.arrayIndex}
          </div>
          <div>
            <strong>Array Length:</strong> {arrayInfo.arrayLength}
          </div>
          <div>
            <strong>Parent Path:</strong> {arrayInfo.parentPath}
          </div>
        </>
      )}
    </div>
  );
}
