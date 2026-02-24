import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  parseNumberedArrayFile,
  isNumberedArrayFile,
  validateNumberedArrayFiles,
  mergeNumberedArrayFiles,
} from "./multiFileMapper";
import * as path from "path";
import * as fs from "fs";
import { yaml } from "./yamlService";
import * as os from "os";

describe("Numbered Array Files", () => {
  describe("parseNumberedArrayFile", () => {
    describe("legacy 2-part format", () => {
      it("parses valid numbered array filenames", () => {
        const result = parseNumberedArrayFile(
          "experience.workExperience01.yml",
        );
        expect(result).toEqual({
          basename: "experience",
          sectionKey: "workExperience",
          number: "01",
          ext: ".yml",
        });
      });

      it("parses numbered files with different sections", () => {
        const result = parseNumberedArrayFile("work.workExperience02.json");
        expect(result).toEqual({
          basename: "work",
          sectionKey: "workExperience",
          number: "02",
          ext: ".json",
        });
      });

      it("parses education section numbered files", () => {
        const result = parseNumberedArrayFile("edu.education01.yaml");
        expect(result).toEqual({
          basename: "edu",
          sectionKey: "education",
          number: "01",
          ext: ".yaml",
        });
      });
    });

    describe("new 3-part format", () => {
      it("parses projects.talon.01.yml", () => {
        const result = parseNumberedArrayFile("projects.talon.01.yml");
        expect(result).toEqual({
          basename: "talon",
          sectionKey: "projects",
          number: "01",
          ext: ".yml",
        });
      });

      it("parses workExperience.google.10.yaml", () => {
        const result = parseNumberedArrayFile("workExperience.google.10.yaml");
        expect(result).toEqual({
          basename: "google",
          sectionKey: "workExperience",
          number: "10",
          ext: ".yaml",
        });
      });

      it("parses education.mit.99.json", () => {
        const result = parseNumberedArrayFile("education.mit.99.json");
        expect(result).toEqual({
          basename: "mit",
          sectionKey: "education",
          number: "99",
          ext: ".json",
        });
      });

      it("parses coverLetter.acme.05.yml", () => {
        const result = parseNumberedArrayFile("coverLetter.acme.05.yml");
        expect(result).toEqual({
          basename: "acme",
          sectionKey: "coverLetter",
          number: "05",
          ext: ".yml",
        });
      });

      it("returns null if first part is not a valid section key", () => {
        expect(parseNumberedArrayFile("invalid.word.01.yml")).toBeNull();
      });

      it("returns null if last part is not digits", () => {
        expect(parseNumberedArrayFile("projects.talon.abc.yml")).toBeNull();
      });
    });

    describe("new 3-part format (digits in middle)", () => {
      it("parses projects.01.talon.yml", () => {
        const result = parseNumberedArrayFile("projects.01.talon.yml");
        expect(result).toEqual({
          basename: "talon",
          sectionKey: "projects",
          number: "01",
          ext: ".yml",
        });
      });

      it("parses workExperience.10.google.yaml", () => {
        const result = parseNumberedArrayFile("workExperience.10.google.yaml");
        expect(result).toEqual({
          basename: "google",
          sectionKey: "workExperience",
          number: "10",
          ext: ".yaml",
        });
      });

      it("parses education.99.mit.json", () => {
        const result = parseNumberedArrayFile("education.99.mit.json");
        expect(result).toEqual({
          basename: "mit",
          sectionKey: "education",
          number: "99",
          ext: ".json",
        });
      });

      it("parses coverLetter.05.acme.yml", () => {
        const result = parseNumberedArrayFile("coverLetter.05.acme.yml");
        expect(result).toEqual({
          basename: "acme",
          sectionKey: "coverLetter",
          number: "05",
          ext: ".yml",
        });
      });

      it("returns null if first part is not a valid section key", () => {
        expect(parseNumberedArrayFile("invalid.01.word.yml")).toBeNull();
      });

      it("returns null if middle part is not digits", () => {
        expect(parseNumberedArrayFile("projects.abc.talon.yml")).toBeNull();
      });
    });

    it("returns null for non-numbered files", () => {
      expect(parseNumberedArrayFile("experience.yml")).toBeNull();
      expect(parseNumberedArrayFile("data.yml")).toBeNull();
      expect(parseNumberedArrayFile("info.json")).toBeNull();
    });

    it("returns null for invalid patterns", () => {
      expect(parseNumberedArrayFile("experience.invalid01.yml")).toBeNull();
      expect(
        parseNumberedArrayFile("experience.workExperience.yml"),
      ).toBeNull();
      expect(
        parseNumberedArrayFile("experience.workExperienceABC.yml"),
      ).toBeNull();
    });

    it("returns null for unsupported extensions", () => {
      expect(
        parseNumberedArrayFile("experience.workExperience01.txt"),
      ).toBeNull();
      expect(
        parseNumberedArrayFile("experience.workExperience01.js"),
      ).toBeNull();
    });
  });

  describe("isNumberedArrayFile", () => {
    it("returns true for valid numbered array files", () => {
      expect(isNumberedArrayFile("experience.workExperience01.yml")).toBe(true);
      expect(isNumberedArrayFile("work.workExperience99.json")).toBe(true);
    });

    it("returns false for non-numbered files", () => {
      expect(isNumberedArrayFile("experience.yml")).toBe(false);
      expect(isNumberedArrayFile("data.yml")).toBe(false);
    });
  });

  describe("mergeNumberedArrayFiles", () => {
    const tmpDir = path.join(os.tmpdir(), "numbered-array-tests");

    beforeEach(() => {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    });

    afterEach(() => {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it("merges numbered files in correct order", () => {
      const file1 = path.join(tmpDir, "experience.workExperience01.yml");
      const file2 = path.join(tmpDir, "experience.workExperience02.yml");

      fs.writeFileSync(
        file1,
        yaml.dump({ workExperience: [{ position: "Job 1" }] }),
      );
      fs.writeFileSync(
        file2,
        yaml.dump({ workExperience: [{ position: "Job 2" }] }),
      );

      const result = mergeNumberedArrayFiles([file1, file2]);
      const merged = result.get("workExperience");

      expect(merged).toBeDefined();
      expect(merged?.data).toHaveLength(2);
      expect(merged?.data[0]).toEqual({ position: "Job 1" });
      expect(merged?.data[1]).toEqual({ position: "Job 2" });
      expect(merged?.sources).toEqual([file1, file2]);
    });

    it("sorts files by number even if provided out of order", () => {
      const file1 = path.join(tmpDir, "experience.workExperience01.yml");
      const file2 = path.join(tmpDir, "experience.workExperience02.yml");
      const file3 = path.join(tmpDir, "experience.workExperience03.yml");

      fs.writeFileSync(
        file1,
        yaml.dump({ workExperience: [{ position: "Job 1" }] }),
      );
      fs.writeFileSync(
        file2,
        yaml.dump({ workExperience: [{ position: "Job 2" }] }),
      );
      fs.writeFileSync(
        file3,
        yaml.dump({ workExperience: [{ position: "Job 3" }] }),
      );

      const result = mergeNumberedArrayFiles([file3, file1, file2]);
      const merged = result.get("workExperience");

      expect(merged?.data).toHaveLength(3);
      expect(merged?.data[0]).toEqual({ position: "Job 1" });
      expect(merged?.data[1]).toEqual({ position: "Job 2" });
      expect(merged?.data[2]).toEqual({ position: "Job 3" });
    });

    it("throws error if file contains non-array data", () => {
      const file1 = path.join(tmpDir, "experience.workExperience01.yml");
      fs.writeFileSync(file1, yaml.dump({ workExperience: "not an array" }));

      expect(() => mergeNumberedArrayFiles([file1])).toThrow(
        "must contain an array",
      );
    });

    it("merges files with non-consecutive numbering correctly", () => {
      const file1 = path.join(tmpDir, "experience.workExperience010.yml");
      const file2 = path.join(tmpDir, "experience.workExperience020.yml");
      const file3 = path.join(tmpDir, "experience.workExperience100.yml");

      fs.writeFileSync(
        file1,
        yaml.dump({ workExperience: [{ position: "Job 1" }] }),
      );
      fs.writeFileSync(
        file2,
        yaml.dump({ workExperience: [{ position: "Job 2" }] }),
      );
      fs.writeFileSync(
        file3,
        yaml.dump({ workExperience: [{ position: "Job 3" }] }),
      );

      const result = mergeNumberedArrayFiles([file3, file1, file2]);
      const merged = result.get("workExperience");

      expect(merged?.data).toHaveLength(3);
      expect(merged?.data[0]).toEqual({ position: "Job 1" });
      expect(merged?.data[1]).toEqual({ position: "Job 2" });
      expect(merged?.data[2]).toEqual({ position: "Job 3" });
    });

    it("sorts files by numeric value, not string order", () => {
      const file1 = path.join(tmpDir, "experience.workExperience017.yml");
      const file2 = path.join(tmpDir, "experience.workExperience243.yml");
      const file3 = path.join(tmpDir, "experience.workExperience999.yml");

      fs.writeFileSync(
        file1,
        yaml.dump({ workExperience: [{ position: "Job A" }] }),
      );
      fs.writeFileSync(
        file2,
        yaml.dump({ workExperience: [{ position: "Job B" }] }),
      );
      fs.writeFileSync(
        file3,
        yaml.dump({ workExperience: [{ position: "Job C" }] }),
      );

      const result = mergeNumberedArrayFiles([file3, file1, file2]);
      const merged = result.get("workExperience");

      expect(merged?.data).toHaveLength(3);
      expect(merged?.data[0]).toEqual({ position: "Job A" });
      expect(merged?.data[1]).toEqual({ position: "Job B" });
      expect(merged?.data[2]).toEqual({ position: "Job C" });
      expect(merged?.sources).toEqual([file1, file2, file3]);
    });
  });

  describe("validateNumberedArrayFiles", () => {
    const tmpDir = path.join(os.tmpdir(), "validation-tests");

    beforeEach(() => {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    });

    afterEach(() => {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it("validates correct numbered array files", () => {
      const file1 = path.join(tmpDir, "experience.workExperience01.yml");
      const file2 = path.join(tmpDir, "experience.workExperience02.yml");

      fs.writeFileSync(
        file1,
        yaml.dump({ workExperience: [{ position: "Job 1" }] }),
      );
      fs.writeFileSync(
        file2,
        yaml.dump({ workExperience: [{ position: "Job 2" }] }),
      );

      expect(() =>
        validateNumberedArrayFiles([file1, file2], tmpDir),
      ).not.toThrow();
    });

    it("allows non-consecutive numbering", () => {
      const file1 = path.join(tmpDir, "experience.workExperience010.yml");
      const file2 = path.join(tmpDir, "experience.workExperience020.yml");
      const file3 = path.join(tmpDir, "experience.workExperience100.yml");

      fs.writeFileSync(
        file1,
        yaml.dump({ workExperience: [{ position: "Job 1" }] }),
      );
      fs.writeFileSync(
        file2,
        yaml.dump({ workExperience: [{ position: "Job 2" }] }),
      );
      fs.writeFileSync(
        file3,
        yaml.dump({ workExperience: [{ position: "Job 3" }] }),
      );

      expect(() =>
        validateNumberedArrayFiles([file1, file2, file3], tmpDir),
      ).not.toThrow();
    });

    it("throws error for numbered file with wrong section", () => {
      const file1 = path.join(tmpDir, "experience.workExperience01.yml");

      fs.writeFileSync(
        file1,
        yaml.dump({ workExperience: [{}], education: [] }),
      );

      expect(() => validateNumberedArrayFiles([file1], tmpDir)).toThrow(
        "must only contain",
      );
    });

    it("throws error for numbered file with non-array data", () => {
      const file1 = path.join(tmpDir, "experience.workExperience01.yml");

      fs.writeFileSync(file1, yaml.dump({ workExperience: "not an array" }));

      expect(() => validateNumberedArrayFiles([file1], tmpDir)).toThrow(
        "must contain an array",
      );
    });

    it("throws error for conflict between numbered and regular files", () => {
      const file1 = path.join(tmpDir, "experience.workExperience01.yml");
      const file2 = path.join(tmpDir, "experience.yml");

      fs.writeFileSync(
        file1,
        yaml.dump({ workExperience: [{ position: "Job 1" }] }),
      );
      fs.writeFileSync(
        file2,
        yaml.dump({ workExperience: [{ position: "Job 2" }] }),
      );

      expect(() => validateNumberedArrayFiles([file1, file2], tmpDir)).toThrow(
        "both numbered files and a regular section file",
      );
    });
  });
});
