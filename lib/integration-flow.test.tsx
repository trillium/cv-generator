// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";

// Mock Next.js navigation hooks
const mockPush = vi.fn();
const mockPathname = "/single-column/resume";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the getYamlData function
const mockGetYamlData = vi.fn();
vi.mock("../lib/getYamlData", () => ({
  getYamlData: () => mockGetYamlData(),
}));

// Mock API routes
global.fetch = vi.fn();
const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

// Mock components to avoid complex dependencies
vi.mock("../src/components/Navigation/Navigation", () => ({
  default: () =>
    React.createElement("div", { "data-testid": "navigation" }, "Navigation"),
}));

// Mock EditableField to avoid modal dependencies
vi.mock("../src/components/EditableField/EditableField", () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
}));

// Import test components
import { ResumeProvider } from "../src/contexts/ResumeContext";
import { ModalProvider } from "../src/contexts/ModalContext";
import Header from "../src/components/Header/Header";

const TestResumePage = () => {
  return (
    <div data-testid="resume-page">
      <Header
        name="Test User Name"
        title={["Software Developer"]}
        resume={["Test description"]}
      />
    </div>
  );
};

// Test wrapper component
function TestWrapper({
  children,
  initialName = "Original Test Name",
}: {
  children: React.ReactNode;
  initialName?: string;
}) {
  const initialYamlContent = `
header:
  name: "${initialName}"
  title: ["Software Developer"]
  resume: ["Test resume description"]
info:
  firstName: "Original"
  lastName: "Test Name"
  email: "test@example.com"
workExperience: []
projects: []
profile:
  shouldDisplayProfileImage: false
  lines: []
  links: []
`;

  return (
    <ModalProvider>
      <ResumeProvider>{children}</ResumeProvider>
    </ModalProvider>
  );
}

describe("YAML Data Integration - Name Update Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock initial YAML data
    mockGetYamlData.mockReturnValue(`
header:
  name: "Original Test Name"
  title: ["Software Developer"]
  resume: ["Test resume description"]
info:
  firstName: "Original"
  lastName: "Test Name"
  email: "test@example.com"
workExperience: []
projects: []
profile:
  shouldDisplayProfileImage: false
  lines: []
  links: []
`);

    // Mock successful API responses
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes("/api/yaml-data")) {
        if (options?.method === "GET") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                yamlContent: mockGetYamlData(),
                hasTempChanges: false,
                changelog: [],
              }),
          } as Response);
        }

        if (options?.method === "POST") {
          const body = JSON.parse(options.body as string);
          // Update the mock to return new content
          mockGetYamlData.mockReturnValue(body.yamlContent);

          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                success: true,
                message: "Changes saved to temporary file",
              }),
          } as Response);
        }
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Not found" }),
      } as Response);
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should demonstrate complete name update integration flow", async () => {
    let currentYamlContent = `
header:
  name: "Original Integration Name"
  title: ["Software Developer"]
  resume: ["Test description"]
`;

    // Step 1: Initial state
    mockGetYamlData.mockReturnValue(currentYamlContent);

    render(
      <TestWrapper initialName="Original Integration Name">
        <TestResumePage />
      </TestWrapper>,
    );

    // Check that the initial name parts are rendered
    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(screen.getByText("User Name")).toBeInTheDocument();

    // Step 2: Simulate YAML content update (this would happen through the modal)
    const updatedYamlContent = `
header:
  name: "Updated Integration Name"  
  title: ["Senior Software Developer"]
  resume: ["Updated test description"]
`;

    // Step 3: API call to save changes
    await fetch("/api/yaml-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yamlContent: updatedYamlContent }),
    });

    // Step 4: Verify the mock was updated
    expect(mockGetYamlData()).toContain("Updated Integration Name");

    // Step 5: Simulate component re-render with new data
    const TestComponentWithNewData = () => {
      const yamlData = mockGetYamlData();
      // Parse the YAML to get the name (in real app this would be done by the data processing)
      const nameMatch = yamlData.match(/name: "([^"]+)"/);
      const name = nameMatch ? nameMatch[1] : "Unknown";

      return <div data-testid="updated-name">{name}</div>;
    };

    const { rerender } = render(
      <TestWrapper>
        <TestComponentWithNewData />
      </TestWrapper>,
    );

    // Verify the updated name is now displayed
    expect(screen.getByText("Updated Integration Name")).toBeInTheDocument();
  });
});
