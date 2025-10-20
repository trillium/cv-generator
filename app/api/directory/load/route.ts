import { NextRequest, NextResponse } from "next/server";
import { MultiFileManager } from "@/lib/multiFileManager";

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
    const result = await manager.loadDirectory(dirPath);

    return NextResponse.json({
      success: true,
      data: result.data,
      sources: result.sources,
      metadata: result.metadata,
      pdfMetadata: result.pdfMetadata,
    });
  } catch (error) {
    console.error("[API /directory/load GET] Error loading directory:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to load directory",
      },
      { status: 500 },
    );
  }
}
