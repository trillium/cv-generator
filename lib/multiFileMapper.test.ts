import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  getAncestorDirectories,
  findDataFilesInDirectory,
  validateSectionSpecificFile,
  validateNoConflicts,
  isFullDataFilename,
  loadDataFile,
  type FileEntry,
} from "./multiFileMapper";

const TEST_DIR = path.join(process.cwd(), "test-multi-file");

vi.mock("./getPiiPath", () => ({
  getPiiDirectory: () => TEST_DIR,
}));

describe("multiFileMapper", () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe("getAncestorDirectories", () => {
    it("should return ancestor directories for nested path", () => {
      const result = getAncestorDirectories("base/google/python");
      expect(result.length).toBe(3);
      expect(result[0]).toContain("base");
      expect(result[1]).toContain("google");
      expect(result[2]).toContain("python");
    });

    it("should return single directory for single-level path", () => {
      const result = getAncestorDirectories("base");
      expect(result.length).toBe(1);
      expect(result[0]).toContain("base");
    });
  });

  describe("findDataFilesInDirectory", () => {
    it("should find data.yml files", () => {
      const testFile = path.join(TEST_DIR, "data.yml");
      fs.writeFileSync(testFile, "info: {}");

      const result = findDataFilesInDirectory(TEST_DIR);
      expect(result).toContain(testFile);
    });

    it("should find section-specific files", () => {
      const workFile = path.join(TEST_DIR, "work.yml");
      fs.writeFileSync(workFile, "workExperience: []");

      const result = findDataFilesInDirectory(TEST_DIR);
      expect(result).toContain(workFile);
    });

    it("should return empty array for non-existent directory", () => {
      const result = findDataFilesInDirectory(
        path.join(TEST_DIR, "nonexistent"),
      );
      expect(result).toEqual([]);
    });

    it("should ignore non-data files", () => {
      fs.writeFileSync(path.join(TEST_DIR, "random.txt"), "text");
      const result = findDataFilesInDirectory(TEST_DIR);
      expect(result).toEqual([]);
    });
  });

  describe("isFullDataFilename", () => {
    it("should identify data.yml as full data file", () => {
      expect(isFullDataFilename("data.yml")).toBe(true);
    });

    it("should identify resume.json as full data file", () => {
      expect(isFullDataFilename("resume.json")).toBe(true);
    });

    it("should not identify section-specific files as full data", () => {
      expect(isFullDataFilename("work.yml")).toBe(false);
    });
  });

  describe("validateSectionSpecificFile", () => {
    it("should pass for valid section-specific file", () => {
      expect(() => {
        validateSectionSpecificFile("work.yml", ["workExperience"]);
      }).not.toThrow();
    });

    it("should throw for section-specific file with multiple sections", () => {
      expect(() => {
        validateSectionSpecificFile("work.yml", [
          "workExperience",
          "education",
        ]);
      }).toThrow("must only contain 'workExperience' section");
    });

    it("should throw for section-specific file with wrong section", () => {
      expect(() => {
        validateSectionSpecificFile("work.yml", ["education"]);
      }).toThrow("must only contain 'workExperience' section");
    });

    it("should not throw for full data files", () => {
      expect(() => {
        validateSectionSpecificFile("data.yml", [
          "workExperience",
          "education",
          "info",
        ]);
      }).not.toThrow();
    });
  });

  describe("validateNoConflicts", () => {
    it("should pass for non-conflicting files", () => {
      const files: FileEntry[] = [
        {
          path: path.join(TEST_DIR, "work.yml"),
          sections: ["workExperience"],
          format: "yaml",
        },
        {
          path: path.join(TEST_DIR, "info.yml"),
          sections: ["info"],
          format: "yaml",
        },
      ];

      expect(() => {
        validateNoConflicts(files, TEST_DIR);
      }).not.toThrow();
    });

    it("should throw for same section in multiple section-specific files", () => {
      const files: FileEntry[] = [
        {
          path: path.join(TEST_DIR, "work.yml"),
          sections: ["workExperience"],
          format: "yaml",
        },
        {
          path: path.join(TEST_DIR, "experience.yml"),
          sections: ["workExperience"],
          format: "yaml",
        },
      ];

      expect(() => {
        validateNoConflicts(files, TEST_DIR);
      }).toThrow("defined in multiple files");
    });

    it("should throw for same basename with different extensions", () => {
      const files: FileEntry[] = [
        {
          path: path.join(TEST_DIR, "info.yml"),
          sections: ["info"],
          format: "yaml",
        },
        {
          path: path.join(TEST_DIR, "info.json"),
          sections: ["info"],
          format: "json",
        },
      ];

      expect(() => {
        validateNoConflicts(files, TEST_DIR);
      }).toThrow("same basename");
    });

    it("should allow section-specific file to override full data file", () => {
      const files: FileEntry[] = [
        {
          path: path.join(TEST_DIR, "data.yml"),
          sections: ["info", "workExperience"],
          format: "yaml",
        },
        {
          path: path.join(TEST_DIR, "info.yml"),
          sections: ["info"],
          format: "yaml",
        },
      ];

      expect(() => {
        validateNoConflicts(files, TEST_DIR);
      }).not.toThrow();
    });
  });

  describe("loadDataFile", () => {
    it("should load YAML file", () => {
      const testFile = path.join(TEST_DIR, "test.yml");
      fs.writeFileSync(testFile, "info:\n  firstName: Test");

      const result = loadDataFile(testFile);
      expect(result).toHaveProperty("info");
      expect((result.info as { firstName: string }).firstName).toBe("Test");
    });

    it("should load JSON file", () => {
      const testFile = path.join(TEST_DIR, "test.json");
      fs.writeFileSync(testFile, '{"info": {"firstName": "Test"}}');

      const result = loadDataFile(testFile);
      expect(result).toHaveProperty("info");
      expect((result.info as { firstName: string }).firstName).toBe("Test");
    });
  });
});
