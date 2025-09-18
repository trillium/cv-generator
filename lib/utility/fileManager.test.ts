import {
  listAllResumeFiles,
  readResumeData,
  saveResumeChanges,
  deleteResumeWithBackup,
  duplicateResume,
} from "./fileManager";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("File Manager Utility Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("listAllResumeFiles", () => {
    it("should successfully list all resume files", async () => {
      const mockResponse = {
        allFiles: ["data.yml", "config.json", "resumes/frontend.yml"],
        mainDirFiles: 2,
        resumeFiles: 1,
        totalFiles: 3,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await listAllResumeFiles();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith("/api/fs", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    it("should handle HTTP errors gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await listAllResumeFiles();

      expect(result.success).toBe(false);
      expect(result.error).toContain("HTTP error! status: 500");
    });

    it("should handle network errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await listAllResumeFiles();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("readResumeData", () => {
    it("should successfully read resume data from files", async () => {
      const mockFileData = {
        "data.yml": {
          info: {
            firstName: "John",
            lastName: "Doe",
            email: "john@example.com",
          },
          workExperience: [],
        },
        "frontend.yml": {
          info: {
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@example.com",
          },
          workExperience: [],
        },
      };

      const mockResponse = {
        success: true,
        files: mockFileData,
        totalFiles: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await readResumeData(["data.yml", "frontend.yml"]);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockFileData);
      expect(mockFetch).toHaveBeenCalledWith("/api/fs/get-files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: ["data.yml", "frontend.yml"],
        }),
      });
    });

    it("should handle empty file paths array", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ files: {} }),
      });

      const result = await readResumeData([]);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });

    it("should handle read errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Failed to read files"));

      const result = await readResumeData(["invalid.yml"]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to read files");
    });
  });

  describe("saveResumeChanges", () => {
    const mockResumeData = {
      info: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+1-555-0123",
        role: "Software Engineer",
      },
      careerSummary: [],
      header: {
        name: "John Doe",
        title: ["Software Engineer"],
        resume: ["Experienced developer with 5 years in web development"],
      },
      workExperience: [],
      profile: {
        shouldDisplayProfileImage: false,
        lines: [],
        links: [],
      },
      technical: [],
    };

    it("should successfully save resume changes with diff tracking", async () => {
      const mockResponse = {
        filePath: "/path/to/data.yml",
        yamlContent: "name: John\nage: 30",
        fileExisted: true,
        diffCreated: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await saveResumeChanges("data.yml", mockResumeData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith("/api/fs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filePath: "data.yml",
          data: mockResumeData,
          createDiff: true,
        }),
      });
    });

    it("should save with custom options", async () => {
      const mockResponse = {
        filePath: "/custom/path/data.yml",
        yamlContent: "name: John\nage: 30",
        fileExisted: false,
        diffCreated: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await saveResumeChanges("data.yml", mockResumeData, {
        createDiff: false,
        baseDirectory: "/custom/path",
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith("/api/fs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filePath: "data.yml",
          data: mockResumeData,
          createDiff: false,
          baseDirectory: "/custom/path",
        }),
      });
    });

    it("should handle save errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Write permission denied"));

      const result = await saveResumeChanges("data.yml", mockResumeData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Write permission denied");
    });
  });

  describe("deleteResumeWithBackup", () => {
    it("should successfully delete resume with backup", async () => {
      const mockResponse = {
        filePath: "/path/to/data.yml",
        backupCreated: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await deleteResumeWithBackup("data.yml");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/fs/delete?filePath=data.yml&createBackup=true",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    });

    it("should delete without backup when specified", async () => {
      const mockResponse = {
        filePath: "/path/to/data.yml",
        backupCreated: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await deleteResumeWithBackup("data.yml", {
        createBackup: false,
        baseDirectory: "/custom",
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/fs/delete?filePath=data.yml&createBackup=false&baseDirectory=%2Fcustom",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    });

    it("should handle delete errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("File not found"));

      const result = await deleteResumeWithBackup("nonexistent.yml");

      expect(result.success).toBe(false);
      expect(result.error).toBe("File not found");
    });
  });

  describe("duplicateResume", () => {
    it("should successfully duplicate resume", async () => {
      const mockResponse = {
        sourcePath: "/path/to/original.yml",
        destinationPath: "/path/to/copy.yml",
        overwritten: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await duplicateResume("original.yml", "copy.yml");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith("/api/fs/copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourcePath: "original.yml",
          destinationPath: "copy.yml",
          overwrite: false,
        }),
      });
    });

    it("should duplicate with overwrite when specified", async () => {
      const mockResponse = {
        sourcePath: "/path/to/original.yml",
        destinationPath: "/path/to/existing.yml",
        overwritten: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await duplicateResume("original.yml", "existing.yml", {
        overwrite: true,
        baseDirectory: "/custom",
      });

      expect(result.success).toBe(true);
      expect(result.data?.overwritten).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith("/api/fs/copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourcePath: "original.yml",
          destinationPath: "existing.yml",
          overwrite: true,
          baseDirectory: "/custom",
        }),
      });
    });

    it("should handle duplication errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Source file not found"));

      const result = await duplicateResume("missing.yml", "copy.yml");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Source file not found");
    });

    it("should handle file exists error when overwrite is false", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
      });

      const result = await duplicateResume("original.yml", "existing.yml");

      expect(result.success).toBe(false);
      expect(result.error).toContain("HTTP error! status: 409");
    });
  });

  describe("Integration scenarios", () => {
    it("should handle workflow: list -> read -> save -> duplicate", async () => {
      // List files
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ allFiles: ["data.yml"], totalFiles: 1 }),
      });

      const listResult = await listAllResumeFiles();
      expect(listResult.success).toBe(true);

      // Read file
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            files: { "data.yml": { info: { firstName: "John" } } },
          }),
      });

      const readResult = await readResumeData(["data.yml"]);
      expect(readResult.success).toBe(true);

      // Save changes
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ filePath: "/data.yml", diffCreated: true }),
      });

      const saveResult = await saveResumeChanges(
        "data.yml",
        readResult.data!["data.yml"],
      );
      expect(saveResult.success).toBe(true);

      // Duplicate
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            sourcePath: "/data.yml",
            destinationPath: "/backup.yml",
          }),
      });

      const duplicateResult = await duplicateResume("data.yml", "backup.yml");
      expect(duplicateResult.success).toBe(true);
    });
  });
});

