import { NextRequest, NextResponse } from "next/server";
import { UnifiedFileManager } from "../../../../../lib/unifiedFileManager";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string }> },
) {
  try {
    const params = await context.params;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        {
          success: false,
          error: "Both 'from' and 'to' parameters are required",
        },
        { status: 400 },
      );
    }

    const fileManager = new UnifiedFileManager();
    const diff = await fileManager.getDiff(params.path, from, to);

    return NextResponse.json({
      success: true,
      ...diff,
    });
  } catch (error) {
    console.error("[API /files/:path/diff] Error getting diff:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get diff",
      },
      { status: 500 },
    );
  }
}
