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

    const child = spawn("pnpm", pdfArgs, {
      cwd: process.cwd(),
      detached: true,
      stdio: "ignore",
    });
    child.unref();

    return NextResponse.json({
      ...result,
      pdfTriggered: true,
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
