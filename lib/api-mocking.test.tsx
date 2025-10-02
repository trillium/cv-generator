// @vitest-environment jsdom
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

  it("should mock API calls correctly", async () => {
    // Test that our mock fetch works
    const response = await fetch("/api/yaml-data", { method: "GET" });
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.yamlContent).toContain("Original Test Name");
  });
});
