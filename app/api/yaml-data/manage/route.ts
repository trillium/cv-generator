import { NextRequest, NextResponse } from "next/server";
import { FileSystemManager } from "../../../../lib/fileSystemManager";

const getFileManager = () => new FileSystemManager();

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    console.log(`🔄 [MANAGE API] Action requested: ${action}`);

    if (!action || !["commit", "discard"].includes(action)) {
      console.log(`❌ [MANAGE API] Invalid action: ${action}`);
      return NextResponse.json(
        { error: 'Invalid action. Must be "commit" or "discard".' },
        { status: 400 },
      );
    }

    const fileManager = getFileManager();

    // Log current state before action
    const beforeState = fileManager.getCurrentState();
    console.log(`📊 [MANAGE API] State before ${action}:`);
    console.log(`   - Has changes: ${beforeState.hasChanges}`);
    console.log(`   - Content length: ${beforeState.yamlContent.length} chars`);
    console.log(
      `   - Last modified: ${beforeState.lastModified.toISOString()}`,
    );

    let changelogEntry;
    if (action === "commit") {
      console.log(`💾 [MANAGE API] Committing changes...`);
      changelogEntry = fileManager.commitChanges();
    } else {
      console.log(`🗑️  [MANAGE API] Discarding changes...`);
      changelogEntry = fileManager.discardChanges();
    }

    console.log(`📝 [MANAGE API] Changelog entry created:`, changelogEntry);

    // Get fresh state after the operation
    const newState = fileManager.getCurrentState();
    console.log(`📊 [MANAGE API] State after ${action}:`);
    console.log(`   - Has changes: ${newState.hasChanges}`);
    console.log(`   - Content length: ${newState.yamlContent.length} chars`);
    console.log(`   - Last modified: ${newState.lastModified.toISOString()}`);
    console.log(`✅ [MANAGE API] ${action} operation completed successfully`);

    return NextResponse.json({
      success: true,
      action,
      message:
        action === "commit"
          ? "Changes committed to main file"
          : "Changes discarded",
      changelogEntry,
      newState: {
        yamlContent: newState.yamlContent,
        hasChanges: newState.hasChanges,
        lastModified: newState.lastModified.toISOString(),
      },
      fileStats: fileManager.getFileStats(),
    });
  } catch (error) {
    console.error("❌ [MANAGE API] Error managing changes:", error);
    console.error(
      "❌ [MANAGE API] Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );
    return NextResponse.json(
      {
        error: `Failed to manage changes: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
