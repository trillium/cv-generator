// lib/ymlToJson.ts
// Basic script to convert ./data.yml to ./src/data.json
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { config } from "dotenv";
import { CVData } from "../src/types/cvdata.zod";

// Load environment variables from .env file
config();

// Use PII_PATH environment variable, fallback to current directory
const piiPath = process.env.PII_PATH || process.cwd();
const inputPath = path.join(piiPath, "data.yml");
const outputPath = "./src/data.json";

function main() {
  try {
    console.log(`Reading from: ${inputPath}`);

    if (!fs.existsSync(inputPath)) {
      console.error(`❌ data.yml not found at ${inputPath}`);
      console.error(
        `Please ensure your PII_PATH environment variable is set correctly.`,
      );
      process.exit(1);
    }

    const ymlText = fs.readFileSync(inputPath, "utf8");
    const data = yaml.load(ymlText);
    const parseResult = CVData.safeParse(data);
    if (!parseResult.success) {
      console.error(
        "Validation failed (formatted):",
        parseResult.error.format(),
      );
      console.error("Validation failed (raw):", parseResult.error);
    } else {
      fs.writeFileSync(outputPath, JSON.stringify(parseResult.data, null, 2));
      console.log(
        `✅ Converted ${inputPath} to ${outputPath} and validated with Zod.`,
      );
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

main();
