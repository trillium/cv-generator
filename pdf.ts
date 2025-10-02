import puppeteer, { Page, Browser } from "puppeteer";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawn, exec } from "node:child_process";
import { config } from "dotenv";
import path from "node:path";
import { CVData } from "./src/types";
import { anonymizeData } from "./lib/anonymous";
import { parseAndWriteDataFile } from "./lib/parseAndWriteDataFile";
import { allVariants } from "./lib/allVariants";
import readline from "readline";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { encodeFilePathForUrl } from "./src/utils/urlSafeEncoding";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// Load environment variables from .env file
config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function killProcessOnPort(port: number): Promise<void> {
  try {
    if (process.platform === "win32") {
      // Windows
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout
        .split("\n")
        .filter((line) => line.includes("LISTENING"));
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(Number(pid))) {
          await execAsync(`taskkill /PID ${pid} /F`);
          console.log(`🔥 Killed process ${pid} on port ${port}`);
        }
      }
    } else {
      // macOS/Linux
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      const pids = stdout
        .trim()
        .split("\n")
        .filter((pid) => pid);
      for (const pid of pids) {
        if (pid && !isNaN(Number(pid))) {
          await execAsync(`kill -9 ${pid}`);
          console.log(`🔥 Killed process ${pid} on port ${port}`);
        }
      }
    }
  } catch (error) {
    // No process found on port, which is fine
    console.log(`✅ No process found on port ${port}`);
  }
}

