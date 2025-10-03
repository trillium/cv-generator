import { mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { readFiles } from "./readFiles";

// Test setup with temporary directories and files
describe("readFiles utility function", () => {
  let testDir: string;

  beforeAll(async () => {
    // Create temporary test directory
    testDir = join(tmpdir(), "cv-generator-readfiles-test-" + Date.now());
    await mkdir(testDir, { recursive: true });

    // Create test files
    await writeFile(
      join(testDir, "valid.yml"),
      "name: John\nage: 30\nskills:\n  - JavaScript",
    );
    await writeFile(join(testDir, "valid.yaml"), "test: value\nconfig: true");
    await writeFile(
      join(testDir, "valid.json"),
      '{"name": "Jane", "type": "config"}',
    );
    await writeFile(
      join(testDir, "invalid.yml"),
      "name: John\nage: [invalid yaml structure",
    );
    await writeFile(join(testDir, "invalid.json"), '{"name": "John", age: 30}'); // malformed JSON
    await writeFile(join(testDir, "plain.txt"), "This is plain text content");
  });

  afterAll(async () => {
    // Clean up test directory
    try {
      await rm(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should read and parse valid YAML files correctly", async () => {
    const result = await readFiles(["valid.yml"], testDir);

    expect(typeof result).toBe("object");
    expect(result["valid.yml"]).toEqual({
      name: "John",
      age: 30,
      skills: ["JavaScript"],
    });
  });

  it("should read and parse valid JSON files correctly", async () => {
    const result = await readFiles(["valid.json"], testDir);

    expect(typeof result).toBe("object");
    expect(result["valid.json"]).toEqual({
      name: "Jane",
      type: "config",
    });
  });

  it("should handle invalid YAML gracefully", async () => {
    const result = await readFiles(["invalid.yml"], testDir);

    expect(result["invalid.yml"]).toHaveProperty(
      "error",
      "Failed to parse YAML",
    );
    expect(result["invalid.yml"]).toHaveProperty("message");
    expect(result["invalid.yml"]).toHaveProperty("rawContent");
  });

  it("should handle invalid JSON gracefully", async () => {
    const result = await readFiles(["invalid.json"], testDir);

    // Should return raw content when JSON parsing fails
    expect(result["invalid.json"]).toBe('{"name": "John", age: 30}');
  });

  it("should handle plain text files", async () => {
    const result = await readFiles(["plain.txt"], testDir);

    expect(result["plain.txt"]).toBe("This is plain text content");
  });

  it("should handle multiple files at once", async () => {
    const result = await readFiles(
      ["valid.yml", "valid.json", "plain.txt"],
      testDir,
    );

    expect(Object.keys(result)).toHaveLength(3);
    expect(result["valid.yml"]).toHaveProperty("name", "John");
    expect(result["valid.json"]).toHaveProperty("name", "Jane");
    expect(result["plain.txt"]).toBe("This is plain text content");
  });

  it("should handle empty file list", async () => {
    const result = await readFiles([], testDir);
    expect(result).toEqual({});
  });

  it("should handle non-existent files gracefully", async () => {
    const result = await readFiles(["does-not-exist.yml"], testDir);

    expect(typeof result).toBe("object");
    expect(result["does-not-exist.yml"]).toHaveProperty(
      "error",
      "Failed to read file",
    );
    expect(typeof result["does-not-exist.yml"].message).toBe("string");
  });
});
