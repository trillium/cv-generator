import puppeteer, { Browser } from "puppeteer";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import path from "node:path";
import type { CVData } from "@/types";
import { parseCliArgs } from "./cli-args";
import { loadAndProcessData } from "./data-loader";
import { buildUrls } from "./url-builder";
import { generateAndSavePdf } from "./pdf-generator";
import { saveMetadata } from "./metadata-writer";

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");

async function main(
  dataObj: CVData,
  resumeType: string,
  resumePath: string,
  printOptions: Array<"resume" | "cover">,
  mode: "dev" | "prod",
) {
  console.log("📊 Data structure:", {
    hasHeader: !!dataObj.header,
    hasInfo: !!dataObj.info,
    headerName: dataObj.header?.name,
    infoName: dataObj.info
      ? `${dataObj.info.firstName} ${dataObj.info.lastName}`
      : undefined,
    topLevelKeys: Object.keys(dataObj),
  });

  let browser: Browser | null = null;

  try {
    const serverUrl =
      mode === "dev"
        ? `http://localhost:${process.env.PORT_DEV || 10300}`
        : `http://localhost:${process.env.PORT_PROD || 10301}`;

    console.log(`🔗 Connecting to ${mode} server at ${serverUrl}`);

    await fetch(serverUrl).catch(() => {
      throw new Error(
        `Server not running at ${serverUrl}. Start it first with pnpm ${mode === "dev" ? "dev" : "start"}`,
      );
    });

    console.log("🐾 Opening Puppeteer and generating PDF");
    const piiPath = process.env.PII_PATH || path.join(projectRoot, "pii");
    const outDir = path.join(piiPath, resumePath);

    const { resumeUrl, coverLetterUrl } = buildUrls(
      serverUrl,
      resumeType,
      resumePath,
    );

    console.log(`📄 Resume URL: ${resumeUrl}`);
    console.log(`📄 Cover Letter URL: ${coverLetterUrl}`);

    browser = await puppeteer.launch();

    const results: Array<{
      type: string;
      pageCount: number;
      lastPageText: string;
      lineBreaks: number;
    }> = [];

    if (printOptions.includes("resume")) {
      const { pageCount, lastPageText, lineBreaks, lastPageLines } =
        await generateAndSavePdf({
          url: resumeUrl,
          dataObj,
          type: "Resume",
          outDir,
          browser,
        });
      results.push({ type: "resume", pageCount, lastPageText, lineBreaks });

      saveMetadata(outDir, "resume", {
        pages: pageCount,
        lastPageText: pageCount > 1 ? lastPageText : undefined,
        lastPageLines: pageCount > 1 ? lastPageLines : undefined,
        lineBreaks: pageCount > 1 ? lineBreaks : undefined,
        generatedAt: new Date().toISOString(),
      });

      if (pageCount > 1) {
        console.log(
          `📄 Resume generated: ${pageCount} page(s), ${lineBreaks} line breaks on last page`,
        );
      } else {
        console.log(`📄 Resume generated: ${pageCount} page`);
      }
    }
    if (printOptions.includes("cover")) {
      const { pageCount, lastPageText, lineBreaks, lastPageLines } =
        await generateAndSavePdf({
          url: coverLetterUrl,
          dataObj,
          type: "CoverLetter",
          outDir,
          browser,
        });
      results.push({ type: "cover", pageCount, lastPageText, lineBreaks });

      saveMetadata(outDir, "coverLetter", {
        pages: pageCount,
        lastPageText: pageCount > 1 ? lastPageText : undefined,
        lastPageLines: pageCount > 1 ? lastPageLines : undefined,
        lineBreaks: pageCount > 1 ? lineBreaks : undefined,
        generatedAt: new Date().toISOString(),
      });

      if (pageCount > 1) {
        console.log(
          `📄 Cover letter generated: ${pageCount} page(s), ${lineBreaks} line breaks on last page`,
        );
      } else {
        console.log(`📄 Cover letter generated: ${pageCount} page`);
      }
    }

    for (const { type, pageCount, lastPageText, lineBreaks } of results) {
      await fetch(`${serverUrl}/api/page-count`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumePath,
          type,
          pageCount,
          lastPageText,
          lineBreaks,
        }),
      }).catch((err) => {
        console.warn(`⚠️  Failed to report page count: ${err.message}`);
      });
    }

    console.log("💾 PDF saved");
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
  }
}

(async () => {
  const { mode, resumePath, isAnon, skipPdf, resumeType, printOptions } =
    await parseCliArgs();

  console.log(
    `Mode: ${mode}
Resume path: ${resumePath}${isAnon ? " (anonymized)" : ""}${skipPdf ? " (no PDF)" : ""}
Resume type: ${resumeType}`,
  );

  const dataObj = await loadAndProcessData(resumePath, isAnon);

  if (!skipPdf) {
    try {
      await main(dataObj, resumeType, resumePath, printOptions, mode);
    } catch (error) {
      console.error("💥 PDF generation failed:", error);
      process.exit(1);
    }
  } else {
    console.log("⏩ Skipping PDF generation due to --no-pdf flag.");
  }
})().catch((error) => {
  console.error("💥 Script execution failed:", error);
  process.exit(1);
});
