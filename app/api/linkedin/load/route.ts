import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path") || "app/linkedIn/linkedin.yml";

    console.log("[LinkedIn API] Loading file:", filePath);

    const fullPath = join(process.cwd(), filePath);
    const content = await readFile(fullPath, "utf-8");

    console.log(
      "[LinkedIn API] File loaded successfully, size:",
      content.length,
    );

    return NextResponse.json({
      success: true,
      content,
      filePath,
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
