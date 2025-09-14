// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MultiResumeManager } from "../../lib/multiResumeManager";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Backend Resume Loading Diagnostics", () => {
    let testPiiPath: string;
    let originalPiiPath: string | undefined;
    let manager: MultiResumeManager;

    beforeEach(() => {
        testPiiPath = path.join(__dirname, "..", "..", "test-backend-pii");
        originalPiiPath = process.env.PII_PATH;

        // Setup test environment
        process.env.PII_PATH = testPiiPath;
        process.env.MULTI_RESUME_ENABLED = "true";
        process.env.NEXT_PUBLIC_MULTI_RESUME_ENABLED = "true";

        // Clean up any existing test files
        if (fs.existsSync(testPiiPath)) {
            fs.rmSync(testPiiPath, { recursive: true, force: true });
        }

        // Create test directory structure
        fs.mkdirSync(testPiiPath, { recursive: true });
        setupDiagnosticTestData();

        manager = new MultiResumeManager();
    });

    afterEach(() => {
        // Clean up
        if (fs.existsSync(testPiiPath)) {
            fs.rmSync(testPiiPath, { recursive: true, force: true });
        }

        // Restore environment
        if (originalPiiPath) {
            process.env.PII_PATH = originalPiiPath;
        } else {
            delete process.env.PII_PATH;
        }
    });

    function setupDiagnosticTestData() {
        console.log("🔧 Setting up diagnostic test data...");

        // Create default data.yml
        const defaultContent = `name: "TEST DEFAULT USER"
title: ["Test Default Developer"]
email: "test.default@example.com"
workExperience:
  - company: "Test Default Company"
    role: "Test Default Role"`;

        fs.writeFileSync(path.join(testPiiPath, "data.yml"), defaultContent, "utf8");
        console.log("✅ Created default data.yml");

        // Create resume directory structure
        const resumesDir = path.join(testPiiPath, "resumes");

        // Google resume
        const googleDir = path.join(resumesDir, "software-engineer", "google", "2025-01-15");
        fs.mkdirSync(googleDir, { recursive: true });

        const googleContent = `name: "TEST GOOGLE ENGINEER"
title: ["Test Senior Backend Engineer"]
email: "test.google@gmail.com"
workExperience:
  - company: "Test Google"
    role: "Test Senior Software Engineer"`;

        fs.writeFileSync(path.join(googleDir, "data.yml"), googleContent, "utf8");

        const googleMetadata = {
            id: "software-engineer-google-2025-01-15",
            position: "software-engineer",
            company: "google",
            dateCreated: "2025-01-15T00:00:00.000Z",
            lastModified: "2025-01-15T00:00:00.000Z",
            status: "active",
            description: "Test Google Backend Engineer"
        };

        fs.writeFileSync(
            path.join(googleDir, "metadata.json"),
            JSON.stringify(googleMetadata, null, 2),
            "utf8"
        );

        console.log("✅ Created Google resume data");
        console.log("📁 Test directory structure:");
        console.log(`   ${testPiiPath}/`);
        console.log(`   ├── data.yml`);
        console.log(`   └── resumes/`);
        console.log(`       └── software-engineer/`);
        console.log(`           └── google/`);
        console.log(`               └── 2025-01-15/`);
        console.log(`                   ├── data.yml`);
        console.log(`                   └── metadata.json`);
    }

    it("should verify test environment is set up correctly", () => {
        console.log("🧪 Testing environment setup...");

        // Check PII_PATH
        expect(process.env.PII_PATH).toBe(testPiiPath);
        console.log(`✅ PII_PATH: ${process.env.PII_PATH}`);

        // Check directory exists
        expect(fs.existsSync(testPiiPath)).toBe(true);
        console.log(`✅ Test directory exists: ${testPiiPath}`);

        // Check default data.yml exists
        const defaultPath = path.join(testPiiPath, "data.yml");
        expect(fs.existsSync(defaultPath)).toBe(true);
        console.log(`✅ Default data.yml exists: ${defaultPath}`);

        // Check resume directory exists
        const googlePath = path.join(testPiiPath, "resumes", "software-engineer", "google", "2025-01-15", "data.yml");
        expect(fs.existsSync(googlePath)).toBe(true);
        console.log(`✅ Google resume exists: ${googlePath}`);
    });

    it("should read default resume correctly", () => {
        console.log("📖 Testing default resume reading...");

        try {
            const content = manager.getYamlData();
            console.log("📄 Default content retrieved:");
            console.log(content);

            expect(content).toBeDefined();
            expect(content).toContain("TEST DEFAULT USER");
            expect(content).toContain("test.default@example.com");
            console.log("✅ Default resume reading works correctly");
        } catch (error) {
            console.error("❌ Error reading default resume:", error);
            throw error;
        }
    });

    it("should scan and find resume files", () => {
        console.log("🔍 Testing resume scanning...");

        try {
            const scanResult = manager.scanAndUpdateIndex();
            console.log("📊 Scan result:", scanResult);

            expect(scanResult.scanned).toBeGreaterThan(0);
            expect(scanResult.added).toBeGreaterThan(0);
            console.log(`✅ Scan found ${scanResult.scanned} resumes, added ${scanResult.added}`);
        } catch (error) {
            console.error("❌ Error during scan:", error);
            throw error;
        }
    });

    it("should read Google resume with context", () => {
        console.log("🎯 Testing context-based resume reading...");

        try {
            // First scan to populate index
            const scanResult = manager.scanAndUpdateIndex();
            console.log("📊 Scan result:", scanResult);

            const context = {
                position: "software-engineer",
                company: "google",
                date: "2025-01-15"
            };

            console.log("🔎 Requesting resume with context:", context);
            const content = manager.getYamlData(context);

            console.log("📄 Google content retrieved:");
            console.log(content);

            expect(content).toBeDefined();
            expect(content).toContain("TEST GOOGLE ENGINEER");
            expect(content).toContain("test.google@gmail.com");
            expect(content).not.toContain("TEST DEFAULT USER");
            console.log("✅ Google resume reading works correctly");
        } catch (error) {
            console.error("❌ Error reading Google resume:", error);
            console.error("Error details:", error instanceof Error ? error.message : String(error));
            throw error;
        }
    });

    it("should handle invalid context gracefully", () => {
        console.log("🚫 Testing invalid context handling...");

        try {
            const invalidContext = {
                position: "nonexistent-position",
                company: "nonexistent-company",
                date: "2025-01-01"
            };

            console.log("🔎 Requesting resume with invalid context:", invalidContext);
            const content = manager.getYamlData(invalidContext);

            console.log("📄 Content for invalid context:");
            console.log(content);

            expect(content).toBeDefined();
            expect(content).toContain("Error:");
            console.log("✅ Invalid context handled gracefully");
        } catch (error) {
            console.error("❌ Error handling invalid context:", error);
            throw error;
        }
    });

    it("should verify file system paths and permissions", () => {
        console.log("🔐 Testing file system access...");

        // Check default file
        const defaultPath = path.join(testPiiPath, "data.yml");
        const defaultStats = fs.statSync(defaultPath);
        console.log(`📄 Default file: ${defaultPath}`);
        console.log(`   Size: ${defaultStats.size} bytes`);
        console.log(`   Modified: ${defaultStats.mtime}`);

        // Check Google resume file
        const googlePath = path.join(testPiiPath, "resumes", "software-engineer", "google", "2025-01-15", "data.yml");
        const googleStats = fs.statSync(googlePath);
        console.log(`📄 Google file: ${googlePath}`);
        console.log(`   Size: ${googleStats.size} bytes`);
        console.log(`   Modified: ${googleStats.mtime}`);

        // Try reading files directly
        const defaultContent = fs.readFileSync(defaultPath, "utf8");
        console.log("📖 Direct read of default file:");
        console.log(defaultContent.substring(0, 100) + "...");

        const googleContent = fs.readFileSync(googlePath, "utf8");
        console.log("📖 Direct read of Google file:");
        console.log(googleContent.substring(0, 100) + "...");

        expect(defaultContent).toBeDefined();
        expect(googleContent).toBeDefined();
        console.log("✅ File system access works correctly");
    });

    it("should test complete resume switching flow", () => {
        console.log("🔄 Testing complete resume switching flow...");

        try {
            // Step 1: Initialize and scan
            console.log("1️⃣ Scanning and indexing...");
            const scanResult = manager.scanAndUpdateIndex();
            console.log(`   Scan result: ${JSON.stringify(scanResult)}`);

            // Step 2: Read default
            console.log("2️⃣ Reading default resume...");
            const defaultContent = manager.getYamlData();
            expect(defaultContent).toContain("TEST DEFAULT USER");
            console.log("   ✅ Default resume loaded");

            // Step 3: Switch to Google
            console.log("3️⃣ Switching to Google resume...");
            const googleContext = { position: "software-engineer", company: "google", date: "2025-01-15" };
            const googleContent = manager.getYamlData(googleContext);
            expect(googleContent).toContain("TEST GOOGLE ENGINEER");
            expect(googleContent).not.toContain("TEST DEFAULT USER");
            console.log("   ✅ Google resume loaded");

            // Step 4: Switch back to default
            console.log("4️⃣ Switching back to default...");
            const backToDefaultContent = manager.getYamlData();
            expect(backToDefaultContent).toContain("TEST DEFAULT USER");
            expect(backToDefaultContent).not.toContain("TEST GOOGLE ENGINEER");
            console.log("   ✅ Default resume reloaded");

            console.log("🎉 Complete flow works correctly!");
        } catch (error) {
            console.error("❌ Error in complete flow:", error);
            throw error;
        }
    });

    it("should debug MultiResumeManager internal state", () => {
        console.log("🔬 Debugging MultiResumeManager internal state...");

        try {
            // Check if environment variables are being read correctly
            console.log("🌍 Environment variables:");
            console.log(`   PII_PATH: ${process.env.PII_PATH}`);
            console.log(`   MULTI_RESUME_ENABLED: ${process.env.MULTI_RESUME_ENABLED}`);

            // Test indexManager
            console.log("📇 Testing index manager...");
            manager.scanAndUpdateIndex();

            // Try to get list of resumes
            console.log("📋 Getting resume list...");
            const resumeList = manager.listResumeVersions();
            console.log(`   Found ${resumeList.versions.length} resumes:`, resumeList.versions.map((r: any) => r.id));

            // Test getting navigation data
            console.log("🧭 Getting navigation data...");
            const navData = manager.getNavigationData();
            console.log("   Navigation data:", JSON.stringify(navData, null, 2));

            expect(resumeList.versions.length).toBeGreaterThan(0);
            console.log("✅ MultiResumeManager internal state looks good");
        } catch (error) {
            console.error("❌ Error in internal state debugging:", error);
            throw error;
        }
    });
});
