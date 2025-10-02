import { NextRequest, NextResponse } from "next/server";
import { UnifiedFileManager } from "../../../../lib/unifiedFileManager";
import { FileFilters } from "../../../../src/types/fileManager";

const getFileManager = () => new UnifiedFileManager();

/**
 * GET /api/files
 * List all YAML files with rich metadata
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as
      | "resume"
      | "linkedin"
      | "other"
      | null;
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);
    const search = searchParams.get("search");

    const filters: FileFilters = {};
    if (type) filters.type = type;
    if (tags && tags.length > 0) filters.tags = tags;
    if (search) filters.search = search;

    const fileManager = getFileManager();
    const files = await fileManager.list(filters);

    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error) {
    console.error("[API /files] Error listing files:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list files",
      },
      { status: 500 },
    );
  }
}
