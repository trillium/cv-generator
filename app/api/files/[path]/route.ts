import { NextRequest, NextResponse } from "next/server";
import { UnifiedFileManager } from "@/lib/unifiedFileManager";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string }> },
) {
  try {
    const params = await context.params;
    const fileManager = new UnifiedFileManager();
    const fileContent = await fileManager.read(params.path);

    return NextResponse.json({
      success: true,
      content: fileContent.content,
      metadata: fileContent.metadata,
      versions: fileContent.versions,
      hasUnsavedChanges: fileContent.hasUnsavedChanges,
    });
  } catch (error) {
    console.error("[API /files/:path GET] Error reading file:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to read file",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string }> },
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { content, commit = false, message, tags } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Content is required" },
        { status: 400 },
      );
    }

    const fileManager = new UnifiedFileManager();
    const result = await fileManager.save(params.path, content, {
      commit,
      message,
      tags,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[API /files/:path POST] Error saving file:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save file",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string }> },
) {
  try {
    const params = await context.params;
    const fileManager = new UnifiedFileManager();
    await fileManager.delete(params.path, true);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[API /files/:path DELETE] Error deleting file:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete file",
      },
      { status: 500 },
    );
  }
}