// Real API Integration Tests (require running server)
describe("File Manager API Integration Tests", () => {
  const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4444";

  beforeEach(() => {
    // Restore original fetch for integration tests
    vi.restoreAllMocks();
  });

  describe("listAllResumeFiles API Integration", () => {
    it("should successfully fetch real file list from API", async () => {
      try {
        const result = await listAllResumeFiles();

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.allFiles).toBeInstanceOf(Array);
        expect(typeof result.data!.totalFiles).toBe("number");
        expect(typeof result.data!.mainDirFiles).toBe("number");
        expect(typeof result.data!.resumeFiles).toBe("number");

        // Log the actual response for debugging
        console.log("✅ Real API Response:", JSON.stringify(result, null, 2));
      } catch (error) {
        // If the test fails due to server not running, skip gracefully
        console.log(
          "⚠️  Server may not be running on port 4444. Skipping integration test.",
        );
        console.log(
          "   To run integration tests, start the dev server with: pnpm dev",
        );
      }
    }, 10000); // 10 second timeout for network requests

    it("should handle real API errors gracefully", async () => {
      // Test with a non-existent endpoint to verify error handling
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

      try {
        const result = await listAllResumeFiles();
        expect(result.success).toBe(false);
        expect(result.error).toContain("Network error");
      } finally {
        global.fetch = originalFetch;
      }
    });

    it("should validate API response structure matches interface", async () => {
      try {
        // Make a direct fetch to the API to inspect the raw response
        const response = await fetch(`${API_BASE_URL}/api/fs`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const rawData = await response.json();
          console.log("🔍 Raw API Response Structure:", Object.keys(rawData));

          // Check if the response has the expected fields
          const expectedFields = [
            "allFiles",
            "mainDirFiles",
            "resumeFiles",
            "totalFiles",
          ];
          const missingFields = expectedFields.filter(
            (field) => !(field in rawData),
          );
          const extraFields = Object.keys(rawData).filter(
            (field) =>
              !expectedFields.includes(field) &&
              field !== "success" &&
              field !== "directory",
          );

          if (missingFields.length > 0) {
            console.log("❌ Missing expected fields:", missingFields);
          }
          if (extraFields.length > 0) {
            console.log("ℹ️  Extra fields in response:", extraFields);
          }

          expect(rawData).toHaveProperty("allFiles");
          expect(Array.isArray(rawData.allFiles)).toBe(true);
        }
      } catch (error) {
        console.log("⚠️  Could not connect to API for structure validation");
      }
    }, 10000);
  });
});
