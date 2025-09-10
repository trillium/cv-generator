import type { CVData } from "../src/types";
import fallbackData from "../src/data.json";
import scriptData from "../src/script-data.json";

export function mergeData(fallback: any, script: any): CVData {
  // Ensure header has omitTitle and omitBlurb
  const mergedHeader = {
    ...fallback.header,
    ...script.header,
    omitTitle: script.header?.omitTitle ?? fallback.header?.omitTitle ?? false,
    omitBlurb: script.header?.omitBlurb ?? fallback.header?.omitBlurb ?? false,
  };
  return {
    ...fallback,
    ...script,
    header: mergedHeader,
  };
}

export function getDefaultData(): CVData {
  return mergeData(fallbackData, scriptData);
}

export interface DataWithYaml {
  data: CVData;
  yamlContent: string;
}
