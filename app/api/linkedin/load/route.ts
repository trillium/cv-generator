import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("path") || "linkedin.yml";
    const piiPath = process.env.PII_PATH || join(process.cwd(), "pii");

    console.log(
      "[LinkedIn API] Loading file:",
      fileName,
      "from PII path:",
      piiPath,
    );

    const fullPath = join(piiPath, fileName);
    const content = await readFile(fullPath, "utf-8");

    console.log(
      "[LinkedIn API] File loaded successfully, size:",
      content.length,
    );

    return NextResponse.json({
      success: true,
      content,
      filePath: fileName,
    });
  } catch (error) {
    console.error("[LinkedIn API] Error loading file:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
