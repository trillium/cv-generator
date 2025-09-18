// @vitest-environment node
import fs from "fs";
import path from "path";
import { config } from "dotenv";
import { getYamlData } from "./getYamlData";

// Load environment variables from .env file
config();

// Test with actual PII_PATH
const piiPath =
  process.env.PII_PATH || "/Users/trilliumsmith/code/cv-generator/pii";

describe("YAML Data Propagation Test", () => {
  let originalDataExists = false;
  let tempDataExists = false;
  let changelogExists = false;

  beforeEach(() => {
    // Check what files exist before test
    originalDataExists = fs.existsSync(path.join(piiPath, "data.yml"));
    tempDataExists = fs.existsSync(path.join(piiPath, "data.temp.yml"));
    changelogExists = fs.existsSync(path.join(piiPath, "changelog.json"));
  });

  afterEach(() => {
    // Clean up any test files we created
    const testTempFile = path.join(piiPath, "data.temp.yml");
    if (fs.existsSync(testTempFile) && !tempDataExists) {
      try {
        fs.unlinkSync(testTempFile);
      } catch (e) {
        console.warn("Could not clean up test temp file:", e);
      }
    }
  });

  it("should show what files currently exist in PII directory", () => {
    const dataPath = path.join(piiPath, "data.yml");
    const tempPath = path.join(piiPath, "data.temp.yml");
    const changelogPath = path.join(piiPath, "changelog.json");

    console.log("PII_PATH:", piiPath);
    console.log("data.yml exists:", fs.existsSync(dataPath));
    console.log("data.temp.yml exists:", fs.existsSync(tempPath));
    console.log("changelog.json exists:", fs.existsSync(changelogPath));

    if (fs.existsSync(dataPath)) {
      console.log("data.yml size:", fs.statSync(dataPath).size, "bytes");
    }
    if (fs.existsSync(tempPath)) {
      console.log("data.temp.yml size:", fs.statSync(tempPath).size, "bytes");
    }
    if (fs.existsSync(changelogPath)) {
      const changelog = JSON.parse(fs.readFileSync(changelogPath, "utf8"));
      console.log("changelog entries:", changelog.length);
      if (changelog.length > 0) {
        console.log("latest entry:", changelog[changelog.length - 1]);
      }
    }

    // This test just logs information
    expect(true).toBe(true);
  });

  it("should read data from getYamlData function", () => {
    const yamlContent = getYamlData();

    expect(yamlContent).toBeDefined();
    expect(yamlContent.length).toBeGreaterThan(0);
    expect(yamlContent).not.toContain("Error:");

    console.log("getYamlData returned", yamlContent.length, "characters");
    console.log("First 100 characters:", yamlContent.substring(0, 100));
  });

  it("should prefer temp file over original if temp exists", () => {
    const tempPath = path.join(piiPath, "data.temp.yml");
    const originalPath = path.join(piiPath, "data.yml");

    if (fs.existsSync(tempPath) && fs.existsSync(originalPath)) {
      const tempContent = fs.readFileSync(tempPath, "utf8");
      const originalContent = fs.readFileSync(originalPath, "utf8");
      const yamlDataContent = getYamlData();

      console.log("Temp file size:", tempContent.length);
      console.log("Original file size:", originalContent.length);
      console.log("getYamlData returned size:", yamlDataContent.length);

      // Should match temp file content
      expect(yamlDataContent).toBe(tempContent);
      console.log("✅ getYamlData correctly prefers temp file");
    } else if (fs.existsSync(originalPath)) {
      const originalContent = fs.readFileSync(originalPath, "utf8");
      const yamlDataContent = getYamlData();

      // Should match original file content
      expect(yamlDataContent).toBe(originalContent);
      console.log("✅ getYamlData correctly uses original file when no temp");
    } else {
      console.log("❌ No data files found");
      expect(false).toBe(true);
    }
  });

  it("should create a test temp file and verify getYamlData picks it up", async () => {
    const tempPath = path.join(piiPath, "data.temp.yml");
    const testContent = `# Test content created at ${new Date().toISOString()}\nname: Test User\ntitle: ["Test Title"]`;

    // Only run if we can write to the directory
    if (!fs.existsSync(piiPath)) {
      console.log("PII directory does not exist, skipping test");
      expect(true).toBe(true);
      return;
    }

    try {
      // Create test temp file
      fs.writeFileSync(tempPath, testContent, "utf8");
      console.log("Created test temp file");

      // Get data via getYamlData
      const yamlContent = getYamlData();

      // Should match our test content
      expect(yamlContent).toBe(testContent);
      console.log("✅ getYamlData correctly reads test temp file");
    } catch (error) {
      console.error("Error in test:", error);
      throw error;
    }
  });

  it("should show current PII_PATH environment variable", () => {
    console.log("process.env.PII_PATH:", process.env.PII_PATH);
    console.log("Resolved piiPath:", piiPath);

    // Check if directory exists
    if (fs.existsSync(piiPath)) {
      const files = fs.readdirSync(piiPath);
      console.log("Files in PII directory:", files);
    } else {
      console.log("PII directory does not exist");
    }

    expect(process.env.PII_PATH).toBeDefined();
  });
});
