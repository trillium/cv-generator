import { spawn } from "child_process";
import { pdfJobTracker } from "./pdfJobTracker";
import type { PdfType } from "./pdfSectionMapper";

export interface PdfRebuildResult {
  jobId: string;
  status: "processing";
  message: string;
  pdfsToRegenerate: PdfType[];
}

const recentRebuilds = new Map<string, number>();

export function markRebuildInProgress(directoryPath: string): void {
  recentRebuilds.set(directoryPath, Date.now());
}

export function wasRecentlyRebuilt(
  directoryPath: string,
  withinMs: number,
): boolean {
  const lastRebuild = recentRebuilds.get(directoryPath);
  if (!lastRebuild) return false;
  return Date.now() - lastRebuild < withinMs;
}

export async function rebuildPdfs(
  directoryPath: string,
  pdfsToRegenerate: PdfType[],
): Promise<PdfRebuildResult> {
  markRebuildInProgress(directoryPath);

  console.log(`🔄 Triggering PDF regeneration for: ${directoryPath}`);
  console.log(`📄 Regenerating: ${pdfsToRegenerate.join(", ")}`);

  const pdfJobId = pdfJobTracker.createJob(directoryPath, pdfsToRegenerate);

  const isDev = process.env.NODE_ENV !== "production";
  const mode = isDev ? "dev" : "prod";

  const baseArgs = [
    "scripts/pdf/pdf.ts",
    `--${mode}`,
    `--resumePath=${directoryPath}`,
    `--resumeType=single-column`,
  ];

  const processes = pdfsToRegenerate.map((pdfType) => {
    const pdfArgs = [...baseArgs, `--print=${pdfType}`];
    console.log(`📄 Starting: bun ${pdfArgs.join(" ")}`);

    const child = spawn("bun", pdfArgs, {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stderr = "";

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    return new Promise<{ pdfType: string; success: boolean; error?: string }>(
      (resolve) => {
        child.on("close", (code) => {
          if (code === 0) {
            console.log(`✅ ${pdfType} PDF generation completed`);
            resolve({ pdfType, success: true });
          } else {
            console.error(
              `❌ ${pdfType} PDF generation failed with code ${code}`,
            );
            console.error(stderr);
            resolve({
              pdfType,
              success: false,
              error: `Failed with code ${code}`,
            });
          }
        });

        child.on("error", (error) => {
          console.error(`❌ ${pdfType} PDF generation error:`, error);
          resolve({ pdfType, success: false, error: error.message });
        });
      },
    );
  });

  Promise.all(processes).then((results) => {
    const allSucceeded = results.every((r) => r.success);
    if (allSucceeded) {
      console.log(
        `✅ All PDF generation completed successfully for job ${pdfJobId}`,
      );
      pdfJobTracker.completeJob(pdfJobId, {});
    } else {
      const failures = results.filter((r) => !r.success);
      console.error(
        `❌ PDF generation failed for: ${failures.map((f) => f.pdfType).join(", ")}`,
      );
      pdfJobTracker.failJob(
        pdfJobId,
        `Failed: ${failures.map((f) => `${f.pdfType} (${f.error})`).join(", ")}`,
      );
    }
  });

  return {
    jobId: pdfJobId,
    status: "processing",
    message: "PDF generation started",
    pdfsToRegenerate,
  };
}
