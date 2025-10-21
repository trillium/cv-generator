import { NextRequest, NextResponse } from "next/server";
import { MultiFileManager } from "@/lib/multiFileManager";

export async function POST(request: NextRequest) {
  try {
    const { sourceFilePath, sectionKeys, targetFileName, mergedData } =
      await request.json();

    if (!sourceFilePath || !sectionKeys || !targetFileName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: sourceFilePath, sectionKeys, and targetFileName",
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(sectionKeys) || sectionKeys.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "sectionKeys must be a non-empty array",
        },
        { status: 400 },
      );
    }

    const manager = new MultiFileManager();
    const result = await manager.splitSectionToFile(
      sourceFilePath,
      sectionKeys,
      targetFileName,
      mergedData,
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
