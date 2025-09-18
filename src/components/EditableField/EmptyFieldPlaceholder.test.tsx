// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import EmptyFieldPlaceholder from "./EmptyFieldPlaceholder";

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

vi.mock("./useArrayOperations", () => ({
  useArrayOperations: () => ({
    handleAddAbove: vi.fn(),
    handleAddBelow: vi.fn(),
    handleDelete: vi.fn(),
    handleMoveUp: vi.fn(),
    handleMoveDown: vi.fn(),
  }),
}));

vi.mock("./editableFieldUtils", () => ({
  shouldShowAddButtons: () => false,
  isFieldEmpty: () => true,
}));

describe("EmptyFieldPlaceholder", () => {
  describe("blank string replacement", () => {
    it("replaces blank string with placeholder for text field", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="text"
          isEmpty={true}
          yamlPath="test.path"
        >
          <span>{""}</span>
        </EmptyFieldPlaceholder>,
      );

      expect(
        screen.getByText("Click to edit test.path (not visible in print view)"),
      ).toBeInTheDocument();
    });

    it("replaces blank string with placeholder for textarea field", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="textarea"
          isEmpty={true}
          yamlPath="test.path"
        >
          <p>{""}</p>
        </EmptyFieldPlaceholder>,
      );

      expect(
        screen.getByText("Click to edit test.path (not visible in print view)"),
      ).toBeInTheDocument();
    });

    it("replaces blank string with placeholder for array field", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="array"
          isEmpty={true}
          yamlPath="test.path"
        >
          <div>{""}</div>
        </EmptyFieldPlaceholder>,
      );

      expect(
        screen.getByText("Click to edit test.path (not visible in print view)"),
      ).toBeInTheDocument();
    });
  });

  describe("empty array replacement", () => {
    it("replaces empty array with placeholder", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="text"
          isEmpty={true}
          yamlPath="test.path"
        >
          <div>{""}</div>
        </EmptyFieldPlaceholder>,
      );

      expect(
        screen.getByText("Click to edit test.path (not visible in print view)"),
      ).toBeInTheDocument();
    });
  });

  describe("null content replacement", () => {
    it("replaces null content with placeholder for link field", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="link"
          isEmpty={true}
          yamlPath="profile.links.0"
        >
          <span>{""}</span>
        </EmptyFieldPlaceholder>,
      );

      expect(screen.getByText("Click to add a link")).toBeInTheDocument();
    });
  });

  describe("valid content preservation", () => {
    it("preserves valid string content", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="text"
          isEmpty={false}
          yamlPath="test.path"
        >
          <span>{"Valid content"}</span>
        </EmptyFieldPlaceholder>,
      );

      expect(screen.getByText("Valid content")).toBeInTheDocument();
      expect(screen.queryByText(/Click to edit/)).not.toBeInTheDocument();
    });

    it("preserves valid array content", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="text"
          isEmpty={false}
          yamlPath="test.path"
        >
          {["Item 1", "Item 2"]}
        </EmptyFieldPlaceholder>,
      );

      expect(screen.getByText("Item 1Item 2")).toBeInTheDocument();
    });
  });

  describe("fieldType variations", () => {
    it("shows link placeholder for link fieldType", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="link"
          isEmpty={true}
          yamlPath="profile.links.0"
        >
          <span>{""}</span>
        </EmptyFieldPlaceholder>,
      );

      expect(screen.getByText("Click to add a link")).toBeInTheDocument();
    });

    it("shows array placeholder for array fieldType", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="array"
          isEmpty={true}
          yamlPath="test.array"
        >
          <div>{""}</div>
        </EmptyFieldPlaceholder>,
      );

      expect(
        screen.getByText(
          "Click to edit test.array (not visible in print view)",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("yamlPath placeholder messages", () => {
    it("shows category placeholder for technical.category", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="text"
          isEmpty={true}
          yamlPath="technical.category"
        >
          <span>{""}</span>
        </EmptyFieldPlaceholder>,
      );

      expect(screen.getByText("Click to add Category")).toBeInTheDocument();
    });

    it("shows skill placeholder for technical.bubbles", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="text"
          isEmpty={true}
          yamlPath="technical.bubbles.0"
        >
          <span>{""}</span>
        </EmptyFieldPlaceholder>,
      );

      expect(screen.getByText("Click to add Skill")).toBeInTheDocument();
    });

    it("shows skills placeholder for technical.bubbles array", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="array"
          isEmpty={true}
          yamlPath="technical.bubbles"
        >
          <div>{""}</div>
        </EmptyFieldPlaceholder>,
      );

      expect(
        screen.getByText("Click to add technical skills section"),
      ).toBeInTheDocument();
    });

    it("shows technical skills section placeholder", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="text"
          isEmpty={true}
          yamlPath="technical.skills"
        >
          <span>{""}</span>
        </EmptyFieldPlaceholder>,
      );

      expect(
        screen.getByText("Click to add technical skills section"),
      ).toBeInTheDocument();
    });
  });

  describe("React element children", () => {
    it("replaces blank content in span element", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="text"
          isEmpty={true}
          yamlPath="test.path"
        >
          <span>{""}</span>
        </EmptyFieldPlaceholder>,
      );

      expect(
        screen.getByText("Click to edit test.path (not visible in print view)"),
      ).toBeInTheDocument();
    });

    it("replaces blank content in p element", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="text"
          isEmpty={true}
          yamlPath="test.path"
        >
          <p>{""}</p>
        </EmptyFieldPlaceholder>,
      );

      expect(
        screen.getByText("Click to edit test.path (not visible in print view)"),
      ).toBeInTheDocument();
    });

    it("handles anchor elements with blank href", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="text"
          isEmpty={true}
          yamlPath="test.path"
        >
          <a href="">{""}</a>
        </EmptyFieldPlaceholder>,
      );

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "#");
      expect(
        screen.getByText("Click to edit test.path (not visible in print view)"),
      ).toBeInTheDocument();
    });
  });

  describe("array children processing", () => {
    it("processes array of children and replaces blank ones", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="text"
          isEmpty={true}
          yamlPath="test.path"
        >
          <div>
            <span>{"Valid"}</span>
            <span>{""}</span>
          </div>
        </EmptyFieldPlaceholder>,
      );

      expect(screen.getByText("Valid")).toBeInTheDocument();
      expect(
        screen.getByText("Click to edit test.path (not visible in print view)"),
      ).toBeInTheDocument();
    });
  });

  describe("link field special handling", () => {
    it("shows link placeholder for link fieldType", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="link"
          isEmpty={true}
          yamlPath="profile.links.0"
        >
          <span>{""}</span>
        </EmptyFieldPlaceholder>,
      );

      expect(screen.getByText("Click to add a link")).toBeInTheDocument();
    });

    it("handles ProfileLink structure with blank content", () => {
      render(
        <EmptyFieldPlaceholder
          fieldType="link"
          isEmpty={true}
          yamlPath="profile.links.0"
        >
          <>
            <a href="" className="print:block hidden">
              <span className="text-sm font-bold">{""}</span>
            </a>
            <div className="block print:hidden">
              <span className="text-sm font-bold">{""}</span>
            </div>
          </>
        </EmptyFieldPlaceholder>,
      );

      const placeholders = screen.getAllByText("Click to add a link");
      expect(placeholders).toHaveLength(2);
    });
  });
});
