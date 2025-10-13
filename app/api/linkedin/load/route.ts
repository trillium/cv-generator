import { NextRequest } from "next/server";
import { UnifiedFileManager } from "../../../../lib/unifiedFileManager";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");
  if (!path) {
    return Response.json(
      { success: false, error: "Missing path param" },
      { status: 400 },
    );
  }
  try {
    const fileManager = new UnifiedFileManager();
    const fileContent = await fileManager.read(path);
    return Response.json({ success: true, content: fileContent.content });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 404 },
    );
  }
}
