import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filePath, content } = body;

    if (!filePath || !content) {
      return NextResponse.json(
        { success: false, error: "filePath and content are required" },
        { status: 400 },
      );
    }

    const piiPath = process.env.PII_PATH || join(process.cwd(), "pii");

    console.log(
      "[LinkedIn API] Saving file:",
      filePath,
      "to PII path:",
      piiPath,
    );
    console.log("[LinkedIn API] Content length:", content.length);

    const fullPath = join(piiPath, filePath);

    await writeFile(fullPath, content, "utf-8");

    console.log("[LinkedIn API] File saved successfully");

    return NextResponse.json({
      success: true,
      message: "LinkedIn data saved successfully",
      filePath,
    });
  } catch (error) {
    console.error("[LinkedIn API] Error saving file:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
