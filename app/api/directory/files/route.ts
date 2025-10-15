import { NextRequest, NextResponse } from "next/server";
import { MultiFileManager } from "../../../../lib/multiFileManager";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dirPath = searchParams.get("path") || "";
    const recursive = searchParams.get("recursive") === "true";

    const manager = new MultiFileManager();
    const files = recursive
      ? await manager.listDirectoryFilesRecursive(dirPath)
      : await manager.listDirectoryFiles(dirPath);

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
