// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MultiResumeManager } from "./multiResumeManager";
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
  - company: "Previous Company"
    role: "Software Developer"
    duration: "2021-2023"
    responsibilities:
      - "Built REST APIs"
projects:
  - name: "Search Infrastructure"
    description: "Built distributed search system"
    technologies: ["Go", "Kubernetes", "BigQuery"]
  - name: "Analytics Pipeline"
    description: "Real-time data processing"
    technologies: ["Apache Beam", "Cloud Dataflow"]
skills:
  - "Go"
  - "Kubernetes"
  - "Distributed Systems"
`.trim();

        // Software Engineer - Microsoft
        const microsoftDir = path.join(resumesDir, "software-engineer", "microsoft", "2025-01-20");
        fs.mkdirSync(microsoftDir, { recursive: true });

        const microsoftContent = `
name: "MICROSOFT ENGINEER"
title: ["Principal Software Engineer", "Cloud Platform Engineer"]
email: "microsoft.engineer@outlook.com"
workExperience:
  - company: "Microsoft"
    role: "Principal Software Engineer"
    duration: "2022-2025"
    responsibilities:
      - "Architected Azure services"
      - "Led cross-functional initiatives"
      - "Mentored 10+ junior engineers"
  - company: "Amazon"
    role: "Senior SDE"
    duration: "2019-2022"
    responsibilities:
      - "Built AWS Lambda functions"
projects:
  - name: "Azure Compute Platform"
    description: "Managed containerized workloads"
    technologies: ["C#", "Azure", "Docker"]
  - name: "Identity Services"
    description: "OAuth and authentication system"
    technologies: [".NET Core", "Azure AD"]
skills:
  - "C#"
  - "Azure"
  - "Microservices"
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
      - "Implemented A/B testing framework"
  - company: "Netflix"
    role: "Frontend Developer"
    duration: "2022-2024"
    responsibilities:
      - "Developed streaming UI"
projects:
  - name: "Facebook News Feed"
    description: "Redesigned news feed interface"
    technologies: ["React", "GraphQL", "TypeScript"]
  - name: "Messenger Web App"
    description: "Real-time chat application"
    technologies: ["React", "WebSockets", "Redux"]
skills:
  - "React"
  - "TypeScript"
  - "GraphQL"
`.trim();

        // Data Scientist - Netflix
        const netflixDir = path.join(resumesDir, "data-scientist", "netflix", "2025-03-01");
        fs.mkdirSync(netflixDir, { recursive: true });

        const netflixContent = `
name: "NETFLIX DATA SCIENTIST"
title: ["Senior Data Scientist", "Machine Learning Engineer"]
email: "data.scientist@netflix.com"
workExperience:
  - company: "Netflix"
    role: "Senior Data Scientist"
    duration: "2023-2025"
    responsibilities:
      - "Built recommendation algorithms"
      - "Analyzed user behavior patterns"
      - "Improved model accuracy by 25%"
  - company: "Spotify"
    role: "Data Scientist"
    duration: "2021-2023"
    responsibilities:
      - "Music recommendation systems"
projects:
  - name: "Content Recommendation Engine"
    description: "Personalized movie recommendations"
    technologies: ["Python", "TensorFlow", "Spark"]
  - name: "A/B Testing Platform"
    description: "Statistical experiment framework"
    technologies: ["Python", "SQL", "Apache Airflow"]
skills:
  - "Python"
  - "Machine Learning"
  - "TensorFlow"