async function startNextServer(rootDir: string, preferredPort: number = 7542) {
  // First try to kill any existing process on the preferred port
  await killProcessOnPort(preferredPort);

  // Try to find an available port starting from the preferred port
  let port = preferredPort;
  const maxAttempts = 5; // Reduced attempts since we're cleaning up first

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`🚀 Attempting to start Next.js server on port ${port}...`);

      const nextProcess = spawn("pnpm", ["dev", "-p", port.toString()], {
        cwd: rootDir,
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Wait for the server to be ready
      const result = await new Promise<{ process: any; url: string }>(
        (resolve, reject) => {
          let resolved = false;
          const timeout = setTimeout(() => {
            if (!resolved) {
              nextProcess.kill();
              reject(
                new Error(
                  `Next.js server failed to start on port ${port} within 30 seconds`,
                ),
              );
            }
          }, 30000);

          nextProcess.stdout?.on("data", (data) => {
            const output = data.toString();
            if (output.includes("Local:") || output.includes("Ready")) {
              console.log(output.trim());
            }
            if (output.includes("Ready") && !resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve({
                process: nextProcess,
                url: `http://localhost:${port}`,
              });
            }
          });

          nextProcess.stderr?.on("data", (data) => {
            const errorOutput = data.toString();

            // Only log actual errors, not info messages
            if (
              errorOutput.includes("Error") ||
              errorOutput.includes("EADDRINUSE")
            ) {
              console.error(errorOutput.trim());
            }

            // Check for port in use error
            if (
              errorOutput.includes("EADDRINUSE") ||
              errorOutput.includes("address already in use")
            ) {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                nextProcess.kill();
                reject(new Error(`Port ${port} is already in use`));
              }
            }
          });

          nextProcess.on("error", (error) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              reject(error);
            }
          });

          nextProcess.on("exit", (code) => {
            if (code !== 0 && !resolved) {
              resolved = true;
              clearTimeout(timeout);
              reject(new Error(`Next.js process exited with code ${code}`));
            }
          });
        },
      );

      console.log(`✅ Successfully started Next.js server on port ${port}`);
      return result;
    } catch (error) {
      console.log(
        `❌ Failed to start server on port ${port}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );

      if (attempt === maxAttempts - 1) {
        console.error(
          `💥 Failed to start server after ${maxAttempts} attempts`,
        );
        console.error(
          `💡 Try manually stopping any processes using ports ${preferredPort}-${port} and run again`,
        );
        process.exit(1);
      }

      // Try next port
      port++;
      console.log(`🔄 Trying port ${port}...`);

      // Try to kill process on the new port too
      await killProcessOnPort(port);
    }
  }

  throw new Error(`Failed to start server after ${maxAttempts} attempts`);
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
// Usage examples:
//   node pdf.ts                                           # Use default data.yml
//   node pdf.ts /path/to/data.yml                        # Use specific data file
//   node pdf.ts --resumeType=single-column               # Specify layout
//   node pdf.ts --resumePath=resumes-ashes-frontend-developer-ashes-meta-ashes-2025-02-01-ashes-data  # Use specific resume from dynamic route
//   node pdf.ts --print=resume                           # Generate only resume PDF
//   node pdf.ts --print=cover                            # Generate only cover letter PDF
//   node pdf.ts --anon                                   # Anonymize data
//   node pdf.ts --no-pdf                                 # Skip PDF generation
//
// Find the first argument that does not start with '-' or '--' as the data file path
const userArgv = process.argv.slice(2);
const defaultDataPath = process.env.PII_PATH
  ? path.join(process.env.PII_PATH, "data.yml")
  : "./src/data.json";
const dataPath =
  userArgv.find((arg) => !arg.startsWith("-")) || defaultDataPath;
const isAnon = userArgv.includes("--anon");
const skipPdf = userArgv.includes("--no-pdf");

// Parse resumeType from args, default to first in allVariants
const resumeTypeArg = userArgv.find((arg) => arg.startsWith("--resumeType="));

// Parse resumePath from args for dynamic routes
const resumePathArg = userArgv.find((arg) => arg.startsWith("--resumePath="));

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

  // Parse resumePath if provided
  const resumePath = resumePathArg ? resumePathArg.split("=")[1] : null;

  console.log(
    `Using data file: ${dataPath}${isAnon ? " (anonymized)" : ""}${skipPdf ? " (no PDF/server)" : ""}
Resume type: ${resumeType}${
      resumePath
        ? `
Resume path: ${resumePath}`
        : ""
    }`,
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
    try {
      await main(dataObj, resumeType, resumePath || undefined);
    } catch (error) {
      console.error("💥 PDF generation failed:", error);
      process.exit(1);
    }
  } else {
    console.log("⏩ Skipping server and PDF generation due to --no-pdf flag.");
  }
})().catch((error) => {
  console.error("💥 Script execution failed:", error);
  process.exit(1);
});

async function main(dataObj: CVData, resumeType: string, resumePath?: string) {
  console.log(dataObj.header.name);

  let server: { process: any; url: string } | null = null;
  let browser: Browser | null = null;

  try {
    console.log("⏳ Starting Next.js server");
    server = await startNextServer(__dirname);

    console.log("🐾 Opening Puppeteer and generating PDF");
    const outDir = path.join(__dirname, "out");

    // Build URLs based on whether resumePath is provided
    let resumeUrl: string;
    let coverLetterUrl: string;

    if (resumePath) {
      // Ensure the resumePath is URL-encoded for the dynamic route
      const encodedResumePath = resumePath.includes("-ashes-")
        ? resumePath // Already encoded
        : encodeFilePathForUrl(resumePath); // Encode if not already encoded

      // Use dynamic routes with specific resume path
      resumeUrl = new URL(
        `/${resumeType}/resume/${encodedResumePath}`,
        server.url,
      ).toString();
      coverLetterUrl = new URL(
        `/${resumeType}/cover-letter/${encodedResumePath}`,
        server.url,
      ).toString();
      console.log(
        `📄 Using specific resume path: ${resumePath} (encoded: ${encodedResumePath})`,
      );
    } else {
      // Use default routes
      resumeUrl = new URL(`/${resumeType}/resume`, server.url).toString();
      coverLetterUrl = new URL(
        `/${resumeType}/cover-letter`,
        server.url,
      ).toString();
      console.log(`📄 Using default data.yml`);
    }

    browser = await puppeteer.launch();

    if (printOptions.includes("resume")) {
      await generateAndSavePdf({
        url: resumeUrl,
        dataObj,
        type: "Resume",
        outDir,
        browser,
      });
    }
    if (printOptions.includes("cover")) {
      await generateAndSavePdf({
        url: coverLetterUrl,
        dataObj,
        type: "CoverLetter",
        outDir,
        browser,
      });
    }

    console.log("💾 Saving PDF");
    console.log("🏁 Done");
  } catch (error) {
    console.error("💥 Error during PDF generation:", error);
    throw error;
  } finally {
    // Cleanup resources
    if (browser) {
      try {
        await browser.close();
        console.log("� Browser closed");
      } catch (err) {
        console.error("⚠️  Error closing browser:", err);
      }
    }

    if (server) {
      try {
        server.process.kill();
        console.log("🛑 Server stopped");
      } catch (err) {
        console.error("⚠️  Error stopping server:", err);
      }
    }

    // Reset the script data file
    try {
      resetScriptDataJson(path.join(__dirname, "src", "script-data.json"));
      console.log("🔄 src/script-data.json reset to empty object");
    } catch (err) {
      console.error("⚠️  Error resetting script-data.json:", err);
    }
  }
}
