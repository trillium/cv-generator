import puppeteer, { Browser } from "puppeteer";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import path from "node:path";
import type { CVData } from "@/types";
import { parseCliArgs } from "./cli-args";
import { loadAndProcessData } from "./data-loader";
import { startNextServer } from "./server";
import { buildUrls } from "./url-builder";
import { generateAndSavePdf } from "./pdf-generator";
import { resetScriptDataJson } from "./file-utils";

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");

async function main(
  dataObj: CVData,
  resumeType: string,
  resumePath: string,
  printOptions: Array<"resume" | "cover">,
) {
  console.log(dataObj.header.name);

  let server: {
    process: import("node:child_process").ChildProcess;
    url: string;
  } | null = null;
  let browser: Browser | null = null;

  try {
    console.log("⏳ Starting Next.js server");
    server = await startNextServer(projectRoot);

    console.log("🐾 Opening Puppeteer and generating PDF");
    const outDir = path.join(projectRoot, "out");

    const { resumeUrl, coverLetterUrl } = buildUrls(
      server.url,
      resumeType,
      resumePath,
    );

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
    if (browser) {
      try {
        await browser.close();
        console.log("🔒 Browser closed");
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

    try {
      resetScriptDataJson(path.join(projectRoot, "src", "script-data.json"));
      console.log("🔄 src/script-data.json reset to empty object");
    } catch (err) {
      console.error("⚠️  Error resetting script-data.json:", err);
    }
  }
}

(async () => {
  const { resumePath, isAnon, skipPdf, resumeType, printOptions } =
    await parseCliArgs();

  console.log(
    `Resume path: ${resumePath}${isAnon ? " (anonymized)" : ""}${skipPdf ? " (no PDF/server)" : ""}
Resume type: ${resumeType}`,
  );

  const scriptDataJsonPath = path.join(projectRoot, "src", "script-data.json");
  const dataObj = await loadAndProcessData(
    resumePath,
    scriptDataJsonPath,
    isAnon,
  );

  if (!skipPdf) {
    try {
      await main(dataObj, resumeType, resumePath, printOptions);
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
