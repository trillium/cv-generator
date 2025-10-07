import { NextRequest, NextResponse } from "next/server";
import { UnifiedFileManager } from "../../../../../lib/unifiedFileManager";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string }> },
) {
  try {
    const params = await context.params;
    const fileManager = new UnifiedFileManager();
    await fileManager.discard(params.path);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "[API /files/:path/discard] Error discarding changes:",
      error,
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to discard changes",
      },
      { status: 500 },
    );
  }
}
