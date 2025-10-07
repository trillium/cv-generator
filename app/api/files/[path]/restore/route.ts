import { NextRequest, NextResponse } from "next/server";
import { UnifiedFileManager } from "../../../../../lib/unifiedFileManager";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string }> },
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { version } = body;

    if (!version) {
      return NextResponse.json(
        { success: false, error: "Version is required" },
        { status: 400 },
      );
    }

    const fileManager = new UnifiedFileManager();
    await fileManager.restore(params.path, version);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[API /files/:path/restore] Error restoring version:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to restore version",
      },
      { status: 500 },
    );
  }
}
