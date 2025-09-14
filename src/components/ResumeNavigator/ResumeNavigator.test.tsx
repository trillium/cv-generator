import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ResumeNavigator from "./ResumeNavigator";
import * as utilityFunctions from "../../../lib/utility";

// Mock the utility functions
vi.mock("../../../lib/utility", () => ({
  listAllResumeFiles: vi.fn(),
  deleteResumeWithBackup: vi.fn(),
  duplicateResume: vi.fn(),
}));

const mockUtility = utilityFunctions as any;

describe("ResumeNavigator", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelectResume: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when isOpen is false", () => {
    render(<ResumeNavigator {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Resume Navigator")).not.toBeInTheDocument();
  });

  it("should render and load files when opened", async () => {
    mockUtility.listAllResumeFiles.mockResolvedValue({
      success: true,
      data: {
        allFiles: ["resume1.yml", "resume2.yml", "resumes/frontend.yml"],
        totalFiles: 3,
      },
    });

    render(<ResumeNavigator {...defaultProps} />);

    expect(screen.getByText("Resume Navigator")).toBeInTheDocument();
    expect(screen.getByText("Loading files...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("resume1.yml")).toBeInTheDocument();
      expect(screen.getByText("resume2.yml")).toBeInTheDocument();
      expect(screen.getByText("resumes/frontend.yml")).toBeInTheDocument();
    });

    expect(mockUtility.listAllResumeFiles).toHaveBeenCalledTimes(1);
  });

  it("should handle file selection", async () => {
    mockUtility.listAllResumeFiles.mockResolvedValue({
      success: true,
      data: {
        allFiles: ["resume1.yml"],
        totalFiles: 1,
      },
    });

    const onSelectResume = vi.fn();
    const onClose = vi.fn();

    render(
      <ResumeNavigator
        {...defaultProps}
        onSelectResume={onSelectResume}
        onClose={onClose}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("resume1.yml")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("resume1.yml"));

    expect(onSelectResume).toHaveBeenCalledWith("resume1.yml");
    expect(onClose).toHaveBeenCalled();
  });

  it("should handle file deletion with confirmation", async () => {
    mockUtility.listAllResumeFiles.mockResolvedValue({
      success: true,
      data: {
        allFiles: ["resume1.yml"],
        totalFiles: 1,
      },
    });

    mockUtility.deleteResumeWithBackup.mockResolvedValue({
      success: true,
      data: { filePath: "resume1.yml", backupCreated: true },
    });

    render(<ResumeNavigator {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("resume1.yml")).toBeInTheDocument();
    });

    // First click - should show confirmation
    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);

    expect(screen.getByText("Confirm")).toBeInTheDocument();

    // Second click - should actually delete
    fireEvent.click(screen.getByText("Confirm"));

    await waitFor(() => {
      expect(mockUtility.deleteResumeWithBackup).toHaveBeenCalledWith(
        "resume1.yml",
      );
    });
  });

  it("should handle file duplication", async () => {
    mockUtility.listAllResumeFiles.mockResolvedValue({
      success: true,
      data: {
        allFiles: ["resume1.yml"],
        totalFiles: 1,
      },
    });

    mockUtility.duplicateResume.mockResolvedValue({
      success: true,
      data: {
        sourcePath: "resume1.yml",
        destinationPath: "resume1-copy.yml",
        overwritten: false,
      },
    });

    render(<ResumeNavigator {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("resume1.yml")).toBeInTheDocument();
    });

    // Click copy button
    fireEvent.click(screen.getByText("Copy"));

    // Should show duplicate modal
    expect(screen.getByText("Duplicate Resume")).toBeInTheDocument();
    expect(screen.getByText("Duplicating: resume1.yml")).toBeInTheDocument();

    // Enter new filename
    const input = screen.getByPlaceholderText(
      "Enter new filename (e.g., resume-copy.yml)",
    );
    fireEvent.change(input, { target: { value: "resume1-copy.yml" } });

    // Click duplicate button
    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));

    await waitFor(() => {
      expect(mockUtility.duplicateResume).toHaveBeenCalledWith(
        "resume1.yml",
        "resume1-copy.yml",
      );
    });
  });

  it("should handle errors gracefully", async () => {
    mockUtility.listAllResumeFiles.mockResolvedValue({
      success: false,
      error: "Network error",
    });

    render(<ResumeNavigator {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    // Should show dismiss button
    const dismissButton = screen.getByText("Dismiss");
    fireEvent.click(dismissButton);

    expect(screen.queryByText("Network error")).not.toBeInTheDocument();
  });

  it("should handle empty file list", async () => {
    mockUtility.listAllResumeFiles.mockResolvedValue({
      success: true,
      data: {
        allFiles: [],
        totalFiles: 0,
      },
    });

    render(<ResumeNavigator {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("No resume files found")).toBeInTheDocument();
    });
  });

  it("should handle close button", () => {
    mockUtility.listAllResumeFiles.mockResolvedValue({
      success: true,
      data: { allFiles: [], totalFiles: 0 },
    });

    const onClose = vi.fn();
    render(<ResumeNavigator {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText("×"));
    expect(onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("should handle refresh button", async () => {
    mockUtility.listAllResumeFiles.mockResolvedValue({
      success: true,
      data: { allFiles: ["resume1.yml"], totalFiles: 1 },
    });

    render(<ResumeNavigator {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("resume1.yml")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Refresh"));

    expect(mockUtility.listAllResumeFiles).toHaveBeenCalledTimes(2);
  });
});
