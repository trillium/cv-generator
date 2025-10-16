import { NextRequest, NextResponse } from "next/server";
import { UnifiedFileManager } from "@/lib/unifiedFileManager";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string }> },
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { name, suffix, autoIncrement } = body;

    const fileManager = new UnifiedFileManager();
    const result = await fileManager.duplicate(params.path, {
      name,
      suffix,
      autoIncrement,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "[API /files/:path/duplicate] Error duplicating file:",
      error,
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to duplicate file",
      },
      { status: 500 },
    );
  }
}
