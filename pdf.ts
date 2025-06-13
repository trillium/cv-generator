import puppeteer from "puppeteer";
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import path from "node:path";
import yaml from "js-yaml";

// Fix: define __dirname at the top for use throughout the script
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Accept .json or .yml/.yaml file, convert to valid JSON, write to /src/script-data.json
const dataPath = process.argv[2] || "./src/data.json";
console.log(`Using data file: ${dataPath}`);

const ext = path.extname(dataPath).toLowerCase();
let dataObj: any;

try {
  const fileContent = readFileSync(dataPath, "utf-8");
  if (ext === ".yml" || ext === ".yaml") {
    dataObj = yaml.load(fileContent);
  } else if (ext === ".json") {
    dataObj = JSON.parse(fileContent);
  } else {
    throw new Error(
      "Unsupported file type. Please provide a .json or .yml/.yaml file.",
    );
  }
  // Write to /src/script-data.json
  writeFileSync(
    path.join(__dirname, "src", "script-data.json"),
    JSON.stringify(dataObj, null, 2),
  );
  console.log("✅ Data written to src/script-data.json");
} catch (err) {
  console.error("❌ Failed to process input file:", err);
  process.exit(1);
}

(async () => {
  console.log("⏳ Starting Vite server");
  const server = await createServer({
    configFile: "vite.config.ts",
    root: __dirname,
  });
  await server.listen();

  console.log("🐾 Opening Puppeteer");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(server.resolvedUrls?.local[0] as string, {
    waitUntil: "networkidle0",
  });

  console.log("🖨️  Generating PDF");
  const pdf = await page.pdf({
    format: "letter",
    margin: { top: ".25in", bottom: ".25in", left: ".25in", right: ".25in" },
    printBackground: true,
    scale: 0.8,
  });

  console.log("💾 Saving PDF");
  writeFileSync("output.pdf", pdf);

  await browser.close();

  await server.close();
  console.log("🏁 Done");

  // Reset script-data.json to empty object
  writeFileSync(path.join(__dirname, "src", "script-data.json"), "{}\n");
  console.log("🔄 src/script-data.json reset to empty object");
})();
