#!/usr/bin/env tsx
import { UnifiedFileManager } from "./lib/unifiedFileManager";
import * as yaml from "js-yaml";
import { CVData } from "./src/types";
import { writeFileSync } from "node:fs";
import { config } from "dotenv";
import path from "path";

// Load environment variables from .env file
config();

// Use PII_PATH environment variable, fallback to current directory
const piiPath = process.env.PII_PATH;
if (!piiPath) {
  console.error(
    "PII_PATH environment variable is required. Please set PII_PATH to the directory containing your data.yml file.",
  );
  process.exit(1);
}
const inputPath = path.join(piiPath, "data.yml");
const outputPath = "src/data.json";

async function main() {
  try {
    const fileManager = new UnifiedFileManager(piiPath);
    const { content } = await fileManager.read("data.yml");
    const parsed = yaml.load(content) as CVData;
    writeFileSync(outputPath, JSON.stringify(parsed, null, 2));
    console.log(`✅ Converted ${inputPath} to ${outputPath}`);
  } catch (err) {
    console.error("❌ Failed to convert:", err);
    process.exit(1);
  }
}

main();
