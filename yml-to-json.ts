#!/usr/bin/env tsx
import { parseAndWriteDataFile } from "./lib/parseAndWriteDataFile";

const inputPath = "data.yml";
const outputPath = "src/data.json";

try {
  parseAndWriteDataFile(inputPath, outputPath);
  console.log(`✅ Converted ${inputPath} to ${outputPath}`);
} catch (err) {
  console.error("❌ Failed to convert:", err);
  process.exit(1);
}
