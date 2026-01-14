import { describe, it, expect } from "vitest";

describe("deriveDirectoryFromSources - numbered array bug reproduction", () => {
  const mockSources = {
    workExperience: [
      "pii/resumes/this-dot-labs/work.workExperience01.yml",
      "pii/resumes/this-dot-labs/work.workExperience10.yml",
      "pii/resumes/data.yml",
    ],
    personalInfo: "pii/resumes/this-dot-labs/info.yml",
    career: "pii/resumes/this-dot-labs/career.yml",
  };

  const deriveDirectoryFromSources = (
    section: string,
    currentSources: Record<string, string | string[]>,
    yamlPath: string,
    currentDirectory: string = "resumes",
  ): string => {
    const sourceFile = currentSources[section];
    if (!sourceFile) {
      return currentDirectory;
    }

    let sourcePath: string;
    if (Array.isArray(sourceFile)) {
      const arrayIndexMatch = yamlPath.match(/^\w+[.[](\d+)[\].]?/);
      const arrayIndex = arrayIndexMatch ? parseInt(arrayIndexMatch[1], 10) : 0;
      sourcePath = sourceFile[arrayIndex] || sourceFile[0];
    } else {
      sourcePath = sourceFile;
    }

    const withoutPii = sourcePath.replace(/^pii\//, "");
    const dirPath = withoutPii.substring(0, withoutPii.lastIndexOf("/"));

    return dirPath || currentDirectory;
  };

  it("should extract correct directory from single source", () => {
    const result = deriveDirectoryFromSources(
      "personalInfo",
      mockSources,
      "personalInfo.name",
    );
    expect(result).toBe("resumes/this-dot-labs");
  });

  describe("bracket notation [n]", () => {
    it("should extract correct directory from array source at index 0", () => {
      const result = deriveDirectoryFromSources(
        "workExperience",
        mockSources,
        "workExperience[0].company",
      );
      expect(result).toBe("resumes/this-dot-labs");
    });

    it("should extract correct directory from array source at index 1", () => {
      const result = deriveDirectoryFromSources(
        "workExperience",
        mockSources,
        "workExperience[1].company",
      );
      expect(result).toBe("resumes/this-dot-labs");
    });

    it("should extract correct directory from array source at index 2", () => {
      const result = deriveDirectoryFromSources(
        "workExperience",
        mockSources,
        "workExperience[2].company",
      );
      expect(result).toBe("resumes");
    });
  });

  describe("dot notation .n.", () => {
    it("should extract correct directory from array source at index 0 (dot notation)", () => {
      const result = deriveDirectoryFromSources(
        "workExperience",
        mockSources,
        "workExperience.0.company",
      );
      expect(result).toBe("resumes/this-dot-labs");
    });

    it("should extract correct directory from array source at index 1 (dot notation)", () => {
      const result = deriveDirectoryFromSources(
        "workExperience",
        mockSources,
        "workExperience.1.company",
      );
      expect(result).toBe("resumes/this-dot-labs");
    });

    it("should extract correct directory from array source at index 2 (dot notation)", () => {
      const result = deriveDirectoryFromSources(
        "workExperience",
        mockSources,
        "workExperience.2.company",
      );
      expect(result).toBe("resumes");
    });

    it("should handle nested dot notation path", () => {
      const result = deriveDirectoryFromSources(
        "workExperience",
        mockSources,
        "workExperience.0.details.0.subhead",
      );
      expect(result).toBe("resumes/this-dot-labs");
    });
  });

  it("should fall back to index 0 when no array index in path", () => {
    const result = deriveDirectoryFromSources(
      "workExperience",
      mockSources,
      "workExperience",
    );
    expect(result).toBe("resumes/this-dot-labs");
  });

  it("should fall back to currentDirectory when section not found", () => {
    const result = deriveDirectoryFromSources(
      "unknownSection",
      mockSources,
      "unknownSection.field",
      "resumes/fallback",
    );
    expect(result).toBe("resumes/fallback");
  });

  it("should handle array index out of bounds by falling back to index 0", () => {
    const result = deriveDirectoryFromSources(
      "workExperience",
      mockSources,
      "workExperience[999].company",
    );
    expect(result).toBe("resumes/this-dot-labs");
  });
});
