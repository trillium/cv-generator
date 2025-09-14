// @vitest-environment jsdom
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  beforeAll,
} from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { ResumeProvider } from "../../contexts/ResumeContext";
import ResumeNavigator from "../ResumeNavigator/ResumeNavigator";
import { MultiResumeManager } from "../../../lib/multiResumeManager";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test component that displays YAML data
function TestResumeDisplay({ yamlContent }: { yamlContent: string }) {
  const lines = yamlContent.split("\n");
  const name =
    lines
      .find((line) => line.includes("name:"))
      ?.split(":")[1]
      ?.trim()
      .replace(/"/g, "") || "No name";
  const email =
    lines
      .find((line) => line.includes("email:"))
      ?.split(":")[1]
      ?.trim()
      .replace(/"/g, "") || "No email";
  const company =
    lines
      .find((line) => line.includes("company:"))
      ?.split(":")[1]
      ?.trim()
      .replace(/"/g, "") || "No company";

  return (
    <div data-testid="resume-display">
      <div data-testid="resume-name">{name}</div>
      <div data-testid="resume-email">{email}</div>
      <div data-testid="resume-company">{company}</div>
      <div data-testid="full-content" style={{ display: "none" }}>
        {yamlContent}
      </div>
    </div>
  );
}

// Test wrapper component
function TestAppWrapper({
  initialYamlContent,
}: {
  initialYamlContent: string;
}) {
  const [isNavigatorOpen, setIsNavigatorOpen] = React.useState(false);
  const [currentYamlContent, setCurrentYamlContent] =
    React.useState(initialYamlContent);

  const handleSelectResume = async (resume: any) => {
    // Simulate switching to a different resume
    const mockResponse = await fetch(
      `/api/multi-resume?action=data&position=${resume.position}&company=${resume.company}&date=${resume.date}`,
    );
    if (mockResponse.ok) {
      const data = await mockResponse.json();
      setCurrentYamlContent(data.yamlContent);
    }
  };

  return (
    <ResumeProvider>
      <div>
        <button
          data-testid="open-navigator"
          onClick={() => setIsNavigatorOpen(true)}
        >
          Choose Resume
        </button>

        <TestResumeDisplay yamlContent={currentYamlContent} />

        <ResumeNavigator
          isOpen={isNavigatorOpen}
          onClose={() => setIsNavigatorOpen(false)}
          onSelectResume={handleSelectResume}
        />
      </div>
    </ResumeProvider>
  );
}

describe("Resume Switching User Flow", () => {
  let testPiiPath: string;
  let originalPiiPath: string | undefined;
  let manager: MultiResumeManager;

  // Test data
  const defaultYamlContent = `
name: "DEFAULT USER"
title: ["Default Developer"]
email: "default@example.com"
workExperience:
  - company: "Default Company"
    role: "Default Role"
    duration: "2020-2025"
`.trim();

  const googleYamlContent = `
name: "GOOGLE ENGINEER"
title: ["Senior Backend Engineer"]
email: "google.engineer@gmail.com"
workExperience:
  - company: "Google"
    role: "Senior Software Engineer"
    duration: "2023-2025"
`.trim();

  const metaYamlContent = `
name: "META FRONTEND DEVELOPER"
title: ["Senior React Developer"]
email: "meta.frontend@meta.com"
workExperience:
  - company: "Meta"
    role: "Senior Frontend Engineer"
    duration: "2024-2025"
`.trim();

  beforeAll(() => {
    // Mock React import for our test component - no longer needed with proper import
  });

  beforeEach(() => {
    testPiiPath = path.join(__dirname, "..", "..", "..", "test-flow-pii");
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
    setupTestResumes();

    manager = new MultiResumeManager();
    manager.scanAndUpdateIndex();

    // Setup fetch mocks
    setupFetchMocks();
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

    vi.clearAllMocks();
  });

  function setupTestResumes() {
    // Create default data.yml
    fs.writeFileSync(
      path.join(testPiiPath, "data.yml"),
      defaultYamlContent,
      "utf8",
    );

    const resumesDir = path.join(testPiiPath, "resumes");

    // Google resume
    const googleDir = path.join(
      resumesDir,
      "software-engineer",
      "google",
      "2025-01-15",
    );
    fs.mkdirSync(googleDir, { recursive: true });
    fs.writeFileSync(
      path.join(googleDir, "data.yml"),
      googleYamlContent,
      "utf8",
    );
    fs.writeFileSync(
      path.join(googleDir, "metadata.json"),
      JSON.stringify(
        {
          id: "software-engineer-google-2025-01-15",
          position: "software-engineer",
          company: "google",
          dateCreated: "2025-01-15T00:00:00.000Z",
          lastModified: "2025-01-15T00:00:00.000Z",
          status: "active",
          description: "Google Backend Engineer",
        },
        null,
        2,
      ),
      "utf8",
    );

    // Meta resume
    const metaDir = path.join(
      resumesDir,
      "frontend-developer",
      "meta",
      "2025-02-01",
    );
    fs.mkdirSync(metaDir, { recursive: true });
    fs.writeFileSync(path.join(metaDir, "data.yml"), metaYamlContent, "utf8");
    fs.writeFileSync(
      path.join(metaDir, "metadata.json"),
      JSON.stringify(
        {
          id: "frontend-developer-meta-2025-02-01",
          position: "frontend-developer",
          company: "meta",
          dateCreated: "2025-02-01T00:00:00.000Z",
          lastModified: "2025-02-01T00:00:00.000Z",
          status: "draft",
          description: "Meta Frontend Developer",
        },
        null,
        2,
      ),
      "utf8",
    );
  }

  function setupFetchMocks() {
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      const urlObj = new URL(url, "http://localhost");
      const action = urlObj.searchParams.get("action");
      const position = urlObj.searchParams.get("position");
      const company = urlObj.searchParams.get("company");
      const date = urlObj.searchParams.get("date");

      // Mock the list action (for ResumeNavigator)
      if (action === "list") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              versions: [
                {
                  id: "software-engineer-google-2025-01-15",
                  position: "software-engineer",
                  company: "google",
                  date: "2025-01-15",
                  metadata: {
                    status: "active",
                    description: "Google Backend Engineer",
                    dateCreated: "2025-01-15T00:00:00.000Z",
                    lastModified: "2025-01-15T00:00:00.000Z",
                  },
                },
                {
                  id: "frontend-developer-meta-2025-02-01",
                  position: "frontend-developer",
                  company: "meta",
                  date: "2025-02-01",
                  metadata: {
                    status: "draft",
                    description: "Meta Frontend Developer",
                    dateCreated: "2025-02-01T00:00:00.000Z",
                    lastModified: "2025-02-01T00:00:00.000Z",
                  },
                },
              ],
            }),
        });
      }

      // Mock the data action (for switching resumes)
      if (action === "data") {
        let yamlContent = defaultYamlContent;

        if (position === "software-engineer" && company === "google") {
          yamlContent = googleYamlContent;
        } else if (position === "frontend-developer" && company === "meta") {
          yamlContent = metaYamlContent;
        }

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ yamlContent }),
        });
      }

      // Mock other API calls
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  }

  it("should show default resume on initial load", async () => {
    render(<TestAppWrapper initialYamlContent={defaultYamlContent} />);

    // Check that default resume content is displayed
    expect(screen.getByTestId("resume-name")).toHaveTextContent("DEFAULT USER");
    expect(screen.getByTestId("resume-email")).toHaveTextContent(
      "default@example.com",
    );
    expect(screen.getByTestId("resume-company")).toHaveTextContent(
      "Default Company",
    );
  });

  it("should allow user to open resume navigator", async () => {
    render(<TestAppWrapper initialYamlContent={defaultYamlContent} />);

    // Click the button to open navigator
    fireEvent.click(screen.getByTestId("open-navigator"));

    // Wait for the navigator to appear
    await waitFor(() => {
      expect(screen.getByText("All Resumes")).toBeInTheDocument();
    });

    // Check that resumes are listed
    await waitFor(() => {
      expect(screen.getByText("Software Engineer")).toBeInTheDocument();
      expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
      expect(screen.getByText("@ google")).toBeInTheDocument();
      expect(screen.getByText("@ meta")).toBeInTheDocument();
    });
  });

  it("should switch to Google resume when user selects it", async () => {
    render(<TestAppWrapper initialYamlContent={defaultYamlContent} />);

    // Verify we start with default resume
    expect(screen.getByTestId("resume-name")).toHaveTextContent("DEFAULT USER");

    // Open navigator
    fireEvent.click(screen.getByTestId("open-navigator"));

    // Wait for resumes to load
    await waitFor(() => {
      expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    });

    // Click on Google software engineer resume
    const googleResume =
      screen.getByText("Software Engineer").closest("[data-testid]") ||
      screen.getByText("@ google").closest('div[class*="cursor-pointer"]');

    fireEvent.click(googleResume!);

    // Wait for resume to switch
    await waitFor(
      () => {
        expect(screen.getByTestId("resume-name")).toHaveTextContent(
          "GOOGLE ENGINEER",
        );
      },
      { timeout: 3000 },
    );

    expect(screen.getByTestId("resume-email")).toHaveTextContent(
      "google.engineer@gmail.com",
    );
    expect(screen.getByTestId("resume-company")).toHaveTextContent("Google");

    // Verify the full content contains Google-specific information
    const fullContent = screen.getByTestId("full-content").textContent;
    expect(fullContent).toContain("GOOGLE ENGINEER");
    expect(fullContent).toContain("Senior Software Engineer");
    expect(fullContent).not.toContain("DEFAULT USER");
    expect(fullContent).not.toContain("META FRONTEND DEVELOPER");
  });

  it("should switch to Meta resume when user selects it", async () => {
    render(<TestAppWrapper initialYamlContent={defaultYamlContent} />);

    // Verify we start with default resume
    expect(screen.getByTestId("resume-name")).toHaveTextContent("DEFAULT USER");

    // Open navigator
    fireEvent.click(screen.getByTestId("open-navigator"));

    // Wait for resumes to load
    await waitFor(() => {
      expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
    });

    // Click on Meta frontend developer resume
    const metaResume =
      screen.getByText("Frontend Developer").closest("[data-testid]") ||
      screen.getByText("@ meta").closest('div[class*="cursor-pointer"]');

    fireEvent.click(metaResume!);

    // Wait for resume to switch
    await waitFor(
      () => {
        expect(screen.getByTestId("resume-name")).toHaveTextContent(
          "META FRONTEND DEVELOPER",
        );
      },
      { timeout: 3000 },
    );

    expect(screen.getByTestId("resume-email")).toHaveTextContent(
      "meta.frontend@meta.com",
    );
    expect(screen.getByTestId("resume-company")).toHaveTextContent("Meta");

    // Verify the full content contains Meta-specific information
    const fullContent = screen.getByTestId("full-content").textContent;
    expect(fullContent).toContain("META FRONTEND DEVELOPER");
    expect(fullContent).toContain("Senior Frontend Engineer");
    expect(fullContent).not.toContain("DEFAULT USER");
    expect(fullContent).not.toContain("GOOGLE ENGINEER");
  });

  it("should handle multiple resume switches correctly", async () => {
    render(<TestAppWrapper initialYamlContent={defaultYamlContent} />);

    // Start with default
    expect(screen.getByTestId("resume-name")).toHaveTextContent("DEFAULT USER");

    // Switch to Google
    fireEvent.click(screen.getByTestId("open-navigator"));
    await waitFor(() => {
      expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    });

    const googleResume = screen
      .getByText("@ google")
      .closest('div[class*="cursor-pointer"]');
    fireEvent.click(googleResume!);

    await waitFor(() => {
      expect(screen.getByTestId("resume-name")).toHaveTextContent(
        "GOOGLE ENGINEER",
      );
    });

    // Switch to Meta
    fireEvent.click(screen.getByTestId("open-navigator"));
    await waitFor(() => {
      expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
    });

    const metaResume = screen
      .getByText("@ meta")
      .closest('div[class*="cursor-pointer"]');
    fireEvent.click(metaResume!);

    await waitFor(() => {
      expect(screen.getByTestId("resume-name")).toHaveTextContent(
        "META FRONTEND DEVELOPER",
      );
    });

    // Switch back to Google
    fireEvent.click(screen.getByTestId("open-navigator"));
    await waitFor(() => {
      expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    });

    const googleResumeAgain = screen
      .getByText("@ google")
      .closest('div[class*="cursor-pointer"]');
    fireEvent.click(googleResumeAgain!);

    await waitFor(() => {
      expect(screen.getByTestId("resume-name")).toHaveTextContent(
        "GOOGLE ENGINEER",
      );
    });

    // Verify final state
    expect(screen.getByTestId("resume-email")).toHaveTextContent(
      "google.engineer@gmail.com",
    );
    expect(screen.getByTestId("resume-company")).toHaveTextContent("Google");
  });

  it("should verify data integrity - no cross-contamination between resumes", async () => {
    render(<TestAppWrapper initialYamlContent={defaultYamlContent} />);

    // Test Google resume isolation
    fireEvent.click(screen.getByTestId("open-navigator"));
    await waitFor(() => screen.getByText("@ google"));

    const googleResume = screen
      .getByText("@ google")
      .closest('div[class*="cursor-pointer"]');
    fireEvent.click(googleResume!);

    await waitFor(() => {
      expect(screen.getByTestId("resume-name")).toHaveTextContent(
        "GOOGLE ENGINEER",
      );
    });

    let fullContent = screen.getByTestId("full-content").textContent!;
    expect(fullContent).toContain("GOOGLE ENGINEER");
    expect(fullContent).toContain("google.engineer@gmail.com");
    expect(fullContent).not.toContain("DEFAULT USER");
    expect(fullContent).not.toContain("META FRONTEND DEVELOPER");
    expect(fullContent).not.toContain("meta.frontend@meta.com");

    // Test Meta resume isolation
    fireEvent.click(screen.getByTestId("open-navigator"));
    await waitFor(() => screen.getByText("@ meta"));

    const metaResume = screen
      .getByText("@ meta")
      .closest('div[class*="cursor-pointer"]');
    fireEvent.click(metaResume!);

    await waitFor(() => {
      expect(screen.getByTestId("resume-name")).toHaveTextContent(
        "META FRONTEND DEVELOPER",
      );
    });

    fullContent = screen.getByTestId("full-content").textContent!;
    expect(fullContent).toContain("META FRONTEND DEVELOPER");
    expect(fullContent).toContain("meta.frontend@meta.com");
    expect(fullContent).not.toContain("DEFAULT USER");
    expect(fullContent).not.toContain("GOOGLE ENGINEER");
    expect(fullContent).not.toContain("google.engineer@gmail.com");
  });
});
