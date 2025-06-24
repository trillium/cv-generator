// lib/ymlToJson.ts
// Basic script to convert ./data.yml to ./src/data.json
import fs from "node:fs";
import yaml from "js-yaml";
import { CVData } from "../src/types/cvdata.zod";

const inputPath = "./data.yml";
const outputPath = "./src/data.json";

function main() {
  try {
    const ymlText = fs.readFileSync(inputPath, "utf8");
    const data = yaml.load(ymlText);
    const parseResult = CVData.safeParse(data);
    if (!parseResult.success) {
      console.error("Validation failed:", parseResult.error.format());
    } else {
      fs.writeFileSync(outputPath, JSON.stringify(parseResult.data, null, 2));
      console.log(
        `Converted ${inputPath} to ${outputPath} and validated with Zod.`,
      );
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

main();
