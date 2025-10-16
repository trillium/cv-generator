import { NextRequest, NextResponse } from "next/server";
import { UnifiedFileManager } from "@/lib/unifiedFileManager";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string }> },
) {
  try {
    const params = await context.params;
    const body = await request.json();
    const { message } = body;

    const fileManager = new UnifiedFileManager();
    const result = await fileManager.commit(params.path, message);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[API /files/:path/commit] Error committing changes:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to commit changes",
      },
      { status: 500 },
    );
  }
}
