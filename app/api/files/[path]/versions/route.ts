import { NextRequest, NextResponse } from "next/server";
import { UnifiedFileManager } from "../../../../../lib/unifiedFileManager";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string }> },
) {
  try {
    const params = await context.params;
    const fileManager = new UnifiedFileManager();
    const versions = await fileManager.getVersions(params.path);

    return NextResponse.json({
      success: true,
      versions,
    });
  } catch (error) {
    console.error("[API /files/:path/versions] Error getting versions:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get versions",
      },
      { status: 500 },
    );
  }
}
