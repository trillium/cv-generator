import { describe, it, expect } from "vitest";
import {
  getPdfsToRegenerate,
  getPdfsToRegenerateFromFile,
  SECTION_TO_PDF_MAP,
} from "./pdfSectionMapper";

describe("pdfSectionMapper", () => {
  describe("SECTION_TO_PDF_MAP", () => {
    it("should map info to both resume and cover", () => {
      expect(SECTION_TO_PDF_MAP.info).toEqual(["resume", "cover"]);
    });

    it("should map workExperience to resume only", () => {
      expect(SECTION_TO_PDF_MAP.workExperience).toEqual(["resume"]);
    });

    it("should map coverLetter to cover only", () => {
      expect(SECTION_TO_PDF_MAP.coverLetter).toEqual(["cover"]);
    });

    it("should map metadata to empty array", () => {
      expect(SECTION_TO_PDF_MAP.metadata).toEqual([]);
    });
  });

  describe("getPdfsToRegenerate", () => {
    it("should extract section from simple path", () => {
      expect(getPdfsToRegenerate("info.firstName")).toEqual([
        "resume",
        "cover",
      ]);
    });

    it("should extract section from array path", () => {
      expect(getPdfsToRegenerate("workExperience[0].position")).toEqual([
        "resume",
      ]);
    });

    it("should handle cover letter changes", () => {
      expect(getPdfsToRegenerate("coverLetter[0]")).toEqual(["cover"]);
    });

    it("should return empty array for metadata changes", () => {
      expect(getPdfsToRegenerate("metadata.pages")).toEqual([]);
    });

    it("should return empty array for notes changes", () => {
      expect(getPdfsToRegenerate("notes")).toEqual([]);
    });

    it("should return both PDFs for unknown sections", () => {
      expect(getPdfsToRegenerate("unknownSection.field")).toEqual([
        "resume",
        "cover",
      ]);
    });

    it("should handle header changes affecting both PDFs", () => {
      expect(getPdfsToRegenerate("header.name")).toEqual(["resume", "cover"]);
    });

    it("should handle education changes affecting resume only", () => {
      expect(getPdfsToRegenerate("education[0].degree")).toEqual(["resume"]);
    });
  });

  describe("getPdfsToRegenerateFromFile", () => {
    it("should map info.yaml to both PDFs", () => {
      expect(getPdfsToRegenerateFromFile("info.yaml")).toEqual([
        "resume",
        "cover",
      ]);
    });

    it("should map experience.yaml to resume only", () => {
      expect(getPdfsToRegenerateFromFile("experience.yaml")).toEqual([
        "resume",
      ]);
    });

    it("should map work.yaml to resume only", () => {
      expect(getPdfsToRegenerateFromFile("work.yaml")).toEqual(["resume"]);
    });

    it("should map cover-letter.yml to cover only", () => {
      expect(getPdfsToRegenerateFromFile("cover-letter.yml")).toEqual([
        "cover",
      ]);
    });

    it("should map career.json to resume only", () => {
      expect(getPdfsToRegenerateFromFile("career.json")).toEqual(["resume"]);
    });

    it("should return empty array for metadata.yaml", () => {
      expect(getPdfsToRegenerateFromFile("metadata.yaml")).toEqual([]);
    });

    it("should return empty array for notes.json", () => {
      expect(getPdfsToRegenerateFromFile("notes.json")).toEqual([]);
    });

    it("should handle file paths with directories", () => {
      expect(getPdfsToRegenerateFromFile("google/experience.yaml")).toEqual([
        "resume",
      ]);
    });

    it("should handle nested paths", () => {
      expect(
        getPdfsToRegenerateFromFile("base/google/cover-letter.yml"),
      ).toEqual(["cover"]);
    });

    it("should return both PDFs for unknown files", () => {
      expect(getPdfsToRegenerateFromFile("unknown.yaml")).toEqual([
        "resume",
        "cover",
      ]);
    });

    it("should map header.yaml to both PDFs", () => {
      expect(getPdfsToRegenerateFromFile("header.yaml")).toEqual([
        "resume",
        "cover",
      ]);
    });

    it("should map education.yaml to resume only", () => {
      expect(getPdfsToRegenerateFromFile("education.yaml")).toEqual(["resume"]);
    });

    it("should handle numbered array file work.workExperience01.yml", () => {
      expect(getPdfsToRegenerateFromFile("work.workExperience01.yml")).toEqual([
        "resume",
      ]);
    });

    it("should handle numbered array file experience.workExperience02.yaml", () => {
      expect(
        getPdfsToRegenerateFromFile("experience.workExperience02.yaml"),
      ).toEqual(["resume"]);
    });

    it("should handle numbered array file in subdirectory", () => {
      expect(
        getPdfsToRegenerateFromFile("this-dot-labs/work.workExperience01.yml"),
      ).toEqual(["resume"]);
    });

    it("should handle numbered array file for projects", () => {
      expect(getPdfsToRegenerateFromFile("foo.projects01.yaml")).toEqual([
        "resume",
      ]);
    });

    it("should handle new 3-part format: projects.talon.01.yml", () => {
      expect(getPdfsToRegenerateFromFile("projects.talon.01.yml")).toEqual([
        "resume",
      ]);
    });

    it("should handle new 3-part format: workExperience.google.10.yaml", () => {
      expect(
        getPdfsToRegenerateFromFile("workExperience.google.10.yaml"),
      ).toEqual(["resume"]);
    });

    it("should handle new 3-part format: coverLetter.acme.05.yml", () => {
      expect(getPdfsToRegenerateFromFile("coverLetter.acme.05.yml")).toEqual([
        "cover",
      ]);
    });

    it("should handle new 3-part format with path: this-dot-labs/projects.talon.01.yml", () => {
      expect(
        getPdfsToRegenerateFromFile("this-dot-labs/projects.talon.01.yml"),
      ).toEqual(["resume"]);
    });

    it("should handle 3-part format with digits in middle: projects.10.talon.yml", () => {
      expect(getPdfsToRegenerateFromFile("projects.10.talon.yml")).toEqual([
        "resume",
      ]);
    });

    it("should handle 3-part format with digits in middle: workExperience.05.google.yaml", () => {
      expect(
        getPdfsToRegenerateFromFile("workExperience.05.google.yaml"),
      ).toEqual(["resume"]);
    });

    it("should handle 3-part format with digits in middle: coverLetter.01.acme.yml", () => {
      expect(getPdfsToRegenerateFromFile("coverLetter.01.acme.yml")).toEqual([
        "cover",
      ]);
    });

    it("should handle 3-part format with digits in middle with path: dir/projects.99.client.yml", () => {
      expect(getPdfsToRegenerateFromFile("dir/projects.99.client.yml")).toEqual(
        ["resume"],
      );
    });
  });
});
