import { NextRequest, NextResponse } from "next/server";
import { MultiFileManager } from "@/lib/multiFileManager";
import { getPdfsToRegenerate } from "@/lib/pdfSectionMapper";
import { rebuildPdfs } from "@/lib/pdfRebuilder";

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

    console.log(`📄 File updated: ${result.updatedFile}`);

    const pdfOutputDir = directoryPath;

    console.log(`📁 PDF output directory: ${pdfOutputDir}`);

    const pdfsToRegenerate = getPdfsToRegenerate(yamlPath);

    if (pdfsToRegenerate.length === 0) {
      console.log(`⏭️  Section doesn't affect PDFs, skipping regeneration`);
      return NextResponse.json({
        ...result,
        pdf: { skipped: true, reason: "Section does not affect PDFs" },
      });
    }

    const pdfResult = await rebuildPdfs(pdfOutputDir, pdfsToRegenerate);

    return NextResponse.json({
      ...result,
      pdf: pdfResult,
    });
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
