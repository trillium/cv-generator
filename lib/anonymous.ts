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
  return replace(obj, dataAnon);
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
  const result: Record<string, unknown> | unknown[] = Array.isArray(obj)
    ? []
    : {};
  const keys = new Set([...Object.keys(obj), ...Object.keys(newObj)]);
  for (const key of keys) {
    const currentPath = path.concat(key);
    const pathStr = currentPath.join(".");
    const truncate = (val: unknown) => {
      const str = JSON.stringify(val);
      return str && str.length > 50 ? str.slice(0, 47) + "..." : str;
    };
    if (key in newObj) {
      // If newObj[key] is null or undefined, keep the original value
      if (newObj[key] === null || newObj[key] === undefined) {
        console.debug(
          `[anon] ${pathStr} ${truncate(obj[key])} -> ${truncate(obj[key])}`,
        );
        result[key] = obj[key];
      } else if (
        typeof obj[key] === "object" &&
        typeof newObj[key] === "object" &&
        obj[key] !== null &&
        newObj[key] !== null
      ) {
        result[key] = replace(obj[key], newObj[key], currentPath);
      } else {
        console.debug(
          `[anon] ${pathStr} ${truncate(obj[key])} -> ${truncate(newObj[key])}`,
        );
        result[key] = replace(obj[key], newObj[key], currentPath);
      }
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}
