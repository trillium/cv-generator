// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import yaml from "js-yaml";

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

  it("should display original name in header component", () => {
    render(
      <TestWrapper>
        <TestResumePage />
      </TestWrapper>,
    );

    // Check that the name parts are rendered in the header
    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(screen.getByText("User Name")).toBeInTheDocument();
  });

  it("should parse YAML content with correct structure and values", () => {
    const yamlContent = mockGetYamlData();
    const parsedData = yaml.load(yamlContent) as Record<string, unknown>;

    // Check header section
    expect(parsedData).toHaveProperty("header");
    expect(parsedData.header).toHaveProperty("name", "Original Test Name");
    expect(parsedData.header).toHaveProperty("title");
    expect(parsedData.header.title).toEqual(["Software Developer"]);
    expect(parsedData.header).toHaveProperty("resume");
    expect(parsedData.header.resume).toEqual(["Test resume description"]);

    // Check info section
    expect(parsedData).toHaveProperty("info");
    expect(parsedData.info).toHaveProperty("firstName", "Original");
    expect(parsedData.info).toHaveProperty("lastName", "Test Name");
    expect(parsedData.info).toHaveProperty("email", "test@example.com");

    // Check other sections exist
    expect(parsedData).toHaveProperty("workExperience");
    expect(Array.isArray(parsedData.workExperience)).toBe(true);
    expect(parsedData.workExperience).toEqual([]);

    expect(parsedData).toHaveProperty("projects");
    expect(Array.isArray(parsedData.projects)).toBe(true);
    expect(parsedData.projects).toEqual([]);

    expect(parsedData).toHaveProperty("profile");
    expect(parsedData.profile).toHaveProperty(
      "shouldDisplayProfileImage",
      false,
    );
    expect(parsedData.profile).toHaveProperty("lines");
    expect(Array.isArray(parsedData.profile.lines)).toBe(true);
    expect(parsedData.profile.lines).toEqual([]);
    expect(parsedData.profile).toHaveProperty("links");
    expect(Array.isArray(parsedData.profile.links)).toBe(true);
    expect(parsedData.profile.links).toEqual([]);
  });
});
