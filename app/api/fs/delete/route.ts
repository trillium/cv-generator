import { NextRequest, NextResponse } from "next/server";
import { deleteFile } from "../deleteFile";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("filePath");
    const directory = searchParams.get("directory");
    const createBackup = searchParams.get("createBackup") !== "false";

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: "filePath parameter is required" },
        { status: 400 },
      );
    }

    console.log("[DELETE] Deleting file:", filePath);
    console.log("[DELETE] From directory:", directory || process.env.PII_PATH);

    const result = await deleteFile({
      filePath,
      baseDirectory: directory || undefined,
      createBackup,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "File deleted successfully",
        filePath: result.filePath,
        backupCreated: result.backupCreated,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
