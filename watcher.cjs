// Watches for changes to data.yml and writes the parsed JSON to src/data.json
const fs = require("fs");
const path = require("path");
const diff = require("diff");

// Load environment variables from .env file
require("dotenv").config();

let yaml;
try {
  yaml = require("js-yaml");
} catch (e) {
  console.error("Please install js-yaml: pnpm add js-yaml");
  process.exit(1);
}

// Use PII_PATH environment variable, fallback to current directory
const piiPath = process.env.PII_PATH || __dirname;
const yamlPath = path.join(piiPath, "data.yml");
const jsonPath = path.join(__dirname, "src", "data.json");

console.log(`Looking for data.yml at: ${yamlPath}`);

// Check if the YAML file exists
if (!fs.existsSync(yamlPath)) {
  console.error(`❌ data.yml not found at ${yamlPath}`);
  console.error(
    `Please ensure your PII_PATH environment variable is set correctly or that data.yml exists in the specified location.`,
  );
  process.exit(1);
}

let lastData = null;

// Initialize lastData from data.json if it exists
try {
  if (fs.existsSync(jsonPath)) {
    const jsonContents = fs.readFileSync(jsonPath, "utf8");
    lastData = JSON.parse(jsonContents);
  }
} catch (e) {
  console.error("Error reading initial data.json for diffing:", e);
}

function convertYamlToJson() {
  try {
    const fileContents = fs.readFileSync(yamlPath, "utf8");
    const data = yaml.load(fileContents);

    // Diff logic
    if (lastData !== null) {
      const oldStr = JSON.stringify(lastData, null, 2);
      const newStr = JSON.stringify(data, null, 2);
      const changes = diff.diffLines(oldStr, newStr);
      console.log("[Diff]");
      changes.forEach((part) => {
        const color = part.added
          ? "\x1b[32m"
          : part.removed
            ? "\x1b[31m"
            : "\x1b[0m";
        process.stdout.write(color + part.value + "\x1b[0m");
      });
      console.log();
    }

    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    lastData = data;
    console.log(
      `[data.yml → data.json] Updated at ${new Date().toLocaleTimeString()}`,
    );
  } catch (e) {
    console.error("Error converting YAML to JSON:", e);
  }
}

fs.watchFile(yamlPath, { interval: 500 }, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    convertYamlToJson();
  }
});

// Initial conversion
convertYamlToJson();
