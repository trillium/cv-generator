// @vitest-environment node
import fs from "fs";
import path from "path";
import { tmpdir } from "os";
import { config } from "dotenv";
import { NextRequest, NextResponse } from "next/server";
import { GET, POST } from "../app/api/yaml-data/route";
import { getYamlData } from "./getYamlData";

// Load environment variables from .env file
config();

// Mock environment
const mockPiiPath = path.join(tmpdir(), "cv-generator-yaml-test");
process.env.PII_PATH = mockPiiPath;

// Test YAML data
const testYamlContent = `
name: Test User
title: ["Software Developer"]
email: test@example.com
resume:
  - "Test summary line"
experience:
  - company: "Test Company"
    role: "Developer"
    duration: "2022-2025"
`.trim();

const updatedYamlContent = `
name: Updated Test User
title: ["Senior Software Developer"]
email: updated@example.com
resume:
  - "Updated test summary line"
experience:
  - company: "Updated Test Company"
    role: "Senior Developer" 
    duration: "2022-2025"
`.trim();

describe("YAML Data Flow Integration", () => {
  beforeEach(() => {
    // Clean up any existing test files
    if (fs.existsSync(mockPiiPath)) {
      fs.rmSync(mockPiiPath, { recursive: true, force: true });
    }

    // Create test directory
    fs.mkdirSync(mockPiiPath, { recursive: true });

    // Create initial data.yml file
    fs.writeFileSync(
      path.join(mockPiiPath, "data.yml"),
      testYamlContent,
      "utf8",
    );
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(mockPiiPath)) {
      fs.rmSync(mockPiiPath, { recursive: true, force: true });
    }
  });

  describe("getYamlData function", () => {
    it("should read original data.yml when no temp file exists", () => {
      const result = getYamlData();
      expect(result).toBe(testYamlContent);
    });

    it("should prefer temp file over original when temp file exists", () => {
      // Create a temp file with different content
      fs.writeFileSync(
        path.join(mockPiiPath, "data.temp.yml"),
        updatedYamlContent,
        "utf8",
      );

      const result = getYamlData();
      expect(result).toBe(updatedYamlContent);
    });

    it("should handle missing PII_PATH gracefully", () => {
      const originalPath = process.env.PII_PATH;
      delete process.env.PII_PATH;

      // Should fall back to current directory
      const result = getYamlData();
      expect(result).toContain("Error: Could not read data.yml file");

      // Restore environment
      process.env.PII_PATH = originalPath;
    });

    it("should handle missing data.yml file", () => {
      // Remove the data.yml file
      fs.unlinkSync(path.join(mockPiiPath, "data.yml"));

      const result = getYamlData();
      expect(result).toContain("Error: Could not read data.yml file");
      expect(result).toContain("No data.yml file found in PII directory");
    });
  });

  describe("API Routes", () => {
    describe("GET /api/yaml-data", () => {
      it("should return original YAML when no temp changes exist", async () => {
        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.yamlContent).toBe(testYamlContent);
        expect(data.hasChanges).toBe(false);
        expect(Array.isArray(data.changelog)).toBe(true);
      });

      it("should return temp YAML when temp changes exist", async () => {
        // Create temp file
        fs.writeFileSync(
          path.join(mockPiiPath, "data.temp.yml"),
          updatedYamlContent,
          "utf8",
        );

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.yamlContent).toBe(updatedYamlContent);
        expect(data.hasChanges).toBe(true);
      });

      it("should handle missing PII_PATH environment variable", async () => {
        const originalPath = process.env.PII_PATH;
        delete process.env.PII_PATH;

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toContain(
          "PII_PATH environment variable is required",
        );

        // Restore environment
        process.env.PII_PATH = originalPath;
      });
    });

    describe("POST /api/yaml-data", () => {
      it("should save valid YAML to temp file and create changelog entry", async () => {
        const request = new Request("http://localhost/api/yaml-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ yamlContent: updatedYamlContent }),
        });

        const response = await POST(request as NextRequest);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain("Changes saved to file system");

        // Verify temp file was created
        const tempPath = path.join(mockPiiPath, "data.temp.yml");
        expect(fs.existsSync(tempPath)).toBe(true);

        const savedContent = fs.readFileSync(tempPath, "utf8");
        expect(savedContent).toBe(updatedYamlContent);

        // Verify changelog was created
        const changelogPath = path.join(mockPiiPath, "changelog.json");
        expect(fs.existsSync(changelogPath)).toBe(true);

        const changelog = JSON.parse(fs.readFileSync(changelogPath, "utf8"));
        expect(Array.isArray(changelog)).toBe(true);
        expect(changelog.length).toBe(1);
        expect(changelog[0].action).toBe("update");
      });

      it("should reject invalid YAML", async () => {
        const invalidYaml = `
name: Test User
  invalid: indent
    more: invalid
        `;

        const request = new Request("http://localhost/api/yaml-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ yamlContent: invalidYaml }),
        });

        const response = await POST(request as NextRequest);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain("Invalid YAML");
      });

      it("should create backup when requested and original exists", async () => {
        const request = new Request("http://localhost/api/yaml-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            yamlContent: updatedYamlContent,
            createBackup: true,
          }),
        });

        const response = await POST(request as NextRequest);
        expect(response.status).toBe(200);

        // Check that a backup file was created
        const files = fs.readdirSync(mockPiiPath);
        const backupFiles = files.filter((file) =>
          file.startsWith("data.backup."),
        );
        expect(backupFiles.length).toBe(1);

        // Verify backup content matches original
        const backupContent = fs.readFileSync(
          path.join(mockPiiPath, backupFiles[0]),
          "utf8",
        );
        expect(backupContent).toBe(testYamlContent);
      });
    });
  });

  describe("Data Propagation Flow", () => {
    it("should handle complete update cycle: save -> load -> verify", async () => {
      // Step 1: Save updated YAML via API
      const saveRequest = new Request("http://localhost/api/yaml-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yamlContent: updatedYamlContent }),
      });

      const saveResponse = await POST(saveRequest as NextRequest);
      expect(saveResponse.status).toBe(200);

      // Step 2: Load YAML via API
      const loadResponse = await GET();
      const loadData = await loadResponse.json();

      expect(loadResponse.status).toBe(200);
      expect(loadData.yamlContent).toBe(updatedYamlContent);
      expect(loadData.hasChanges).toBe(true);

      // Step 3: Verify getYamlData also returns updated content
      const fileContent = getYamlData();
      expect(fileContent).toBe(updatedYamlContent);
    });

    it("should maintain changelog across multiple updates", async () => {
      const updates = [
        "name: First Update",
        "name: Second Update",
        "name: Third Update",
      ];

      // Perform multiple updates
      for (const update of updates) {
        const request = new Request("http://localhost/api/yaml-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ yamlContent: update }),
        });

        const response = await POST(request as NextRequest);
        expect(response.status).toBe(200);
      }

      // Verify changelog has all entries
      const changelogPath = path.join(mockPiiPath, "changelog.json");
      const changelog = JSON.parse(fs.readFileSync(changelogPath, "utf8"));

      expect(changelog.length).toBe(3);
      changelog.forEach((entry: Record<string, unknown>) => {
        expect(entry.action).toBe("update");
        expect(entry.timestamp).toBeDefined();
      });
    });

    it("should limit changelog size to prevent unbounded growth", async () => {
      // Create more than 100 updates to test limiting
      for (let i = 0; i < 105; i++) {
        const request = new Request("http://localhost/api/yaml-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ yamlContent: `name: Update ${i}` }),
        });

        await POST(request as NextRequest);
      }

      // Verify changelog is limited to 100 entries
      const changelogPath = path.join(mockPiiPath, "changelog.json");
      const changelog = JSON.parse(fs.readFileSync(changelogPath, "utf8"));

      expect(changelog.length).toBe(100);
      // Should contain the last 100 updates (5-104)
      expect(changelog[0].timestamp).toBeDefined();
      expect(changelog[99].timestamp).toBeDefined();
    });
  });
});