`.trim();

        // Write all resume files
        fs.writeFileSync(path.join(googleDir, "data.yml"), googleContent, "utf8");
        fs.writeFileSync(path.join(microsoftDir, "data.yml"), microsoftContent, "utf8");
        fs.writeFileSync(path.join(metaDir, "data.yml"), metaContent, "utf8");
        fs.writeFileSync(path.join(netflixDir, "data.yml"), netflixContent, "utf8");

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
                dir: microsoftDir,
                metadata: {
                    id: "software-engineer-microsoft-2025-01-20",
                    position: "software-engineer",
                    company: "microsoft",
                    dateCreated: "2025-01-20T00:00:00.000Z",
                    lastModified: "2025-01-20T00:00:00.000Z",
                    status: "submitted",
                    description: "Microsoft Principal Engineer"
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
            },
            {
                dir: netflixDir,
                metadata: {
                    id: "data-scientist-netflix-2025-03-01",
                    position: "data-scientist",
                    company: "netflix",
                    dateCreated: "2025-03-01T00:00:00.000Z",
                    lastModified: "2025-03-01T00:00:00.000Z",
                    status: "active",
                    description: "Netflix Data Scientist"
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

        console.log("✅ Test environment created with 4 distinct resume types");

        // Initialize the system
        const manager = new MultiResumeManager();
        const scanResult = manager.scanAndUpdateIndex();

        console.log("📊 Scan result:", scanResult);

        // Test scenarios for navigation switching
        const testScenarios = [
            {
                name: "Default Resume",
                context: null,
                expectedKeywords: ["DEFAULT USER", "Default Company", "Default Role", "Default Project"],
                description: "Testing default resume when no context provided"
            },
            {
                name: "Google Software Engineer",
                context: { position: "software-engineer", company: "google", date: "2025-01-15" },
                expectedKeywords: ["GOOGLE ENGINEER", "Google", "Senior Software Engineer", "Search Infrastructure", "Go", "Kubernetes"],
                description: "Testing Google backend engineer resume"
            },
            {
                name: "Microsoft Software Engineer",
                context: { position: "software-engineer", company: "microsoft", date: "2025-01-20" },
                expectedKeywords: ["MICROSOFT ENGINEER", "Microsoft", "Principal Software Engineer", "Azure Compute Platform", "C#", "Azure"],
                description: "Testing Microsoft cloud engineer resume"
            },
            {
                name: "Meta Frontend Developer",
                context: { position: "frontend-developer", company: "meta", date: "2025-02-01" },
                expectedKeywords: ["META FRONTEND DEVELOPER", "Meta", "Senior Frontend Engineer", "Facebook News Feed", "React", "GraphQL"],
                description: "Testing Meta frontend developer resume"
            },
            {
                name: "Netflix Data Scientist",
                context: { position: "data-scientist", company: "netflix", date: "2025-03-01" },
                expectedKeywords: ["NETFLIX DATA SCIENTIST", "Netflix", "Senior Data Scientist", "Content Recommendation Engine", "Python", "TensorFlow"],
                description: "Testing Netflix data scientist resume"
            }
        ];

        let allTestsPassed = true;
        const results = [];

        console.log("\n🎯 Testing Resume Navigation Switching");

        for (const scenario of testScenarios) {
            console.log(`\n📋 Testing: ${scenario.name}`);
            console.log(`📝 Description: ${scenario.description}`);

            try {
                // Get resume content for this context
                const content = manager.getYamlData(scenario.context);

                // Test that expected keywords are present
                const keywordResults = scenario.expectedKeywords.map(keyword => {
                    const found = content.includes(keyword);
                    console.log(`  ${found ? '✅' : '❌'} Contains "${keyword}": ${found}`);
                    return found;
                });

                const scenarioPassed = keywordResults.every(result => result);

                // Test that content from OTHER resumes is NOT present
                const otherScenarios = testScenarios.filter(s => s.name !== scenario.name);
                const contaminationResults = [];

                for (const otherScenario of otherScenarios) {
                    // Check a few key identifiers from other resumes
                    const identifiers = otherScenario.expectedKeywords.slice(0, 2); // First 2 keywords
                    const contaminationFound = identifiers.some(keyword => content.includes(keyword));

                    if (contaminationFound) {
                        console.log(`  ❌ Contamination detected: Found content from "${otherScenario.name}"`);
                        contaminationResults.push(false);
                    } else {
                        console.log(`  ✅ Clean: No contamination from "${otherScenario.name}"`);
                        contaminationResults.push(true);
                    }
                }

                const noContamination = contaminationResults.every(result => result);
                const finalResult = scenarioPassed && noContamination;

                console.log(`  🏁 Result: ${finalResult ? 'PASS' : 'FAIL'}`);

                results.push({
                    scenario: scenario.name,
                    passed: finalResult,
                    keywordsFound: keywordResults.filter(r => r).length,
                    totalKeywords: scenario.expectedKeywords.length,
                    hasContamination: !noContamination
                });

                if (!finalResult) {
                    allTestsPassed = false;
                    console.log(`  📄 Content preview (first 200 chars): ${content.substring(0, 200)}...`);
                }

            } catch (error) {
                console.error(`  ❌ Error testing ${scenario.name}:`, error);
                allTestsPassed = false;
                results.push({
                    scenario: scenario.name,
                    passed: false,
                    error: error.message
                });
            }
        }

        // Test cross-navigation to ensure proper switching
        console.log("\n🔄 Testing Cross-Navigation Switching");

        // Simulate switching between resumes like a user would
        const navigationSequence = [
            { position: "software-engineer", company: "google", date: "2025-01-15" },
            { position: "frontend-developer", company: "meta", date: "2025-02-01" },
            { position: "data-scientist", company: "netflix", date: "2025-03-01" },
            { position: "software-engineer", company: "microsoft", date: "2025-01-20" }
        ];

        for (let i = 0; i < navigationSequence.length; i++) {
            const context = navigationSequence[i];
            const content = manager.getYamlData(context);

            console.log(`\n  Step ${i + 1}: Navigated to ${context.position} @ ${context.company}`);

            // Verify content matches the expected resume
            const expectedScenario = testScenarios.find(s =>
                s.context &&
                s.context.position === context.position &&
                s.context.company === context.company
            );

            if (expectedScenario) {
                const keywordFound = expectedScenario.expectedKeywords[0]; // Check primary identifier
                const correctContent = content.includes(keywordFound);
                console.log(`    ${correctContent ? '✅' : '❌'} Correct content loaded: ${keywordFound}`);

                if (!correctContent) {
                    allTestsPassed = false;
                }
            }
        }

        // Final results summary
        console.log("\n🏁 Resume Navigation Switching Test Results:");
        console.log("=" * 50);

        results.forEach(result => {
            const status = result.passed ? "PASS" : "FAIL";
            console.log(`${result.passed ? '✅' : '❌'} ${result.scenario}: ${status}`);

            if (result.keywordsFound !== undefined) {
                console.log(`    Keywords found: ${result.keywordsFound}/${result.totalKeywords}`);
            }

            if (result.hasContamination) {
                console.log(`    ⚠️  Contamination detected`);
            }

            if (result.error) {
                console.log(`    Error: ${result.error}`);
            }
        });

        const passedTests = results.filter(r => r.passed).length;
        const totalTests = results.length;

        console.log(`\n📊 Summary: ${passedTests}/${totalTests} tests passed`);
        console.log(`🎉 Overall Result: ${allTestsPassed ? "ALL TESTS PASSED" : "SOME TESTS FAILED"}`);

        if (allTestsPassed) {
            console.log("✅ The system correctly switches resume content based on navigation context");
            console.log("✅ No cross-contamination between different resume types");
            console.log("✅ Default resume is properly served when no context provided");
        }

        return allTestsPassed;

    } catch (error) {
        console.error("❌ Navigation switching test failed:", error);
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
testResumeNavigationSwitching().then(success => {
    console.log(`\nTest completed with ${success ? 'SUCCESS' : 'FAILURE'}`);
    process.exit(success ? 0 : 1);
});
