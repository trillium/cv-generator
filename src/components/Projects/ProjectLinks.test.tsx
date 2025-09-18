// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import ProjectLinks from "./ProjectLinks";

// Mock the context hooks to avoid ResumeProvider requirement
vi.mock("../../contexts/ResumeContext", () => ({
  useYamlData: () => ({
    parsedData: {},
    error: null,
  }),
  useModal: () => ({
    openModal: vi.fn(),
    closeModal: vi.fn(),
  }),
  useResumeContext: () => ({
    parsedData: {},
    error: null,
  }),
}));

vi.mock("../../contexts/ModalContext", () => ({
  useModal: () => ({
    openModal: vi.fn(),
    closeModal: vi.fn(),
  }),
}));

vi.mock("../../hooks/useYamlPathUpdater", () => ({
  useYamlPathUpdater: () => ({
    updateYamlPath: vi.fn(),
  }),
}));

vi.mock("../EditableField/useArrayOperations", () => ({
  useArrayOperations: () => ({
    handleAddAbove: vi.fn(),
    handleAddBelow: vi.fn(),
    handleDelete: vi.fn(),
    handleMoveUp: vi.fn(),
    handleMoveDown: vi.fn(),
  }),
}));

vi.mock("../EditableField/editableFieldUtils", () => ({
  shouldShowAddButtons: () => false,
  isFieldEmpty: () => true,
}));

describe("ProjectLinks", () => {
  describe("empty links array", () => {
    it("renders placeholder when links is empty array", () => {
      render(<ProjectLinks links={[]} projectIndex={0} />);

      expect(
        screen.getByText(
          "Click to edit projects.0.links (not visible in print view)",
        ),
      ).toBeInTheDocument();
    });

    it("renders placeholder when links is undefined", () => {
      render(<ProjectLinks links={undefined} projectIndex={0} />);

      expect(
        screen.getByText(
          "Click to edit projects.0.links (not visible in print view)",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("non-empty links array", () => {
    it("renders links when links array has items", () => {
      const mockLinks = [
        { icon: "GitHub", link: "github.com/user" },
        { icon: "Website", link: "example.com" },
      ];

      render(<ProjectLinks links={mockLinks} projectIndex={0} />);

      // Should render the links, not the placeholder
      expect(
        screen.queryByText(
          "Click to edit projects.0.links (not visible in print view)",
        ),
      ).not.toBeInTheDocument();

      // Check that ProfileLink components are rendered (mock them if needed)
      // For now, just check that ul is rendered
      expect(screen.getByRole("list")).toBeInTheDocument();
    });
  });
});
