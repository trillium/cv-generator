import { NextRequest, NextResponse } from "next/server";
import { writeFileSync } from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { yamlContent } = await request.json();

    if (!yamlContent) {
      return NextResponse.json(
        { error: "YAML content is required" },
        { status: 400 },
      );
    }

    const piiPath = process.env.PII_PATH;
    if (!piiPath) {
      return NextResponse.json(
        { error: "PII_PATH environment variable is not set" },
        { status: 500 },
      );
    }

    const filePath = path.join(piiPath, "data.yml");

    // Write the YAML content to the file
    writeFileSync(filePath, yamlContent, "utf8");

    return NextResponse.json({
      success: true,
      message: "YAML data saved successfully",
    });
  } catch (error) {
    console.error("Error saving YAML data:", error);
    return NextResponse.json(
      {
        error: "Failed to save YAML data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
