import { NextRequest, NextResponse } from "next/server";
import { MultiFileManager } from "@/lib/multiFileManager";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { directoryPath, yamlPath, value } = body;

    if (!directoryPath || !yamlPath || value === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: directoryPath, yamlPath, value",
        },
        { status: 400 },
      );
    }

    const manager = new MultiFileManager();
    const result = await manager.updatePath(directoryPath, yamlPath, value);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /directory/update POST] Error updating data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update data",
      },
      { status: 500 },
    );
  }
}
