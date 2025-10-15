import { NextRequest, NextResponse } from "next/server";
import { MultiFileManager } from "../../../../lib/multiFileManager";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dirPath = searchParams.get("path");

    if (!dirPath) {
      return NextResponse.json(
        { success: false, error: "Directory path is required" },
        { status: 400 },
      );
    }

    const manager = new MultiFileManager();
    const files = await manager.listDirectoryFiles(dirPath);

    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error) {
    console.error("[API /directory/files GET] Error listing files:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list files",
      },
      { status: 500 },
    );
  }
}
