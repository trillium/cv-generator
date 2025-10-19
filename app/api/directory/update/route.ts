import { NextRequest, NextResponse } from "next/server";
import { MultiFileManager } from "@/lib/multiFileManager";
import { spawn } from "child_process";

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
    console.log(`🔄 Triggering PDF regeneration for: ${directoryPath}`);

    const isDev = process.env.NODE_ENV !== "production";
    const mode = isDev ? "dev" : "prod";

    const pdfArgs = [
      "pdf",
      `--${mode}`,
      `--resumePath=${directoryPath}`,
      `--resumeType=single-column`,
    ];

    console.log(`📄 Running: pnpm ${pdfArgs.join(" ")}`);

    const pdfResult = await new Promise<{
      success: boolean;
      pageCount?: number;
      error?: string;
    }>((resolve) => {
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

          console.log(`✅ PDF generation completed successfully`);
          resolve({ success: true, pageCount });
        } else {
          console.error(`❌ PDF generation failed with code ${code}`);
          console.error(stderr);
          resolve({
            success: false,
            error: `PDF generation failed with code ${code}`,
          });
        }
      });

      child.on("error", (error) => {
        console.error(`❌ PDF generation error:`, error);
        resolve({ success: false, error: error.message });
      });
    });

    return NextResponse.json({
      ...result,
      pdf: pdfResult,
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
