import { describe, it, expect } from "vitest";
import { getPdfsToRegenerate, SECTION_TO_PDF_MAP } from "./pdfSectionMapper";

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
});
