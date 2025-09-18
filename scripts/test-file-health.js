import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import dotenv from "dotenv";

dotenv.config();

const piiFolder = process.env.PII_PATH || "./pii/";
console.log(`Using PII_PATH: ${piiFolder}`);

let validFiles = 0;
let invalidFiles = 0;
let nonYamlFiles = 0;

try {
  const files = fs.readdirSync(piiFolder);
  console.log(`Files in ${piiFolder}:`);
  files.forEach((file) => console.log(`  - ${file}`));
  console.log("");

  for (const file of files) {
    const filePath = path.join(piiFolder, file);
    const ext = path.extname(file).toLowerCase();

    if (ext !== ".yml" && ext !== ".yaml") {
      nonYamlFiles++;
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, "utf8");
      yaml.load(content);
      console.log(`✅ ${file} is valid YAML`);
      validFiles++;
    } catch (error) {
      console.error(`❌ ${file} is invalid YAML: ${error.message}`);
      invalidFiles++;
    }
  }
} catch (error) {
  console.error(`Error reading pii folder: ${error.message}`);
}

console.log(`\nSummary:`);
console.log(`Valid YAML files: ${validFiles}`);
console.log(`Invalid YAML files: ${invalidFiles}`);
console.log(`Non-YAML files: ${nonYamlFiles}`);

if (invalidFiles > 0) {
  process.exit(1);
}
