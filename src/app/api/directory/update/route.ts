import { NextRequest, NextResponse } from "next/server";
import { MultiFileManager } from "@/lib/multiFileManager";
import { spawn } from "child_process";
import { getPdfsToRegenerate } from "@/lib/pdfSectionMapper";
import { pdfJobTracker } from "@/lib/pdfJobTracker";

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

    const pdfsToRegenerate = getPdfsToRegenerate(yamlPath);

    if (pdfsToRegenerate.length === 0) {
      console.log(`⏭️  Section doesn't affect PDFs, skipping regeneration`);
      return NextResponse.json({
        ...result,
        pdf: { skipped: true, reason: "Section does not affect PDFs" },
      });
    }

    console.log(`🔄 Triggering PDF regeneration for: ${directoryPath}`);
    console.log(`📄 Regenerating: ${pdfsToRegenerate.join(", ")}`);

    const pdfJobId = pdfJobTracker.createJob(directoryPath, pdfsToRegenerate);

    const isDev = process.env.NODE_ENV !== "production";
    const mode = isDev ? "dev" : "prod";

    const pdfArgs = [
      "pdf",
      `--${mode}`,
      `--resumePath=${directoryPath}`,
      `--resumeType=single-column`,
      `--print=${pdfsToRegenerate.join(",")}`,
    ];

    console.log(`📄 Running: pnpm ${pdfArgs.join(" ")}`);
    console.log(`🆔 PDF Job ID: ${pdfJobId}`);

    const child = spawn("pnpm", pdfArgs, {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        const pageCountMatch = stdout.match(/(\d+) page/);
        const pageCount = pageCountMatch
          ? parseInt(pageCountMatch[1], 10)
          : undefined;

        console.log(
          `✅ PDF generation completed successfully for job ${pdfJobId}`,
        );
        pdfJobTracker.completeJob(pdfJobId, { pageCount });
      } else {
        console.error(
          `❌ PDF generation failed with code ${code} for job ${pdfJobId}`,
        );
        console.error(stderr);
        pdfJobTracker.failJob(
          pdfJobId,
          `PDF generation failed with code ${code}`,
        );
      }
    });

    child.on("error", (error) => {
      console.error(`❌ PDF generation error for job ${pdfJobId}:`, error);
      pdfJobTracker.failJob(pdfJobId, error.message);
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
