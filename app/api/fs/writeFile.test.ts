import { mkdir, rm, readFile, access } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { writeFile } from "./writeFile";

// Test with temporary directories
describe("writeFile utility function", () => {
  let testDir: string;

  beforeAll(async () => {
    // Create temporary test directory
    testDir = join(tmpdir(), "cv-generator-writefile-test-" + Date.now());
    await mkdir(testDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test directory
    try {
      await rm(testDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it("should write YAML file successfully", async () => {
    const testData = {
      name: "John",
      age: 30,
      skills: ["JavaScript", "TypeScript"],
    };

    const result = await writeFile(testData, {
      filePath: "test.yml",
      baseDirectory: testDir,
      createDiff: false,
    });

    expect(result.success).toBe(true);
    expect(result.yamlContent).toContain("name: John");
    expect(result.yamlContent).toContain("age: 30");
    expect(result.yamlContent).toContain("- JavaScript");

    // Verify file was written
    const fileContent = await readFile(result.filePath!, "utf-8");
    expect(fileContent).toContain("name: John");
  });

  it("should create diff when updating existing file", async () => {
    const initialData = { name: "Jane", version: 1 };
    const updatedData = { name: "Jane Doe", version: 2 };

    // Write initial file
    await writeFile(initialData, {
      filePath: "existing.yml",
      baseDirectory: testDir,
      createDiff: true,
    });

    // Update the file
    const result = await writeFile(updatedData, {
      filePath: "existing.yml",
      baseDirectory: testDir,
      createDiff: true,
    });

    expect(result.success).toBe(true);
    expect(result.diffCreated).toBe(true);
    expect(result.fileExisted).toBe(true);

    // Check if diff directory was created
    const diffsDir = join(testDir, "diffs");
    await expect(access(diffsDir)).resolves.not.toThrow();
  });

  it("should handle directory creation when path does not exist", async () => {
    const testData = { test: "data" };

    const result = await writeFile(testData, {
      filePath: "nested/deep/folder/test.yml",
      baseDirectory: testDir,
      createDiff: false,
    });

    expect(result.success).toBe(true);

    // Verify file was written
    const fileContent = await readFile(result.filePath!, "utf-8");
    expect(fileContent).toContain("test: data");
  });

  it("should handle invalid base directory", async () => {
    const testData = { name: "John", age: 30 };

    const result = await writeFile(testData, {
      filePath: "test.yml",
      baseDirectory:
        "/completely/invalid/path/that/does/not/exist/and/cannot/be/created",
      createDiff: false,
    });

    expect(result.success).toBe(false);
    expect(typeof result.error).toBe("string");
  });

  it("should handle complex nested objects", async () => {
    const complexData = {
      person: {
        name: "John Doe",
        contact: {
          email: "john@example.com",
          phone: "+1-555-0123",
        },
        skills: ["JavaScript", "TypeScript", "Node.js"],
        projects: [
          { name: "Project A", year: 2023 },
          { name: "Project B", year: 2024 },
        ],
      },
    };

    const result = await writeFile(complexData, {
      filePath: "complex.yml",
      baseDirectory: testDir,
      createDiff: false,
    });

    expect(result.success).toBe(true);
    expect(result.yamlContent).toContain("John Doe");
    expect(result.yamlContent).toContain("john@example.com");
    expect(result.yamlContent).toContain("Project A");
  });

  it("should handle null and empty data", async () => {
    const result = await writeFile(null as unknown, {
      filePath: "null-test.yml",
      baseDirectory: testDir,
      createDiff: false,
    });

    expect(result.success).toBe(true);
    expect(result.yamlContent).toContain("null");
  });
});
