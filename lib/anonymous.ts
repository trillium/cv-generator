import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

import type { CVData } from "../src/types";

// Use import.meta.url to get __dirname in ESM
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const dataAnonPath = path.join(__dirname, "../data_anon.yml");
const dataAnon = yaml.load(fs.readFileSync(dataAnonPath, "utf-8")) as CVData;

export function anonymizeData(obj: object): CVData {
  // Use the replace function to anonymize obj using dataAnon as the source of anonymized values
  return replace(obj, dataAnon) as CVData;
}

/**
 * Recursively replaces values in `obj` with values from `newObj` at the given path.
 * @param obj The original object to update
 * @param newObj The object with new values (same structure as obj)
 * @param path The path (array of keys) to the value to replace (optional, for recursion)
 * @returns A new object with values replaced
 */
export function replace(
  obj: unknown,
  newObj: unknown,
  path: Array<string | number> = [],
): unknown {
  if (typeof obj !== "object" || obj === null) return newObj;
  if (typeof newObj !== "object" || newObj === null) return newObj;

  // If both are arrays, map recursively
  if (Array.isArray(obj) && Array.isArray(newObj)) {
    return newObj.map((item, idx) => replace(obj[idx], item, path.concat(idx)));
  }

  // If both are objects, recursively replace each key
  const result = (Array.isArray(obj) ? [] : {}) as Record<string, unknown>;
  const objRecord = obj as Record<string, unknown>;
  const newObjRecord = newObj as Record<string, unknown>;
  const keys = new Set([
    ...Object.keys(objRecord),
    ...Object.keys(newObjRecord),
  ]);
  for (const key of keys) {
    const currentPath = path.concat(key);
    const pathStr = currentPath.join(".");
    const truncate = (val: unknown) => {
      const str = JSON.stringify(val);
      return str && str.length > 50 ? str.slice(0, 47) + "..." : str;
    };
    if (key in newObjRecord) {
      // If newObj[key] is null or undefined, keep the original value
      if (newObjRecord[key] === null || newObjRecord[key] === undefined) {
        console.debug(
          `[anon] ${pathStr} ${truncate(objRecord[key])} -> ${truncate(objRecord[key])}`,
        );
        result[key] = objRecord[key];
      } else if (
        typeof objRecord[key] === "object" &&
        typeof newObjRecord[key] === "object" &&
        objRecord[key] !== null &&
        newObjRecord[key] !== null
      ) {
        result[key] = replace(objRecord[key], newObjRecord[key], currentPath);
      } else {
        console.debug(
          `[anon] ${pathStr} ${truncate(objRecord[key])} -> ${truncate(newObjRecord[key])}`,
        );
        result[key] = replace(objRecord[key], newObjRecord[key], currentPath);
      }
    } else {
      result[key] = objRecord[key];
    }
  }
  return result;
}
