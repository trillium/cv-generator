import puppeteer, { Page, Browser } from "puppeteer";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import path from "node:path";
import yaml from "js-yaml";
import { CVData } from "./src/types";
import { anonymizeData } from "./lib/anonymous";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseAndWriteDataFile(inputPath: string, outputPath: string): any {
  const ext = path.extname(inputPath).toLowerCase();
  let dataObj: any;
  const fileContent = readFileSync(inputPath, "utf-8");
  if (ext === ".yml" || ext === ".yaml") {
    dataObj = yaml.load(fileContent);
  } else if (ext === ".json") {
    dataObj = JSON.parse(fileContent);
  } else {
    throw new Error(
      "Unsupported file type. Please provide a .json or .yml/.yaml file.",
    );
  }
  writeFileSync(outputPath, JSON.stringify(dataObj, null, 2));
  return dataObj;
}

async function startViteServer(rootDir: string) {
  const server = await createServer({
    configFile: "vite.config.ts",
    root: rootDir,
  });
  await server.listen();
  return server;
}

async function generatePdf(url: string, pdfOptions: object, page: Page) {
  await page.goto(url, { waitUntil: "networkidle0" });
  const pdf = await page.pdf(pdfOptions);
  return pdf;
}

function ensureDirectoryExists(dirPath: string) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath);
  }
}

function getOutputFilename({
  data,
  type,
}: {
  data: CVData;
  type: "Resume" | "CoverLetter";
}): string {
  return [data.header.name.split(" ").join("_"), type].join("_") + ".pdf";
}

function resetScriptDataJson(outputPath: string) {
  writeFileSync(outputPath, "{}\n");
}

async function generateAndSavePdf({
  url,
  dataObj,
  type,
  outDir,
  browser,
}: {
  url: string;
  dataObj: CVData;
  type: "Resume" | "CoverLetter";
  outDir: string;
  browser: Browser;
}) {
  const page = await browser.newPage();
  const pdf = await generatePdf(
    url,
    {
      format: "letter",
      margin: { top: ".25in", bottom: ".25in", left: ".25in", right: ".25in" },
      printBackground: true,
      scale: 0.8,
    },
    page,
  );
  ensureDirectoryExists(outDir);
  const outPath = path.join(outDir, getOutputFilename({ data: dataObj, type }));
  writeFileSync(outPath, pdf);
  // issue command to open filename in web browser
  const { exec } = await import("node:child_process");
  if (process.platform === "darwin") {
    exec(`open '${outPath}'`);
  } else if (process.platform === "win32") {
    exec(`start "" "${outPath}"`);
  } else {
    exec(`xdg-open '${outPath}'`);
  }
  return outPath;
}

// Main script
// Find the first argument that does not start with '-' or '--' as the data file path
const userArgv = process.argv.slice(2);
const dataPath =
  userArgv.find((arg) => !arg.startsWith("-")) || "./src/data.json";
const isAnon = userArgv.includes("--anon");
const skipPdf = userArgv.includes("--no-pdf");
console.log(
  `Using data file: ${dataPath}${isAnon ? " (anonymized)" : ""}${skipPdf ? " (no PDF/server)" : ""}`,
);

let dataObj: CVData;
try {
  dataObj = parseAndWriteDataFile(
    dataPath,
    path.join(__dirname, "src", "script-data.json"),
  );
  if (isAnon) {
    dataObj = anonymizeData(dataObj);
    console.log("🔒 Data anonymized and written to src/script-data.json");
  } else {
    console.log("✅ Data written to src/script-data.json");
  }
  writeFileSync(
    path.join(__dirname, "src", "script-data.json"),
    JSON.stringify(dataObj, null, 2),
  );
} catch (err) {
  console.error("❌ Failed to process input file:", err);
  process.exit(1);
}

async function main(dataObj) {
  console.log(dataObj.header.name);

  console.log("⏳ Starting Vite server");
  const server = await startViteServer(__dirname);

  console.log("🐾 Opening Puppeteer and generating PDF");
  const outDir = path.join(__dirname, "out");
  const url = server.resolvedUrls?.local[0] as string;
  const browser = await puppeteer.launch();

  await generateAndSavePdf({ url, dataObj, type: "Resume", outDir, browser });
  const coverLetterUrl = new URL("/cover-letter", url).toString();
  await generateAndSavePdf({
    url: coverLetterUrl,
    dataObj,
    type: "CoverLetter",
    outDir,
    browser,
  });
  await browser.close();
  console.log("💾 Saving PDF");

  await server.close();
  console.log("🏁 Done");

  // resetScriptDataJson(path.join(__dirname, "src", "script-data.json"));
  console.log("🔄 src/script-data.json reset to empty object");
}

if (!skipPdf) {
  main(dataObj);
} else {
  console.log("⏩ Skipping server and PDF generation due to --no-pdf flag.");
}
