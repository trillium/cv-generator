import { Page, Browser } from "puppeteer";
import { writeFileSync } from "node:fs";
import { exec } from "node:child_process";
import path from "node:path";
import type { CVData } from "@/types";
import { ensureDirectoryExists, getOutputFilename } from "./file-utils";

export async function generatePdf(url: string, pdfOptions: object, page: Page) {
  await page.goto(url, { waitUntil: "networkidle0" });
  const pdf = await page.pdf(pdfOptions);
  return pdf;
}

export async function generateAndSavePdf({
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

  if (process.platform === "darwin") {
    exec(`open '${outPath}'`);
  } else if (process.platform === "win32") {
    exec(`start "" "${outPath}"`);
  } else {
    exec(`xdg-open '${outPath}'`);
  }

  return outPath;
}
