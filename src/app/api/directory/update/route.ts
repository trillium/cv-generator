import { NextRequest, NextResponse } from "next/server";
import { MultiFileManager } from "@/lib/multiFileManager";
import { spawn } from "child_process";
import { getPdfsToRegenerate } from "@/lib/pdfSectionMapper";
import { pdfJobTracker } from "@/lib/pdfJobTracker";
import { getPiiDirectory } from "@/lib/getPiiPath";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { directoryPath, yamlPath, value } = body;

    if (!directoryPath || !yamlPath || value === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: directoryPath, yamlPath, value",
        },
        { status: 400 },
      );
    }

    const manager = new MultiFileManager();
    const result = await manager.updatePath(directoryPath, yamlPath, value);

    console.log(`📄 File updated: ${result.updatedFile}`);

    const piiPath = getPiiDirectory();
    const updatedFileDir = path.dirname(result.updatedFile);
    const pdfOutputDir = path.relative(piiPath, updatedFileDir);

    console.log(`📁 PDF output directory: ${pdfOutputDir}`);

    const pdfsToRegenerate = getPdfsToRegenerate(yamlPath);

    if (pdfsToRegenerate.length === 0) {
      console.log(`⏭️  Section doesn't affect PDFs, skipping regeneration`);
      return NextResponse.json({
        ...result,
        pdf: { skipped: true, reason: "Section does not affect PDFs" },
      });
    }

    console.log(`🔄 Triggering PDF regeneration for: ${pdfOutputDir}`);
    console.log(`📄 Regenerating: ${pdfsToRegenerate.join(", ")}`);

    const pdfJobId = pdfJobTracker.createJob(pdfOutputDir, pdfsToRegenerate);

    const isDev = process.env.NODE_ENV !== "production";
    const mode = isDev ? "dev" : "prod";

    const baseArgs = [
      "scripts/pdf/pdf.ts",
      `--${mode}`,
      `--resumePath=${pdfOutputDir}`,
      `--resumeType=single-column`,
    ];

    const processes = pdfsToRegenerate.map((pdfType) => {
      const pdfArgs = [...baseArgs, `--print=${pdfType}`];
      console.log(`📄 Starting: tsx ${pdfArgs.join(" ")}`);

      const child = spawn("tsx", pdfArgs, {
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

    return NextResponse.json({
      ...result,
      pdf: {
        jobId: pdfJobId,
        status: "processing",
        message: "PDF generation started",
        pdfsToRegenerate,
      },
    });
  } catch (error) {
    console.error("[API /directory/update POST] Error updating data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update data",
      },
      { status: 500 },
    );
  }
}
