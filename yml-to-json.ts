#!/usr/bin/env tsx
import { parseAndWriteDataFile } from "./lib/parseAndWriteDataFile";
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

try {
  parseAndWriteDataFile(inputPath, outputPath);
  console.log(`✅ Converted ${inputPath} to ${outputPath}`);
} catch (err) {
  console.error("❌ Failed to convert:", err);
  process.exit(1);
}
