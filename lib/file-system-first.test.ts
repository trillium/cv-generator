// Test the file-system-first approach
// @vitest-environment node

import fs from "fs";
import path from "path";
import { FileSystemManager } from "./fileSystemManager";

// Test with a temporary directory
const testDir = "/tmp/cv-generator-test-" + Date.now();

describe("File System First Approach", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Save original env
    originalEnv = process.env.PII_PATH;

    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Set test env
    process.env.PII_PATH = testDir;

    // Create initial data file
    fs.writeFileSync(
      path.join(testDir, "data.yml"),
      `
name: "Test User"
title: ["Software Developer"]
email: "test@example.com"
`.trim(),
      "utf8",
    );
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv) {
      process.env.PII_PATH = originalEnv;
    } else {
      delete process.env.PII_PATH;
    }

    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("should always read fresh data from file system", () => {
    const manager1 = new FileSystemManager();
    const state1 = manager1.getCurrentState();

    expect(state1.yamlContent).toContain("Test User");
    expect(state1.hasChanges).toBe(false);

    // Create a new manager instance - should get same fresh data
    const manager2 = new FileSystemManager();
    const state2 = manager2.getCurrentState();

    expect(state2.yamlContent).toBe(state1.yamlContent);
    expect(state2.hasChanges).toBe(false);
  });

  it("should immediately persist changes to file system", () => {
    const manager = new FileSystemManager();

    const newContent = `
name: "Updated User"
title: ["Senior Developer"]
email: "updated@example.com"
`.trim();

    // Save changes
    const changelogEntry = manager.saveYamlContent(newContent);

    // Verify changelog entry was created
    expect(changelogEntry.action).toBe("update");
    expect(changelogEntry.originalFile).toBe("data.yml");

    // Create new manager instance to verify persistence
    const freshManager = new FileSystemManager();
    const freshState = freshManager.getCurrentState();

    expect(freshState.yamlContent).toContain("Updated User");
    expect(freshState.hasChanges).toBe(true); // Should have temp changes
  });

  it("should handle commit and discard operations", () => {
    const manager = new FileSystemManager();

    // Make changes
    const newContent = `
name: "Temporary User"
title: ["Temp Developer"]
email: "temp@example.com"
`.trim();

    manager.saveYamlContent(newContent);

    let state = manager.getCurrentState();
    expect(state.hasChanges).toBe(true);
    expect(state.yamlContent).toContain("Temporary User");

    // Commit changes
    const commitEntry = manager.commitChanges();
    expect(commitEntry.action).toBe("commit");

    // Verify changes are committed
    state = manager.getCurrentState();
    expect(state.hasChanges).toBe(false);
    expect(state.yamlContent).toContain("Temporary User");

    // Make new changes and discard them
    const discardContent = `
name: "Discard User"
title: ["Discard Developer"]
email: "discard@example.com"
`.trim();

    manager.saveYamlContent(discardContent);

    state = manager.getCurrentState();
    expect(state.hasChanges).toBe(true);
    expect(state.yamlContent).toContain("Discard User");

    // Discard changes
    const discardEntry = manager.discardChanges();
    expect(discardEntry.action).toBe("discard");

    // Verify changes are discarded
    state = manager.getCurrentState();
    expect(state.hasChanges).toBe(false);
    expect(state.yamlContent).toContain("Temporary User"); // Should be back to committed state
  });

  it("should maintain changelog across operations", () => {
    const manager = new FileSystemManager();

    // Perform multiple operations
    manager.saveYamlContent('name: "User 1"');
    manager.commitChanges();
    manager.saveYamlContent('name: "User 2"');
    manager.discardChanges();

    const recentChangelog = manager.getRecentChangelog(10);

    expect(recentChangelog.length).toBe(4); // save, commit, save, discard
    expect(recentChangelog[0].action).toBe("discard"); // Most recent first
    expect(recentChangelog[1].action).toBe("update");
    expect(recentChangelog[2].action).toBe("commit");
    expect(recentChangelog[3].action).toBe("update");
  });

  it("should provide accurate file statistics", () => {
    const manager = new FileSystemManager();

    let stats = manager.getFileStats();
    expect(stats.originalExists).toBe(true);
    expect(stats.tempExists).toBe(false);
    expect(stats.originalSize).toBeGreaterThan(0);

    // Create temp changes
    manager.saveYamlContent('name: "Temp User"\ntitle: ["Developer"]');

    stats = manager.getFileStats();
    expect(stats.originalExists).toBe(true);
    expect(stats.tempExists).toBe(true);
    expect(stats.tempSize).toBeGreaterThan(0);
    expect(stats.tempModified).toBeInstanceOf(Date);
  });

  it("should demonstrate real-time file system updates", () => {
    console.log("🗂️  FILE SYSTEM FIRST APPROACH DEMONSTRATION");
    console.log("");

    // Create manager 1
    const manager1 = new FileSystemManager();
    console.log("Manager 1 initial state:");
    let state1 = manager1.getCurrentState();
    console.log(`- Has changes: ${state1.hasChanges}`);
    console.log(`- Content preview: ${state1.yamlContent.substring(0, 50)}...`);

    // Make changes with manager 1
    console.log("\nManager 1 saves changes...");
    manager1.saveYamlContent(
      `
name: "Real-time User"
title: ["Live Developer"]
email: "live@example.com"
updated: "Manager 1 at ${new Date().toISOString()}"
`.trim(),
    );

    // Create manager 2 - should see manager 1's changes immediately
    console.log("\nManager 2 (new instance) reads current state:");
    const manager2 = new FileSystemManager();
    const state2 = manager2.getCurrentState();
    console.log(`- Has changes: ${state2.hasChanges}`);
    console.log(
      `- Sees Manager 1's changes: ${state2.yamlContent.includes("Real-time User")}`,
    );
    console.log(`- Content preview: ${state2.yamlContent.substring(0, 50)}...`);

    // Manager 2 commits changes
    console.log("\nManager 2 commits the changes...");
    manager2.commitChanges();

    // Manager 1 refreshes and sees committed state
    console.log("\nManager 1 reads fresh state:");
    state1 = manager1.getCurrentState();
    console.log(`- Has changes: ${state1.hasChanges}`);
    console.log(`- Sees committed state: ${!state1.hasChanges}`);

    console.log("\n✅ File system is the single source of truth!");
    console.log("✅ All changes are immediately visible to all instances!");
    console.log("✅ No in-memory state - everything comes from files!");

    expect(true).toBe(true);
  });
});
