import { writeFileSync } from "node:fs";
import type { CVData } from "@/types";
import { MultiFileManager } from "../../lib/multiFileManager";

export async function loadAndProcessData(
  resumePath: string,
  scriptDataJsonPath: string,
  isAnon: boolean,
): Promise<CVData> {
  try {
    const manager = new MultiFileManager();
    const result = await manager.loadDirectory(resumePath);
    const dataObj = result.data;

    if (isAnon) {
      console.log("⚠️  Anonymization not yet implemented");
    }

    console.log("✅ Data written to src/script-data.json");

    writeFileSync(scriptDataJsonPath, JSON.stringify(dataObj, null, 2));

    return dataObj;
  } catch (err) {
    console.error("❌ Failed to process input file:", err);
    process.exit(1);
  }
}
