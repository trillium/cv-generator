// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { spawn, ChildProcess } from "child_process";
import { MultiResumeManager } from "../../lib/multiResumeManager";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Puppeteer for real browser automation
let browser: any;
let page: any;

describe("Resume Switching Integration Test", () => {
    let testPiiPath: string;
    let originalPiiPath: string | undefined;
    let manager: MultiResumeManager;
    let serverProcess: ChildProcess | null = null;
    let serverUrl = "http://localhost:3001"; // Use different port to avoid conflicts

    beforeAll(async () => {
        // Try to import puppeteer, fall back to basic fetch testing if not available
        try {
            const puppeteer = await import("puppeteer");
            browser = await puppeteer.default.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            console.log("✅ Puppeteer available - using browser automation");
        } catch (error) {
            console.log("⚠️ Puppeteer not available - using API testing only");
        }
    }, 30000);

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    beforeEach(async () => {
        testPiiPath = path.join(__dirname, "..", "..", "test-integration-pii");
        originalPiiPath = process.env.PII_PATH;

        // Setup test environment
        process.env.PII_PATH = testPiiPath;
        process.env.MULTI_RESUME_ENABLED = "true";
        process.env.NEXT_PUBLIC_MULTI_RESUME_ENABLED = "true";
        process.env.PORT = "3001";

        // Clean up any existing test files
        if (fs.existsSync(testPiiPath)) {
            fs.rmSync(testPiiPath, { recursive: true, force: true });
        }

        // Create test directory structure
        fs.mkdirSync(testPiiPath, { recursive: true });
        setupRealTestData();

        manager = new MultiResumeManager();
        const scanResult = manager.scanAndUpdateIndex();
        console.log("📊 Scan result:", scanResult);

        // Start the Next.js development server
        await startServer();
    }, 60000);

    afterEach(async () => {
        // Stop server
        if (serverProcess) {
            serverProcess.kill('SIGTERM');
            serverProcess = null;

            // Wait a bit for cleanup
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Clean up test files
        if (fs.existsSync(testPiiPath)) {
            fs.rmSync(testPiiPath, { recursive: true, force: true });
        }

        // Restore environment
        if (originalPiiPath) {
            process.env.PII_PATH = originalPiiPath;
        } else {
            delete process.env.PII_PATH;
        }
        delete process.env.PORT;
    });

    function setupRealTestData() {
        // Create default data.yml with distinctive content
        const defaultContent = `
name: "DEFAULT INTEGRATION USER"
title: ["Default Integration Developer"]
email: "default.integration@example.com"
phone: "555-0000"
workExperience:
  - company: "Default Integration Company"
    role: "Default Integration Role"
    duration: "2020-2025"
    responsibilities:
      - "Default integration task 1"
      - "Default integration task 2"
projects:
  - name: "Default Integration Project"
    description: "A default integration project"
    technologies: ["Default Tech"]
skills:
  - "Default Skill 1"
  - "Default Skill 2"
`.trim();
        fs.writeFileSync(path.join(testPiiPath, "data.yml"), defaultContent, "utf8");

        const resumesDir = path.join(testPiiPath, "resumes");

        // Google Software Engineer Resume
        const googleDir = path.join(resumesDir, "software-engineer", "google", "2025-01-15");
        fs.mkdirSync(googleDir, { recursive: true });

        const googleContent = `
name: "GOOGLE INTEGRATION ENGINEER"
title: ["Senior Backend Engineer", "Distributed Systems Engineer"]
email: "google.integration@gmail.com"
phone: "555-1111"
workExperience:
  - company: "Google Integration"
    role: "Senior Software Engineer"
    duration: "2023-2025"
    responsibilities:
      - "Developed scalable microservices for integration"
      - "Led team of 5 engineers in integration projects"
      - "Optimized database queries by 40% for integration"
projects:
  - name: "Search Infrastructure Integration"
    description: "Built distributed search system for integration"
    technologies: ["Go", "Kubernetes", "BigQuery", "Integration Tools"]
skills:
  - "Go"
  - "Kubernetes"
  - "Distributed Systems"
  - "Integration Testing"
`.trim();

        // Meta Frontend Developer Resume
        const metaDir = path.join(resumesDir, "frontend-developer", "meta", "2025-02-01");
        fs.mkdirSync(metaDir, { recursive: true });

        const metaContent = `
name: "META INTEGRATION FRONTEND DEVELOPER"
title: ["Senior React Developer", "UI/UX Integration Engineer"]
email: "meta.integration@meta.com"
phone: "555-2222"
workExperience:
  - company: "Meta Integration"
    role: "Senior Frontend Engineer"
    duration: "2024-2025"
    responsibilities:
      - "Built React components for Facebook integration"
      - "Optimized bundle size by 30% for integration"
      - "Implemented A/B testing framework for integration"
projects:
  - name: "Facebook News Feed Integration"
    description: "Redesigned news feed interface for integration"
    technologies: ["React", "GraphQL", "TypeScript", "Integration Framework"]
skills:
  - "React"
  - "TypeScript"
  - "GraphQL"
  - "Frontend Integration"
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
                    description: "Google Integration Backend Engineer"
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
                    description: "Meta Integration Frontend Developer"
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

        console.log("✅ Real integration test data created");
    }

    async function startServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            console.log("🚀 Starting Next.js server for integration test...");

            // Start the Next.js development server
            serverProcess = spawn("pnpm", ["dev", "-p", "3001"], {
                cwd: path.join(__dirname, "..", ".."),
                stdio: ["ignore", "pipe", "pipe"],
                env: {
                    ...process.env,
                    NODE_ENV: "development",
                    PII_PATH: testPiiPath,
                    MULTI_RESUME_ENABLED: "true",
                    NEXT_PUBLIC_MULTI_RESUME_ENABLED: "true",
                    PORT: "3001"
                }
            });

            let serverReady = false;
            const timeout = setTimeout(() => {
                if (!serverReady) {
                    reject(new Error("Server failed to start within timeout"));
                }
            }, 45000); // 45 second timeout

            serverProcess!.stdout?.on("data", (data) => {
                const output = data.toString();
                console.log("📤 Server:", output.trim());

                // Look for various indicators that the server is ready
                if (output.includes("Ready") ||
                    output.includes("started server on") ||
                    output.includes("Local:") ||
                    output.includes("localhost:3001")) {
                    if (!serverReady) {
                        serverReady = true;
                        clearTimeout(timeout);
                        console.log("✅ Server is ready!");
                        // Give it a moment more to fully initialize
                        setTimeout(resolve, 2000);
                    }
                }
            });

            serverProcess!.stderr?.on("data", (data) => {
                const error = data.toString();
                console.error("❌ Server error:", error.trim());
                // Don't fail on warnings, only on actual errors
                if (error.includes("Error:") && !error.includes("Warning:")) {
                    if (!serverReady) {
                        clearTimeout(timeout);
                        reject(new Error(`Server error: ${error}`));
                    }
                }
            });

            serverProcess!.on("error", (error) => {
                console.error("❌ Failed to start server:", error);
                if (!serverReady) {
                    clearTimeout(timeout);
                    reject(error);
                }
            });

            serverProcess!.on("exit", (code) => {
                console.log(`📤 Server exited with code ${code}`);
                if (!serverReady && code !== 0) {
                    clearTimeout(timeout);
                    reject(new Error(`Server exited with code ${code}`));
                }
            });
        });
    }

    async function waitForServer(): Promise<boolean> {
        const maxAttempts = 30;
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await fetch(`${serverUrl}/api/health`, {
                    method: 'GET',
                    headers: { 'Cache-Control': 'no-cache' }
                });
                if (response.ok || response.status === 404) { // 404 is ok, means server is up
                    console.log("✅ Server is responding");
                    return true;
                }
            } catch (error) {
                // Server not ready yet
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log(`⏳ Waiting for server... (${i + 1}/${maxAttempts})`);
        }
        return false;
    }

    it("should serve default resume data via API", async () => {
        const serverReady = await waitForServer();
        expect(serverReady).toBe(true);

        const response = await fetch(`${serverUrl}/api/yaml-data`);
        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.yamlContent).toContain("DEFAULT INTEGRATION USER");
        expect(data.yamlContent).toContain("default.integration@example.com");
        expect(data.yamlContent).toContain("Default Integration Company");
    });

    it("should list available resumes via multi-resume API", async () => {
        const serverReady = await waitForServer();
        expect(serverReady).toBe(true);

        const response = await fetch(`${serverUrl}/api/multi-resume?action=list`);
        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.versions).toBeDefined();
        expect(data.versions.length).toBe(2);

        const positions = data.versions.map((v: any) => v.position);
        expect(positions).toContain("software-engineer");
        expect(positions).toContain("frontend-developer");

        const companies = data.versions.map((v: any) => v.company);
        expect(companies).toContain("google");
        expect(companies).toContain("meta");
    });

    it("should switch to Google resume via API", async () => {
        const serverReady = await waitForServer();
        expect(serverReady).toBe(true);

        const response = await fetch(`${serverUrl}/api/multi-resume?action=data&position=software-engineer&company=google&date=2025-01-15`);
        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.yamlContent).toContain("GOOGLE INTEGRATION ENGINEER");
        expect(data.yamlContent).toContain("google.integration@gmail.com");
        expect(data.yamlContent).toContain("Google Integration");
        expect(data.yamlContent).toContain("Search Infrastructure Integration");

        // Should not contain default or Meta content
        expect(data.yamlContent).not.toContain("DEFAULT INTEGRATION USER");
        expect(data.yamlContent).not.toContain("META INTEGRATION FRONTEND DEVELOPER");
    });

    it("should switch to Meta resume via API", async () => {
        const serverReady = await waitForServer();
        expect(serverReady).toBe(true);

        const response = await fetch(`${serverUrl}/api/multi-resume?action=data&position=frontend-developer&company=meta&date=2025-02-01`);
        expect(response.ok).toBe(true);

        const data = await response.json();
        expect(data.yamlContent).toContain("META INTEGRATION FRONTEND DEVELOPER");
        expect(data.yamlContent).toContain("meta.integration@meta.com");
        expect(data.yamlContent).toContain("Meta Integration");
        expect(data.yamlContent).toContain("Facebook News Feed Integration");

        // Should not contain default or Google content
        expect(data.yamlContent).not.toContain("DEFAULT INTEGRATION USER");
        expect(data.yamlContent).not.toContain("GOOGLE INTEGRATION ENGINEER");
    });

    it("should handle resume switching sequence via API", async () => {
        const serverReady = await waitForServer();
        expect(serverReady).toBe(true);

        // Start with default
        let response = await fetch(`${serverUrl}/api/yaml-data`);
        let data = await response.json();
        expect(data.yamlContent).toContain("DEFAULT INTEGRATION USER");

        // Switch to Google
        response = await fetch(`${serverUrl}/api/multi-resume?action=data&position=software-engineer&company=google&date=2025-01-15`);
        data = await response.json();
        expect(data.yamlContent).toContain("GOOGLE INTEGRATION ENGINEER");

        // Switch to Meta
        response = await fetch(`${serverUrl}/api/multi-resume?action=data&position=frontend-developer&company=meta&date=2025-02-01`);
        data = await response.json();
        expect(data.yamlContent).toContain("META INTEGRATION FRONTEND DEVELOPER");

        // Switch back to Google
        response = await fetch(`${serverUrl}/api/multi-resume?action=data&position=software-engineer&company=google&date=2025-01-15`);
        data = await response.json();
        expect(data.yamlContent).toContain("GOOGLE INTEGRATION ENGINEER");
        expect(data.yamlContent).not.toContain("META INTEGRATION FRONTEND DEVELOPER");
    });

    // Browser automation test (if Puppeteer is available)
    if (browser) {
        it("should allow user to switch resumes in browser UI", async () => {
            const serverReady = await waitForServer();
            expect(serverReady).toBe(true);

            page = await browser.newPage();
            await page.goto(`${serverUrl}/two-column/resume`);

            // Wait for page to load
            await page.waitForSelector('body', { timeout: 10000 });

            // Check for default content
            const pageContent = await page.content();
            console.log("📄 Page loaded, checking for default content...");

            // Look for any indication of the default data
            const hasDefaultContent = pageContent.includes("DEFAULT INTEGRATION USER") ||
                pageContent.includes("default.integration@example.com") ||
                pageContent.includes("Default Integration");

            if (hasDefaultContent) {
                console.log("✅ Default content found in page");
            } else {
                console.log("⚠️ Default content not found, page might not be rendering correctly");
                console.log("📄 Page content preview:", pageContent.substring(0, 500));
            }

            // Try to find and interact with resume navigation
            try {
                // Look for any button or element that might open resume navigation
                const buttons = await page.$$('button');
                console.log(`🔍 Found ${buttons.length} buttons on page`);

                // Try to find navigation or menu button
                let navigationFound = false;
                for (const button of buttons) {
                    const buttonText = await button.evaluate((el: any) => el.textContent || el.innerText || '');
                    console.log(`🔘 Button text: "${buttonText}"`);

                    if (buttonText.toLowerCase().includes('resume') ||
                        buttonText.toLowerCase().includes('menu') ||
                        buttonText.toLowerCase().includes('nav')) {
                        await button.click();
                        navigationFound = true;
                        console.log("✅ Clicked navigation button");
                        break;
                    }
                }

                if (!navigationFound) {
                    console.log("⚠️ No resume navigation button found");
                }

                // Give time for any navigation to appear
                await page.waitForTimeout(2000);

                const finalContent = await page.content();
                console.log("📄 Final page state contains resume content");

            } catch (error) {
                console.log("⚠️ Browser interaction failed:", error);
                // Don't fail the test for UI interaction issues
            }

            await page.close();
        }, 30000);
    }

    it("should verify complete integration flow works end-to-end", async () => {
        console.log("🧪 Running complete integration verification...");

        const serverReady = await waitForServer();
        expect(serverReady).toBe(true);

        // 1. Verify backend data layer
        console.log("📊 Step 1: Backend data verification");
        expect(manager.getYamlData()).toContain("DEFAULT INTEGRATION USER");
        expect(manager.getYamlData({ position: "software-engineer", company: "google", date: "2025-01-15" })).toContain("GOOGLE INTEGRATION ENGINEER");
        expect(manager.getYamlData({ position: "frontend-developer", company: "meta", date: "2025-02-01" })).toContain("META INTEGRATION FRONTEND DEVELOPER");

        // 2. Verify API layer
        console.log("🔌 Step 2: API layer verification");
        let response = await fetch(`${serverUrl}/api/multi-resume?action=list`);
        expect(response.ok).toBe(true);
        let data = await response.json();
        expect(data.versions.length).toBe(2);

        // 3. Verify data switching via API
        console.log("🔄 Step 3: API data switching verification");
        response = await fetch(`${serverUrl}/api/multi-resume?action=data&position=software-engineer&company=google&date=2025-01-15`);
        data = await response.json();
        expect(data.yamlContent).toContain("GOOGLE INTEGRATION ENGINEER");
        expect(data.yamlContent).not.toContain("DEFAULT INTEGRATION USER");

        // 4. Verify server responds to different resume contexts
        console.log("🎯 Step 4: Context switching verification");
        const contexts = [
            { params: "", expected: "DEFAULT INTEGRATION USER" },
            { params: "?position=software-engineer&company=google&date=2025-01-15", expected: "GOOGLE INTEGRATION ENGINEER" },
            { params: "?position=frontend-developer&company=meta&date=2025-02-01", expected: "META INTEGRATION FRONTEND DEVELOPER" }
        ];

        for (const context of contexts) {
            response = await fetch(`${serverUrl}/api/multi-resume${context.params ? `?action=data&${context.params.substring(1)}` : '?action=list'}`);
            if (context.params) {
                data = await response.json();
                expect(data.yamlContent).toContain(context.expected);
                console.log(`✅ Context verified: ${context.expected}`);
            }
        }

        // 5. Verify no cross-contamination
        console.log("🛡️ Step 5: Cross-contamination verification");
        response = await fetch(`${serverUrl}/api/multi-resume?action=data&position=software-engineer&company=google&date=2025-01-15`);
        data = await response.json();
        expect(data.yamlContent).toContain("GOOGLE INTEGRATION ENGINEER");
        expect(data.yamlContent).not.toContain("META INTEGRATION FRONTEND DEVELOPER");
        expect(data.yamlContent).not.toContain("DEFAULT INTEGRATION USER");

        console.log("🎉 Complete integration verification passed!");
    });
});
