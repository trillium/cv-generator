import puppeteer, { Page, Browser } from "puppeteer";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import path from "node:path";
import { CVData } from "./src/types";
import { anonymizeData } from "./lib/anonymous";
import { parseAndWriteDataFile } from "./lib/parseAndWriteDataFile";
import { allVariants } from "./src/lib/allVariants";
import readline from "readline";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  // // Check number of pages in the PDF buffer
  // const pdfDoc = await getDocument({ data: pdf }).promise;
  // if (pdfDoc.numPages > 1) {
  //   console.log(`⚠️  Warning: Generated PDF for ${type} is ${pdfDoc.numPages} pages.`);
  // }
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

// Parse resumeType from args, default to first in allVariants
const resumeTypeArg = userArgv.find((arg) => arg.startsWith("--resumeType="));

async function promptForResumeType(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    console.log("Please select a resume type:");
    allVariants.forEach((variant, idx) => {
      console.log(`  [${idx + 1}] ${variant}`);
    });
    rl.question("Enter the number of your choice: ", (answer) => {
      const idx = parseInt(answer, 10) - 1;
      rl.close();
      if (idx >= 0 && idx < allVariants.length) {
        resolve(allVariants[idx]);
      } else {
        console.error("❌ Invalid selection.");
        process.exit(1);
      }
    });
  });
}

// Parse print option from args, default to both
const printArg = userArgv.find((arg) => arg.startsWith("--print="));
let printOptions: Array<"resume" | "cover"> = ["resume", "cover"];
if (printArg) {
  const val = printArg.split("=")[1].toLowerCase();
  printOptions = val
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v === "resume" || v === "cover") as Array<
    "resume" | "cover"
  >;
  if (printOptions.length === 0) printOptions = ["resume", "cover"];
}

let resumeTypePromise: Promise<string>;
if (resumeTypeArg) {
  resumeTypePromise = Promise.resolve(resumeTypeArg.split("=")[1]);
} else {
  resumeTypePromise = promptForResumeType();
}

(async () => {
  const resumeType = await resumeTypePromise;
  if (!allVariants.includes(resumeType)) {
    console.error(
      `❌ Invalid resumeType: '${resumeType}'. Valid options: ${allVariants.join(", ")}`,
    );
    process.exit(1);
  }
  console.log(
    `Using data file: ${dataPath}${isAnon ? " (anonymized)" : ""}${skipPdf ? " (no PDF/server)" : ""}\nResume type: ${resumeType}`,
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

  if (!skipPdf) {
    await main(dataObj, resumeType);
  } else {
    console.log("⏩ Skipping server and PDF generation due to --no-pdf flag.");
  }
})();

async function main(dataObj, resumeType) {
  console.log(dataObj.header.name);

  console.log("⏳ Starting Vite server");
  const server = await startViteServer(__dirname);

  console.log("🐾 Opening Puppeteer and generating PDF");
  const outDir = path.join(__dirname, "out");
  const url = new URL(
    `/${resumeType}/resume`,
    server.resolvedUrls?.local[0] as string,
  ).toString();
  const browser = await puppeteer.launch();

  if (printOptions.includes("resume")) {
    await generateAndSavePdf({ url, dataObj, type: "Resume", outDir, browser });
  }
  if (printOptions.includes("cover")) {
    const coverLetterUrl = new URL(
      `/${resumeType}/cover-letter`,
      server.resolvedUrls?.local[0] as string,
    ).toString();
    await generateAndSavePdf({
      url: coverLetterUrl,
      dataObj,
      type: "CoverLetter",
      outDir,
      browser,
    });
  }
  await browser.close();
  console.log("💾 Saving PDF");

  await server.close();
  console.log("🏁 Done");

  resetScriptDataJson(path.join(__dirname, "src", "script-data.json"));
  console.log("🔄 src/script-data.json reset to empty object");
}
