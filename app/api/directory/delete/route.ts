import { NextRequest, NextResponse } from "next/server";
import { MultiFileManager } from "../../../../lib/multiFileManager";

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: filePath",
        },
        { status: 400 },
      );
    }

    const manager = new MultiFileManager();
    const result = await manager.deleteFile(filePath);

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
      deletedPath: result.deletedPath,
    });
  } catch (error) {
    console.error("[API /directory/delete] Error deleting file:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete file",
      },
      { status: 500 },
    );
  }
}
