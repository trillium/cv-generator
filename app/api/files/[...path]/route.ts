import { NextRequest, NextResponse } from "next/server";
import { UnifiedFileManager } from "../../../../lib/unifiedFileManager";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import * as yaml from "js-yaml";

const getFileManager = () => new UnifiedFileManager();

/**
 * GET /api/files/[...path]
 * Handles:
 * - GET /api/files/[path] - Load file content
 * - GET /api/files/[path]/versions - Get version history
 * - GET /api/files/[path]/diff - Get diff between versions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path;
    const lastSegment = pathSegments[pathSegments.length - 1];
    const fileManager = getFileManager();

    if (lastSegment === "versions") {
      const filePath = pathSegments.slice(0, -1).join("/");
      const versions = await fileManager.getVersions(filePath);
      return NextResponse.json({ success: true, versions });
    }

    if (lastSegment === "diff") {
      const filePath = pathSegments.slice(0, -1).join("/");
      const { searchParams } = new URL(request.url);
      const from = searchParams.get("from") || "current";
      const to = searchParams.get("to") || "current";
      const diff = await fileManager.getDiff(filePath, from, to);
      return NextResponse.json({ success: true, ...diff });
    }

    const filePath = pathSegments.join("/");
    const fileContent = await fileManager.read(filePath);
    return NextResponse.json({ success: true, ...fileContent });
  } catch (error) {
    console.error("[API /files/[...path]] GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/files/[...path]
 * Handles:
 * - POST /api/files/[path] - Save file content
 * - POST /api/files/[path]/metadata - Update metadata
 * - POST /api/files/[path]/duplicate - Duplicate file
 * - POST /api/files/[path]/restore - Restore from backup
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path;
    const lastSegment = pathSegments[pathSegments.length - 1];
    const fileManager = getFileManager();

    if (lastSegment === "metadata") {
      const filePath = pathSegments.slice(0, -1).join("/");
      const { metadata } = await request.json();
      const piiPath = process.env.PII_PATH || join(process.cwd(), "pii");
      const fullPath = join(piiPath, filePath);
      const content = await readFile(fullPath, "utf-8");
      const data = yaml.load(content) as Record<string, unknown>;
      data.metadata = metadata;
      const updatedYaml = yaml.dump(data, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        skipInvalid: true,
      });
      await writeFile(fullPath, updatedYaml, "utf-8");
      return NextResponse.json({
        success: true,
        message: "Metadata updated successfully",
      });
    }

    if (lastSegment === "duplicate") {
      const filePath = pathSegments.slice(0, -1).join("/");
      const { name, suffix, autoIncrement } = await request.json();
      const result = await fileManager.duplicate(filePath, {
        name,
        suffix,
        autoIncrement,
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (lastSegment === "restore") {
      const filePath = pathSegments.slice(0, -1).join("/");
      const { version } = await request.json();
      if (!version) {
        return NextResponse.json(
          { success: false, error: "version is required" },
          { status: 400 },
        );
      }
      await fileManager.restore(filePath, version);
      return NextResponse.json({
        success: true,
        message: "File restored successfully",
        restoredFrom: version,
      });
    }

    const filePath = pathSegments.join("/");
    const { content, commit, message, tags, createBackup } =
      await request.json();

    if (!content) {
      return NextResponse.json(
        { success: false, error: "content is required" },
        { status: 400 },
      );
    }

    const result = await fileManager.save(filePath, content, {
      commit,
      message,
      tags,
      createBackup,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[API /files/[...path]] POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/files/[...path]
 * Handles:
 * - PUT /api/files/[path]/commit - Commit temporary changes
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path;
    const lastSegment = pathSegments[pathSegments.length - 1];
    const fileManager = getFileManager();

    if (lastSegment === "commit") {
      const filePath = pathSegments.slice(0, -1).join("/");
      const { message } = await request.json();
      const result = await fileManager.commit(filePath, message);
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json(
      { success: false, error: "Invalid PUT operation" },
      { status: 400 },
    );
  } catch (error) {
    console.error("[API /files/[...path]] PUT error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/files/[...path]
 * Handles:
 * - DELETE /api/files/[path] - Delete file
 * - DELETE /api/files/[path]/discard - Discard temporary changes
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path;
    const lastSegment = pathSegments[pathSegments.length - 1];
    const fileManager = getFileManager();

    if (lastSegment === "discard") {
      const filePath = pathSegments.slice(0, -1).join("/");
      await fileManager.discard(filePath);
      return NextResponse.json({
        success: true,
        message: "Changes discarded successfully",
      });
    }

    const filePath = pathSegments.join("/");
    const { searchParams } = new URL(request.url);
    const createBackup = searchParams.get("createBackup") !== "false";
    await fileManager.delete(filePath, createBackup);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("[API /files/[...path]] DELETE error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 },
    );
  }
}
