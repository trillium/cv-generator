import { NextRequest, NextResponse } from "next/server";
import { MultiFileManager } from "../../../../lib/multiFileManager";

export async function POST(request: NextRequest) {
  try {
    const { sourceFilePath, sectionKey, targetFileName } = await request.json();

    if (!sourceFilePath || !sectionKey || !targetFileName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: sourceFilePath, sectionKey, and targetFileName",
        },
        { status: 400 },
      );
    }

    const manager = new MultiFileManager();
    const result = await manager.splitSectionToFile(
      sourceFilePath,
      sectionKey,
      targetFileName,
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      targetPath: result.targetPath,
    });
  } catch (error) {
    console.error("[API /directory/split] Error splitting section:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to split section",
      },
      { status: 500 },
    );
  }
}
