// Anonymizer function for scrubbing sensitive fields from a CVData object
// Replaces name, email, phone, company, project, and similar fields with example values
// Adds debug statements to show what is being replaced
import type { CVData } from "../src/types";

// helper object that creates an object of exact structure as data passed in, where each value is ""

// Creates an object with the same structure as the input, but with all string values set to ""
function blankObject<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => blankObject(item)) as T;
  } else if (obj && typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      if (typeof obj[key] === "string") {
        result[key] = "";
      } else if (typeof obj[key] === "object") {
        result[key] = blankObject(obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
    return result;
  }
  return obj;
}

// Checks if two objects have the same key structure, disregarding values
function hasSameKeyStructure(obj1: any, obj2: any): boolean {
  if (typeof obj1 !== typeof obj2) return false;
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length === 0 || obj2.length === 0) return true;
    // Check structure of first element as representative
    return hasSameKeyStructure(obj1[0], obj2[0]);
  } else if (
    obj1 &&
    typeof obj1 === "object" &&
    obj2 &&
    typeof obj2 === "object"
  ) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!hasSameKeyStructure(obj1[key], obj2[key])) return false;
    }
    return true;
  }
  // For primitives, structure is considered the same
  return true;
}

export function anonymizeData(data: CVData): CVData {
  // right now just console log if blank object has same structure for arg data
  const blank = blankObject(data);
  console.log("Has same structure:", hasSameKeyStructure(data, blank));
  // console.log out the nested key strucutre recursively
  function logKeyStructure(obj: any, prefix = "") {
    if (Array.isArray(obj)) {
      if (obj.length > 0) logKeyStructure(obj[0], prefix + "[0]");
    } else if (obj && typeof obj === "object") {
      for (const key in obj) {
        console.log(prefix + (prefix ? "." : "") + key);
        logKeyStructure(obj[key], prefix + (prefix ? "." : "") + key);
      }
    }
  }
  logKeyStructure(data);

  return blank;
}
