// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MultiResumeManager } from "./multiResumeManager";
import type { ResumeContext } from "./types/multiResume";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Resume Navigation Switching", () => {
    let testPiiPath: string;
    let originalPiiPath: string | undefined;
    let manager: MultiResumeManager;

    beforeEach(() => {
        testPiiPath = path.join(__dirname, "..", "test-navigation-pii");
        originalPiiPath = process.env.PII_PATH;

        // Setup test environment
        process.env.PII_PATH = testPiiPath;
        process.env.MULTI_RESUME_ENABLED = "true";

        // Clean up any existing test files
        if (fs.existsSync(testPiiPath)) {
            fs.rmSync(testPiiPath, { recursive: true, force: true });
        }

        // Create test directory structure
        fs.mkdirSync(testPiiPath, { recursive: true });
        setupTestData();

        manager = new MultiResumeManager();
        manager.scanAndUpdateIndex();
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

    function setupTestData() {
        // Create default data.yml with distinctive content
        const defaultContent = `
name: "DEFAULT USER"
title: ["Default Developer"]
email: "default@example.com"
workExperience:
  - company: "Default Company"
    role: "Default Role"
    duration: "2020-2025"
    responsibilities:
      - "Default task 1"
      - "Default task 2"
projects:
  - name: "Default Project"
    description: "A default project"
`.trim();
        fs.writeFileSync(path.join(testPiiPath, "data.yml"), defaultContent, "utf8");

        // Create multiple distinct resume versions with very different content
        const resumesDir = path.join(testPiiPath, "resumes");

        // Software Engineer - Google
        const googleDir = path.join(resumesDir, "software-engineer", "google", "2025-01-15");
        fs.mkdirSync(googleDir, { recursive: true });

        const googleContent = `
name: "GOOGLE ENGINEER"
title: ["Senior Backend Engineer", "Distributed Systems Engineer"]
email: "google.engineer@gmail.com"
workExperience:
  - company: "Google"
    role: "Senior Software Engineer"
    duration: "2023-2025"
    responsibilities:
      - "Developed scalable microservices"
      - "Led team of 5 engineers"
      - "Optimized database queries by 40%"
projects:
  - name: "Search Infrastructure"
    description: "Built distributed search system"
    technologies: ["Go", "Kubernetes", "BigQuery"]
skills:
  - "Go"
  - "Kubernetes"
  - "Distributed Systems"
`.trim();

        // Frontend Developer - Meta
        const metaDir = path.join(resumesDir, "frontend-developer", "meta", "2025-02-01");
        fs.mkdirSync(metaDir, { recursive: true });

        const metaContent = `
name: "META FRONTEND DEVELOPER"
title: ["Senior React Developer", "UI/UX Engineer"]
email: "meta.frontend@meta.com"
workExperience:
  - company: "Meta"
    role: "Senior Frontend Engineer"
    duration: "2024-2025"
    responsibilities:
      - "Built React components for Facebook"
      - "Optimized bundle size by 30%"
projects:
  - name: "Facebook News Feed"
    description: "Redesigned news feed interface"
    technologies: ["React", "GraphQL", "TypeScript"]
skills:
  - "React"
  - "TypeScript"
  - "GraphQL"
`.trim();

        // Write resume files
        fs.writeFileSync(path.join(googleDir, "data.yml"), googleContent, "utf8");
        fs.writeFileSync(path.join(metaDir, "data.yml"), metaContent, "utf8");

        // Create metadata for all resumes
        const metadataConfigs = [
            {
                dir: googleDir,
                metadata: {
                    id: "software-engineer-google-2025-01-15",
                    position: "software-engineer",
                    company: "google",
                    dateCreated: "2025-01-15T00:00:00.000Z",
                    lastModified: "2025-01-15T00:00:00.000Z",
                    status: "active",
                    description: "Google Backend Engineer"
                }
            },
            {
                dir: metaDir,
                metadata: {
                    id: "frontend-developer-meta-2025-02-01",
                    position: "frontend-developer",
                    company: "meta",
                    dateCreated: "2025-02-01T00:00:00.000Z",
                    lastModified: "2025-02-01T00:00:00.000Z",
                    status: "draft",
                    description: "Meta Frontend Developer"
                }
            }
        ];

        metadataConfigs.forEach(config => {
            fs.writeFileSync(
                path.join(config.dir, "metadata.json"),
                JSON.stringify(config.metadata, null, 2),
                "utf8"
            );
        });
    }

    it("should return default resume when no context provided", () => {
        const content = manager.getYamlData(undefined);

        expect(content).toContain("DEFAULT USER");
        expect(content).toContain("Default Company");
        expect(content).toContain("Default Role");
        expect(content).toContain("Default Project");

        // Should not contain content from specific resumes
        expect(content).not.toContain("GOOGLE ENGINEER");
        expect(content).not.toContain("META FRONTEND DEVELOPER");
    });

    it("should return Google resume when navigating to Google software engineer", () => {
        const context: ResumeContext = {
            position: "software-engineer",
            company: "google",
            date: "2025-01-15"
        };

        const content = manager.getYamlData(context);

        expect(content).toContain("GOOGLE ENGINEER");
        expect(content).toContain("Google");
        expect(content).toContain("Senior Software Engineer");
        expect(content).toContain("Search Infrastructure");
        expect(content).toContain("Go");
        expect(content).toContain("Kubernetes");

        // Should not contain content from other resumes
        expect(content).not.toContain("DEFAULT USER");
        expect(content).not.toContain("META FRONTEND DEVELOPER");
        expect(content).not.toContain("React");
    });

    it("should return Meta resume when navigating to Meta frontend developer", () => {
        const context: ResumeContext = {
            position: "frontend-developer",
            company: "meta",
            date: "2025-02-01"
        };

        const content = manager.getYamlData(context);

        expect(content).toContain("META FRONTEND DEVELOPER");
        expect(content).toContain("Meta");
        expect(content).toContain("Senior Frontend Engineer");
        expect(content).toContain("Facebook News Feed");
        expect(content).toContain("React");
        expect(content).toContain("GraphQL");

        // Should not contain content from other resumes
        expect(content).not.toContain("DEFAULT USER");
        expect(content).not.toContain("GOOGLE ENGINEER");
        expect(content).not.toContain("Go");
        expect(content).not.toContain("Kubernetes");
    });

    it("should properly switch between different resume contexts", () => {
        // Start with Google resume
        const googleContext: ResumeContext = {
            position: "software-engineer",
            company: "google",
            date: "2025-01-15"
        };
        let content = manager.getYamlData(googleContext);
        expect(content).toContain("GOOGLE ENGINEER");
        expect(content).toContain("Go");
        expect(content).not.toContain("React");

        // Switch to Meta resume
        const metaContext: ResumeContext = {
            position: "frontend-developer",
            company: "meta",
            date: "2025-02-01"
        };
        content = manager.getYamlData(metaContext);
        expect(content).toContain("META FRONTEND DEVELOPER");
        expect(content).toContain("React");
        expect(content).not.toContain("Go");

        // Switch back to default
        content = manager.getYamlData(undefined);
        expect(content).toContain("DEFAULT USER");
        expect(content).not.toContain("GOOGLE ENGINEER");
        expect(content).not.toContain("META FRONTEND DEVELOPER");

        // Switch back to Google
        content = manager.getYamlData(googleContext);
        expect(content).toContain("GOOGLE ENGINEER");
        expect(content).toContain("Go");
        expect(content).not.toContain("React");
    });

    it("should handle invalid resume context gracefully", () => {
        const invalidContext: ResumeContext = {
            position: "nonexistent-position",
            company: "nonexistent-company",
            date: "2025-01-01"
        };

        // Should return error message instead of crashing
        const content = manager.getYamlData(invalidContext);
        expect(content).toContain("Error: Could not read resume data");
        expect(content).toContain("Resume not found for context");
        expect(content).toContain("nonexistent-position");
        expect(content).toContain("nonexistent-company");
    });

    it("should maintain data integrity across multiple navigation switches", () => {
        const contexts = [
            { position: "software-engineer", company: "google", date: "2025-01-15" },
            { position: "frontend-developer", company: "meta", date: "2025-02-01" },
            undefined,
            { position: "software-engineer", company: "google", date: "2025-01-15" }
        ] as const;

        const expectedKeywords = [
            ["GOOGLE ENGINEER", "Go"],
            ["META FRONTEND DEVELOPER", "React"],
            ["DEFAULT USER", "Default Company"],
            ["GOOGLE ENGINEER", "Go"]
        ];

        contexts.forEach((context, index) => {
            const content = manager.getYamlData(context);
            const keywords = expectedKeywords[index];

            keywords.forEach(keyword => {
                expect(content).toContain(keyword);
            });

            // Verify no contamination from other resumes
            const otherKeywords = expectedKeywords
                .filter((_, i) => i !== index)
                .flat();

            otherKeywords.forEach(keyword => {
                if (!keywords.includes(keyword)) {
                    expect(content).not.toContain(keyword);
                }
            });
        });
    });
});
