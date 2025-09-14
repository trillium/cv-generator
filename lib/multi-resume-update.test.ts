import fs from "fs";
import path from "path";
import { MultiResumeManager } from "./multiResumeManager";
import { ResumeContext } from "./types/multiResume";

// Test to verify that resume updates go to the correct file location
describe("Multi-Resume Update Verification", () => {
    const testPiiPath = path.join(__dirname, "..", "test-pii-multi-resume");
    const originalPiiPath = process.env.PII_PATH;

    beforeEach(() => {
        // Set up test environment
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

        // Create test resume structure
        const resumesDir = path.join(testPiiPath, "resumes");
        const frontendDir = path.join(resumesDir, "frontend-developer", "meta", "2025-02-01");
        const sweDirGoogle = path.join(resumesDir, "software-engineer", "google", "2025-01-15");
        const sweDirMicrosoft = path.join(resumesDir, "software-engineer", "microsoft", "2025-01-20");

        fs.mkdirSync(frontendDir, { recursive: true });
        fs.mkdirSync(sweDirGoogle, { recursive: true });
        fs.mkdirSync(sweDirMicrosoft, { recursive: true });

        // Create specific resume files with distinct content
        const frontendContent = `
name: "Frontend Developer"
title: ["React Developer"]
email: "frontend@example.com"
workExperience:
  - company: "Meta"
    role: "Frontend Engineer"
    duration: "2024-2025"
`.trim();

        const googleContent = `
name: "Software Engineer"
title: ["Backend Engineer"]
email: "swe@example.com"
workExperience:
  - company: "Google"
    role: "Senior Software Engineer"
    duration: "2023-2025"
`.trim();

        const microsoftContent = `
name: "Software Engineer"
title: ["Full Stack Engineer"]
email: "swe@example.com"
workExperience:
  - company: "Microsoft"
    role: "Principal Engineer"
    duration: "2022-2025"
`.trim();

        fs.writeFileSync(path.join(frontendDir, "data.yml"), frontendContent, "utf8");
        fs.writeFileSync(path.join(sweDirGoogle, "data.yml"), googleContent, "utf8");
        fs.writeFileSync(path.join(sweDirMicrosoft, "data.yml"), microsoftContent, "utf8");

        // Create metadata files
        const frontendMetadata = {
            id: "frontend-developer-meta-2025-02-01",
            position: "frontend-developer",
            company: "meta",
            dateCreated: "2025-02-01T00:00:00.000Z",
            lastModified: "2025-02-01T00:00:00.000Z",
            status: "draft",
            description: "Meta FE"
        };

        const googleMetadata = {
            id: "software-engineer-google-2025-01-15",
            position: "software-engineer",
            company: "google",
            dateCreated: "2025-01-15T00:00:00.000Z",
            lastModified: "2025-01-15T00:00:00.000Z",
            status: "draft",
            description: "Google SWE"
        };

        const microsoftMetadata = {
            id: "software-engineer-microsoft-2025-01-20",
            position: "software-engineer",
            company: "microsoft",
            dateCreated: "2025-01-20T00:00:00.000Z",
            lastModified: "2025-01-20T00:00:00.000Z",
            status: "draft",
            description: "MS SWE"
        };

        fs.writeFileSync(path.join(frontendDir, "metadata.json"), JSON.stringify(frontendMetadata, null, 2), "utf8");
        fs.writeFileSync(path.join(sweDirGoogle, "metadata.json"), JSON.stringify(googleMetadata, null, 2), "utf8");
        fs.writeFileSync(path.join(sweDirMicrosoft, "metadata.json"), JSON.stringify(microsoftMetadata, null, 2), "utf8");
    });

    afterEach(() => {
        // Clean up test files
        if (fs.existsSync(testPiiPath)) {
            fs.rmSync(testPiiPath, { recursive: true, force: true });
        }

        // Restore original environment
        if (originalPiiPath) {
            process.env.PII_PATH = originalPiiPath;
        } else {
            delete process.env.PII_PATH;
        }
    });

    describe("Resume Update Location Verification", () => {
        it("should scan and find all resume files", async () => {
            const manager = new MultiResumeManager();
            const scanResult = manager.scanAndUpdateIndex();

            expect(scanResult.scanned).toBe(3);
            expect(scanResult.added).toBe(3);
            expect(scanResult.errors).toHaveLength(0);

            const listResult = manager.listResumeVersions();
            expect(listResult.total).toBe(3);
            expect(listResult.positions).toContain("frontend-developer");
            expect(listResult.positions).toContain("software-engineer");
        });

        it("should read correct content for each specific resume", () => {
            const manager = new MultiResumeManager();
            manager.scanAndUpdateIndex();

            // Test frontend resume
            const frontendContext: ResumeContext = {
                position: "frontend-developer",
                company: "meta",
                date: "2025-02-01"
            };
            const frontendContent = manager.getYamlData(frontendContext);
            expect(frontendContent).toContain("React Developer");
            expect(frontendContent).toContain("Meta");
            expect(frontendContent).toContain("Frontend Engineer");

            // Test Google resume
            const googleContext: ResumeContext = {
                position: "software-engineer",
                company: "google",
                date: "2025-01-15"
            };
            const googleContent = manager.getYamlData(googleContext);
            expect(googleContent).toContain("Backend Engineer");
            expect(googleContent).toContain("Google");
            expect(googleContent).toContain("Senior Software Engineer");

            // Test Microsoft resume
            const microsoftContext: ResumeContext = {
                position: "software-engineer",
                company: "microsoft",
                date: "2025-01-20"
            };
            const microsoftContent = manager.getYamlData(microsoftContext);
            expect(microsoftContent).toContain("Full Stack Engineer");
            expect(microsoftContent).toContain("Microsoft");
            expect(microsoftContent).toContain("Principal Engineer");
        });

        it("should update the CORRECT specific resume file, not the default", () => {
            const manager = new MultiResumeManager();
            manager.scanAndUpdateIndex();

            // Update the Google resume specifically
            const googleContext: ResumeContext = {
                position: "software-engineer",
                company: "google",
                date: "2025-01-15"
            };

            const updatedGoogleContent = `
name: "UPDATED Software Engineer"
title: ["UPDATED Backend Engineer"]
email: "updated-swe@example.com"
workExperience:
  - company: "Google"
    role: "UPDATED Senior Software Engineer"
    duration: "2023-2025"
`.trim();

            // Update the Google resume
            manager.updateResumeContent(
                googleContext.position!,
                updatedGoogleContent,
                googleContext.company,
                googleContext.date
            );

            // Verify the Google resume was updated
            const googleContentAfter = manager.getYamlData(googleContext);
            expect(googleContentAfter).toContain("UPDATED Software Engineer");
            expect(googleContentAfter).toContain("UPDATED Backend Engineer");
            expect(googleContentAfter).toContain("UPDATED Senior Software Engineer");

            // Verify the Microsoft resume was NOT affected
            const microsoftContext: ResumeContext = {
                position: "software-engineer",
                company: "microsoft",
                date: "2025-01-20"
            };
            const microsoftContentAfter = manager.getYamlData(microsoftContext);
            expect(microsoftContentAfter).toContain("Full Stack Engineer");
            expect(microsoftContentAfter).toContain("Microsoft");
            expect(microsoftContentAfter).toContain("Principal Engineer");
            expect(microsoftContentAfter).not.toContain("UPDATED");

            // Verify the frontend resume was NOT affected
            const frontendContext: ResumeContext = {
                position: "frontend-developer",
                company: "meta",
                date: "2025-02-01"
            };
            const frontendContentAfter = manager.getYamlData(frontendContext);
            expect(frontendContentAfter).toContain("React Developer");
            expect(frontendContentAfter).toContain("Meta");
            expect(frontendContentAfter).toContain("Frontend Engineer");
            expect(frontendContentAfter).not.toContain("UPDATED");

            // Verify the default data.yml was NOT affected
            const defaultPath = path.join(testPiiPath, "data.yml");
            const defaultContent = fs.readFileSync(defaultPath, "utf8");
            expect(defaultContent).toContain("Default User");
            expect(defaultContent).toContain("Default Developer");
            expect(defaultContent).not.toContain("UPDATED");
        });

        it("should verify file system changes at exact file locations", () => {
            const manager = new MultiResumeManager();
            manager.scanAndUpdateIndex();

            const updatedContent = `
name: "FILE SYSTEM TEST"
title: ["Direct File Test"]
email: "test@example.com"
`.trim();

            // Update Microsoft resume
            manager.updateResumeContent(
                "software-engineer",
                updatedContent,
                "microsoft",
                "2025-01-20"
            );

            // Check the exact file was updated
            const microsoftFilePath = path.join(
                testPiiPath,
                "resumes",
                "software-engineer",
                "microsoft",
                "2025-01-20",
                "data.yml"
            );

            const fileContent = fs.readFileSync(microsoftFilePath, "utf8");
            expect(fileContent).toContain("FILE SYSTEM TEST");
            expect(fileContent).toContain("Direct File Test");

            // Check other files were not affected
            const googleFilePath = path.join(
                testPiiPath,
                "resumes",
                "software-engineer",
                "google",
                "2025-01-15",
                "data.yml"
            );

            const googleFileContent = fs.readFileSync(googleFilePath, "utf8");
            expect(googleFileContent).not.toContain("FILE SYSTEM TEST");
            expect(googleFileContent).toContain("Backend Engineer");

            // Check default file was not affected
            const defaultFilePath = path.join(testPiiPath, "data.yml");
            const defaultFileContent = fs.readFileSync(defaultFilePath, "utf8");
            expect(defaultFileContent).not.toContain("FILE SYSTEM TEST");
            expect(defaultFileContent).toContain("Default User");
        });
    });

    describe("API Integration Test", () => {
        it("should test end-to-end API update flow", async () => {
            const manager = new MultiResumeManager();
            manager.scanAndUpdateIndex();

            // Simulate API call to update specific resume
            const updateData = {
                action: "update-content",
                position: "frontend-developer",
                company: "meta",
                date: "2025-02-01",
                content: `
name: "API Updated Frontend Developer"
title: ["API React Developer"]
email: "api-updated@example.com"
workExperience:
  - company: "Meta"
    role: "API Updated Frontend Engineer"
    duration: "2024-2025"
`.trim()
            };

            // Perform the update
            manager.updateResumeContent(
                updateData.position,
                updateData.content,
                updateData.company,
                updateData.date
            );

            // Verify the update via API context read
            const context: ResumeContext = {
                position: updateData.position,
                company: updateData.company,
                date: updateData.date
            };

            const updatedContent = manager.getYamlData(context);
            expect(updatedContent).toContain("API Updated Frontend Developer");
            expect(updatedContent).toContain("API React Developer");
            expect(updatedContent).toContain("API Updated Frontend Engineer");

            // Verify other resumes unchanged
            const googleContent = manager.getYamlData({
                position: "software-engineer",
                company: "google",
                date: "2025-01-15"
            });
            expect(googleContent).not.toContain("API Updated");
            expect(googleContent).toContain("Backend Engineer");
        });
    });
});
