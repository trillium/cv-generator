import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  loadSingleDirectory,
  loadFromDirectory,
  findSourceFile,
} from "./getYamlData";

const TEST_DIR = path.join(process.cwd(), "test-yaml-data");

describe("getYamlData", () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe("loadSingleDirectory", () => {
    it("should load all data files in directory", () => {
      const dir = path.join(TEST_DIR, "base");
      fs.mkdirSync(dir, { recursive: true });

      fs.writeFileSync(
        path.join(dir, "data.yml"),
        "info:\n  firstName: Test\neducation:\n  - degree: BS",
      );

      const result = loadSingleDirectory(dir);

      expect(result.merged).toHaveProperty("info");
      expect(result.merged).toHaveProperty("education");
      expect(result.sources.info).toContain("data.yml");
    });

    it("should prioritize section-specific files over full data files", () => {
      const dir = path.join(TEST_DIR, "base");
      fs.mkdirSync(dir, { recursive: true });

      fs.writeFileSync(
        path.join(dir, "data.yml"),
        "info:\n  firstName: Data\nworkExperience: []",
      );
      fs.writeFileSync(
        path.join(dir, "info.yml"),
        "info:\n  firstName: SectionSpecific",
      );

      const result = loadSingleDirectory(dir);

      const info = result.merged.info as { firstName: string };
      expect(info.firstName).toBe("SectionSpecific");
      expect(result.sources.info).toContain("info.yml");
    });

    it("should throw on section-specific file validation error", () => {
      const dir = path.join(TEST_DIR, "base");
      fs.mkdirSync(dir, { recursive: true });

      fs.writeFileSync(
        path.join(dir, "work.yml"),
        "workExperience: []\neducation: []",
      );

      expect(() => {
        loadSingleDirectory(dir);
      }).toThrow("must only contain");
    });

    it("should throw on conflict between section-specific files", () => {
      const dir = path.join(TEST_DIR, "base");
      fs.mkdirSync(dir, { recursive: true });

      fs.writeFileSync(path.join(dir, "work.yml"), "workExperience: []");
      fs.writeFileSync(path.join(dir, "experience.yml"), "workExperience: []");

      expect(() => {
        loadSingleDirectory(dir);
      }).toThrow("defined in multiple files");
    });
  });

  describe("loadFromDirectory", () => {
    it("should merge data from ancestor directories", () => {
      const baseDir = path.join(TEST_DIR, "base");
      const googleDir = path.join(TEST_DIR, "base", "google");

      fs.mkdirSync(googleDir, { recursive: true });

      fs.writeFileSync(
        path.join(baseDir, "data.yml"),
        "info:\n  firstName: Base\neducation:\n  - degree: BS",
      );
      fs.writeFileSync(
        path.join(googleDir, "info.yml"),
        "info:\n  firstName: Google",
      );

      const originalPiiPath = process.env.PII_PATH;
      process.env.PII_PATH = TEST_DIR;

      try {
        const result = loadFromDirectory("base/google");

        const info = result.info as { firstName: string };
        expect(info.firstName).toBe("Google");
        expect(result.education).toBeDefined();
      } finally {
        process.env.PII_PATH = originalPiiPath;
      }
    });

    it("should replace sections completely from deeper directories", () => {
      const baseDir = path.join(TEST_DIR, "base");
      const googleDir = path.join(TEST_DIR, "base", "google");

      fs.mkdirSync(googleDir, { recursive: true });

      fs.writeFileSync(
        path.join(baseDir, "work.yml"),
        "workExperience:\n  - position: Engineer A\n  - position: Engineer B",
      );
      fs.writeFileSync(
        path.join(googleDir, "work.yml"),
        "workExperience:\n  - position: Google Engineer",
      );

      const originalPiiPath = process.env.PII_PATH;
      process.env.PII_PATH = TEST_DIR;

      try {
        const result = loadFromDirectory("base/google");

        const work = result.workExperience as Array<{ position: string }>;
        expect(work.length).toBe(1);
        expect(work[0].position).toBe("Google Engineer");
      } finally {
        process.env.PII_PATH = originalPiiPath;
      }
    });

    it("should handle empty directories by inheriting from parents", () => {
      const baseDir = path.join(TEST_DIR, "base");
      const emptyDir = path.join(TEST_DIR, "base", "empty");

      fs.mkdirSync(emptyDir, { recursive: true });

      fs.writeFileSync(
        path.join(baseDir, "data.yml"),
        "info:\n  firstName: Base",
      );

      const originalPiiPath = process.env.PII_PATH;
      process.env.PII_PATH = TEST_DIR;

      try {
        const result = loadFromDirectory("base/empty");

        const info = result.info as { firstName: string };
        expect(info.firstName).toBe("Base");
      } finally {
        process.env.PII_PATH = originalPiiPath;
      }
    });
  });

  describe("findSourceFile", () => {
    it("should find file in deepest directory containing section", () => {
      const baseDir = path.join(TEST_DIR, "base");
      const googleDir = path.join(TEST_DIR, "base", "google");

      fs.mkdirSync(googleDir, { recursive: true });

      fs.writeFileSync(path.join(baseDir, "data.yml"), "education: []");
      fs.writeFileSync(path.join(googleDir, "info.yml"), "info: {}");

      const originalPiiPath = process.env.PII_PATH;
      process.env.PII_PATH = TEST_DIR;

      try {
        const infoSource = findSourceFile("base/google", "info");
        expect(infoSource).toContain("google");
        expect(infoSource).toContain("info.yml");

        const eduSource = findSourceFile("base/google", "education");
        expect(eduSource).toContain("base");
        expect(eduSource).toContain("data.yml");
      } finally {
        process.env.PII_PATH = originalPiiPath;
      }
    });

    it("should throw if section not found in any file", () => {
      const baseDir = path.join(TEST_DIR, "base");
      fs.mkdirSync(baseDir, { recursive: true });

      fs.writeFileSync(path.join(baseDir, "data.yml"), "info: {}");

      const originalPiiPath = process.env.PII_PATH;
      process.env.PII_PATH = TEST_DIR;

      try {
        expect(() => {
          findSourceFile("base", "nonExistentSection");
        }).toThrow("No file found containing section");
      } finally {
        process.env.PII_PATH = originalPiiPath;
      }
    });

    it("should prioritize section-specific file over full data file in same directory", () => {
      const baseDir = path.join(TEST_DIR, "base");
      fs.mkdirSync(baseDir, { recursive: true });

      // Both files contain 'info' section
      fs.writeFileSync(
        path.join(baseDir, "data.yml"),
        "info:\n  firstName: FromDataFile\neducation: []",
      );
      fs.writeFileSync(
        path.join(baseDir, "info.yml"),
        "info:\n  firstName: FromInfoFile",
      );

      const originalPiiPath = process.env.PII_PATH;
      process.env.PII_PATH = TEST_DIR;

      try {
        const infoSource = findSourceFile("base", "info");
        // Should return info.yml, not data.yml
        expect(infoSource).toContain("info.yml");
        expect(infoSource).not.toContain("data.yml");
      } finally {
        process.env.PII_PATH = originalPiiPath;
      }
    });
  });
});
