import { MultiResumeManager } from "./multiResumeManager";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Manual test function to verify the complete integration works
 * This simulates the web interface flow: select resume -> update field -> verify correct file updated
 */
export async function testMultiResumeUpdateIntegration() {
    console.log("🧪 Starting Multi-Resume Update Integration Test");

    const testPiiPath = path.join(__dirname, "..", "test-integration-pii");
    const originalPiiPath = process.env.PII_PATH;

    try {
        // Setup test environment
        process.env.PII_PATH = testPiiPath;
        process.env.MULTI_RESUME_ENABLED = "true";

        // Clean up any existing test files
        if (fs.existsSync(testPiiPath)) {
            fs.rmSync(testPiiPath, { recursive: true, force: true });
        }

        // Create test directory structure
        fs.mkdirSync(testPiiPath, { recursive: true });

        // Create default data.yml
        const defaultContent = `
name: "Default User"
title: ["Default Developer"]
email: "default@example.com"
workExperience:
  - company: "Default Company"
    role: "Default Role"
    duration: "2020-2025"
`.trim();
        fs.writeFileSync(path.join(testPiiPath, "data.yml"), defaultContent, "utf8");

        // Create test resumes
        const resumesDir = path.join(testPiiPath, "resumes");
        const googleDir = path.join(resumesDir, "software-engineer", "google", "2025-01-15");
        const metaDir = path.join(resumesDir, "frontend-developer", "meta", "2025-02-01");

        fs.mkdirSync(googleDir, { recursive: true });
        fs.mkdirSync(metaDir, { recursive: true });

        const googleContent = `
name: "Google Engineer"
title: ["Backend Engineer"]
email: "google@example.com"
workExperience:
  - company: "Google"
    role: "Senior Software Engineer"
    duration: "2023-2025"
`.trim();

        const metaContent = `
name: "Meta Developer"
title: ["React Developer"]
email: "meta@example.com"
workExperience:
  - company: "Meta"
    role: "Frontend Engineer"
    duration: "2024-2025"
`.trim();

        fs.writeFileSync(path.join(googleDir, "data.yml"), googleContent, "utf8");
        fs.writeFileSync(path.join(metaDir, "data.yml"), metaContent, "utf8");

        // Create metadata
        const googleMetadata = {
            id: "software-engineer-google-2025-01-15",
            position: "software-engineer",
            company: "google",
            dateCreated: "2025-01-15T00:00:00.000Z",
            lastModified: "2025-01-15T00:00:00.000Z",
            status: "draft",
            description: "Google SWE"
        };

        const metaMetadata = {
            id: "frontend-developer-meta-2025-02-01",
            position: "frontend-developer",
            company: "meta",
            dateCreated: "2025-02-01T00:00:00.000Z",
            lastModified: "2025-02-01T00:00:00.000Z",
            status: "draft",
            description: "Meta FE"
        };

        fs.writeFileSync(path.join(googleDir, "metadata.json"), JSON.stringify(googleMetadata, null, 2), "utf8");
        fs.writeFileSync(path.join(metaDir, "metadata.json"), JSON.stringify(metaMetadata, null, 2), "utf8");

        console.log("✅ Test environment created");

        // Initialize the system
        const manager = new MultiResumeManager();
        const scanResult = manager.scanAndUpdateIndex();

        console.log("📊 Scan result:", scanResult);

        // Test 1: Simulate user selecting Google resume
        console.log("\n🎯 Test 1: Simulating user selecting Google resume");

        const googleContext = {
            position: "software-engineer",
            company: "google",
            date: "2025-01-15"
        };

        // Read current content
        const googleCurrentContent = manager.getYamlData(googleContext);
        console.log("📄 Current Google resume content preview:", googleCurrentContent.substring(0, 100) + "...");

        // Test 2: Simulate updateYamlPath call (like changing name field)
        console.log("\n🎯 Test 2: Simulating field update (name change)");

        // This simulates what useYamlPathUpdater would do
        const updatedGoogleContent = googleCurrentContent.replace(
            'name: "Google Engineer"',
            'name: "UPDATED Google Engineer"'
        );

        // Simulate the API call that useContextAwareYamlUpdater would make
        console.log("🔄 Making update API call...");
        manager.updateResumeContent(
            googleContext.position,
            updatedGoogleContent,
            googleContext.company,
            googleContext.date
        );

        // Test 3: Verify the correct file was updated
        console.log("\n🎯 Test 3: Verifying correct file updated");

        // Check Google file directly
        const googleFilePath = path.join(googleDir, "data.yml");
        const googleFileContent = fs.readFileSync(googleFilePath, "utf8");
        const googleUpdated = googleFileContent.includes("UPDATED Google Engineer");

        console.log("✅ Google file updated:", googleUpdated);
        console.log("📄 Google file content:", googleFileContent.substring(0, 100) + "...");

        // Check Meta file was NOT affected
        const metaFilePath = path.join(metaDir, "data.yml");
        const metaFileContent = fs.readFileSync(metaFilePath, "utf8");
        const metaUnchanged = !metaFileContent.includes("UPDATED");

        console.log("✅ Meta file unchanged:", metaUnchanged);
        console.log("📄 Meta file content:", metaFileContent.substring(0, 100) + "...");

        // Check default file was NOT affected
        const defaultFilePath = path.join(testPiiPath, "data.yml");
        const defaultFileContent = fs.readFileSync(defaultFilePath, "utf8");
        const defaultUnchanged = !defaultFileContent.includes("UPDATED");

        console.log("✅ Default file unchanged:", defaultUnchanged);

        // Test 4: Verify via manager API
        console.log("\n🎯 Test 4: Verifying via manager API");

        const googleUpdatedContent = manager.getYamlData(googleContext);
        const apiUpdated = googleUpdatedContent.includes("UPDATED Google Engineer");

        console.log("✅ Update verified via API:", apiUpdated);

        // Test 5: Test cross-contamination protection
        console.log("\n🎯 Test 5: Testing cross-contamination protection");

        const metaContext = {
            position: "frontend-developer",
            company: "meta",
            date: "2025-02-01"
        };

        const metaCurrentContent = manager.getYamlData(metaContext);
        const metaStillClean = !metaCurrentContent.includes("UPDATED");

        console.log("✅ Meta resume still clean:", metaStillClean);

        // Final results
        console.log("\n🏁 Integration Test Results:");
        console.log("✅ Environment setup: PASS");
        console.log("✅ Scan and index: PASS");
        console.log(`✅ Google file updated: ${googleUpdated ? "PASS" : "FAIL"}`);
        console.log(`✅ Meta file protected: ${metaUnchanged ? "PASS" : "FAIL"}`);
        console.log(`✅ Default file protected: ${defaultUnchanged ? "PASS" : "FAIL"}`);
        console.log(`✅ API verification: ${apiUpdated ? "PASS" : "FAIL"}`);
        console.log(`✅ Cross-contamination protection: ${metaStillClean ? "PASS" : "FAIL"}`);

        const allTestsPassed = googleUpdated && metaUnchanged && defaultUnchanged && apiUpdated && metaStillClean;
        console.log(`\n🎉 Overall Result: ${allTestsPassed ? "ALL TESTS PASSED" : "SOME TESTS FAILED"}`);

        return allTestsPassed;

    } catch (error) {
        console.error("❌ Integration test failed:", error);
        return false;
    } finally {
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
    }
}

// Manual test execution
testMultiResumeUpdateIntegration().then(success => {
    process.exit(success ? 0 : 1);
});
