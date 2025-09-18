import { NextRequest, NextResponse } from "next/server";
import { FileSystemManager } from "../../../lib/fileSystemManager";

// Create a new instance for each request to ensure fresh data
const getFileManager = () => new FileSystemManager();

export async function GET() {
  try {
    console.log(`📖 [YAML-DATA API] GET request received`);
    const fileManager = getFileManager();
    const state = fileManager.getCurrentState();

    console.log(`📊 [YAML-DATA API] Current state:`);
    console.log(`   - Has changes: ${state.hasChanges}`);
    console.log(`   - Content length: ${state.yamlContent.length} chars`);
    console.log(`   - Last modified: ${state.lastModified.toISOString()}`);

    return NextResponse.json({
      yamlContent: state.yamlContent,
      hasChanges: state.hasChanges,
      lastModified: state.lastModified.toISOString(),
      changelog: fileManager.getRecentChangelog(10),
      fileStats: fileManager.getFileStats(),
    });
  } catch (error) {
    console.error("❌ [YAML-DATA API] Error getting YAML data:", error);
    return NextResponse.json(
      {
        error: `Failed to load YAML data: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { yamlContent, createBackup = true } = await request.json();

    console.log(`✏️  [YAML-DATA API] POST request received`);
    console.log(`   - Content length: ${yamlContent?.length || 0} chars`);
    console.log(`   - Create backup: ${createBackup}`);
    console.log(`   - Content preview: ${yamlContent?.substring(0, 100)}...`);

    if (!yamlContent) {
      console.log(`❌ [YAML-DATA API] Missing yamlContent in request`);
      return NextResponse.json(
        { error: "yamlContent is required" },
        { status: 400 },
      );
    }

    const fileManager = getFileManager();

    // Log state before saving
    const beforeState = fileManager.getCurrentState();
    console.log(`📊 [YAML-DATA API] State before save:`);
    console.log(`   - Has changes: ${beforeState.hasChanges}`);
    console.log(
      `   - Current content length: ${beforeState.yamlContent.length} chars`,
    );

    // Save the content immediately to the file system
    console.log(`💾 [YAML-DATA API] Saving content to file system...`);
    const changelogEntry = fileManager.saveYamlContent(
      yamlContent,
      createBackup,
    );
    console.log(`📝 [YAML-DATA API] Changelog entry created:`, changelogEntry);

    // Get fresh state after saving
    const newState = fileManager.getCurrentState();
    console.log(`📊 [YAML-DATA API] State after save:`);
    console.log(`   - Has changes: ${newState.hasChanges}`);
    console.log(
      `   - New content length: ${newState.yamlContent.length} chars`,
    );
    console.log(`✅ [YAML-DATA API] Save operation completed successfully`);

    return NextResponse.json({
      success: true,
      message: "Changes saved to file system",
      changelogEntry,
      newState: {
        yamlContent: newState.yamlContent,
        hasChanges: newState.hasChanges,
        lastModified: newState.lastModified.toISOString(),
      },
      fileStats: fileManager.getFileStats(),
    });
  } catch (error) {
    console.error("❌ [YAML-DATA API] Error saving YAML data:", error);
    console.error(
      "❌ [YAML-DATA API] Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    return NextResponse.json(
      {
        error: `Failed to save YAML data: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      {
        status:
          error instanceof Error && error.message.includes("Invalid YAML")
            ? 400
            : 500,
      },
    );
  }
}
