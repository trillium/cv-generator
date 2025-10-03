import { mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import {
  getFilesInDirectory,
  getAllFilesRecursively,
  getAllFiles,
} from "./getFiles";

// Test setup with temporary directories
describe("getFiles utility functions", () => {
  let testDir: string;
  let resumesDir: string;

  beforeAll(async () => {
    // Create temporary test directory
    testDir = join(tmpdir(), "cv-generator-test-" + Date.now());
    resumesDir = join(testDir, "resumes");

    await mkdir(testDir, { recursive: true });
    await mkdir(resumesDir, { recursive: true });
    await mkdir(join(resumesDir, "subfolder"), { recursive: true });

    // Create test files
    await writeFile(join(testDir, "data.yml"), "name: test");
    await writeFile(join(testDir, "config.json"), '{"test": true}');
    await writeFile(join(testDir, "readme.txt"), "Hello world");
    await writeFile(join(resumesDir, "resume1.pdf"), "fake pdf content");
    await writeFile(
      join(resumesDir, "subfolder", "resume2.pdf"),
      "another fake pdf",
    );
  });

  afterAll(async () => {
    // Clean up test directory
    try {
      await rm(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("getFilesInDirectory", () => {
    it("should return only YAML files from a directory", async () => {
      const result = await getFilesInDirectory(testDir);
      expect(result).toContain("data.yml");
      expect(result).not.toContain("config.json");
      expect(result).not.toContain("readme.txt");
      expect(result).not.toContain("resumes"); // should not include directories
    });

    it("should handle non-existent directory gracefully", async () => {
      const result = await getFilesInDirectory(
        "/tmp/does-not-exist-" + Date.now(),
      );
      expect(result).toEqual([]);
    });

    it("should return empty array for empty input", async () => {
      const result = await getFilesInDirectory("");
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });
  });

  describe("getAllFilesRecursively", () => {
    it("should recursively find all YAML files", async () => {
      // Create a YAML file in the resumes directory
      await writeFile(join(resumesDir, "resume.yml"), "name: test");

      const result = await getAllFilesRecursively(resumesDir, testDir);
      expect(result).toContain("resumes/resume.yml");
      expect(result).not.toContain("resumes/resume1.pdf");
      expect(result).not.toContain("resumes/subfolder/resume2.pdf");
    });

    it("should handle non-existent directory gracefully", async () => {
      const result = await getAllFilesRecursively(
        "/tmp/does-not-exist-" + Date.now(),
      );
      expect(result).toEqual([]);
    });

    it("should handle base path parameter correctly", async () => {
      // Create a YAML file in the resumes directory
      await writeFile(join(resumesDir, "resume.yml"), "name: test");

      const result = await getAllFilesRecursively(testDir, testDir);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain("resumes/resume.yml");
      expect(result).not.toContain("resumes/resume1.pdf");
    });
  });

  describe("getAllFiles", () => {
    it("should combine main directory YAML files and resumes subdirectory YAML files", async () => {
      // Create a YAML file in the resumes directory
      await writeFile(join(resumesDir, "resume.yml"), "name: test");

      const result = await getAllFiles(testDir);

      expect(result.allFiles).toContain("data.yml");
      expect(result.allFiles).not.toContain("config.json");
      expect(result.allFiles).not.toContain("readme.txt");
      expect(result.allFiles).toContain("resumes/resume.yml");
      expect(result.allFiles).not.toContain("resumes/resume1.pdf");
      expect(result.allFiles).not.toContain("resumes/subfolder/resume2.pdf");
      expect(result.mainDirFiles).toBe(1); // data.yml
      expect(result.resumeFiles).toBe(1); // resume.yml
      expect(result.totalFiles).toBe(2);
    });

    it("should handle non-existent directory gracefully", async () => {
      const result = await getAllFiles("/tmp/does-not-exist-" + Date.now());

      expect(result).toHaveProperty("allFiles");
      expect(result).toHaveProperty("mainDirFiles");
      expect(result).toHaveProperty("resumeFiles");
      expect(result).toHaveProperty("totalFiles");
      expect(Array.isArray(result.allFiles)).toBe(true);
      expect(typeof result.mainDirFiles).toBe("number");
      expect(typeof result.resumeFiles).toBe("number");
      expect(typeof result.totalFiles).toBe("number");
      expect(result.allFiles).toEqual([]);
      expect(result.totalFiles).toBe(0);
    });

    it("should return consistent structure", async () => {
      const result = await getAllFiles(testDir);

      expect(result.totalFiles).toBe(result.mainDirFiles + result.resumeFiles);
      expect(result.allFiles.length).toBe(result.totalFiles);
    });
  });
});
