import { NextRequest, NextResponse } from "next/server";
import { writeFile, writeYamlFile } from "./writeFile";
import { getAllFiles } from "./getFiles";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const directory =
      searchParams.get("directory") || process.env.PII_PATH || ".";
    console.log("[directory]", directory);

    const result = await getAllFiles(directory);

    return NextResponse.json({
      success: true,
      directory,
      allFiles: result.allFiles,
      mainDirFiles: result.mainDirFiles,
      resumeFiles: result.resumeFiles,
      totalFiles: result.totalFiles,
    });
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, yamlContent, filePath, directory, createDiff = true } = body;

    if ((!data && !yamlContent) || !filePath) {
      return NextResponse.json(
        {
          success: false,
          error: "Either data or yamlContent and filePath are required",
        },
        { status: 400 },
      );
    }

    console.log("[POST] Writing file:", filePath);
    console.log("[POST] To directory:", directory || process.env.PII_PATH);
    console.log("[POST] Method:", yamlContent ? "Direct YAML" : "JSON to YAML");

    let result;

    if (yamlContent) {
      // Write YAML content directly
      result = await writeYamlFile(yamlContent, {
        filePath,
        baseDirectory: directory,
        createDiff,
      });
    } else {
      // Convert JSON to YAML and write
      result = await writeFile(data, {
        filePath,
        baseDirectory: directory,
        createDiff,
      });
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "File written successfully",
        filePath: result.filePath,
        fileExisted: result.fileExisted,
        diffCreated: result.diffCreated,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
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
