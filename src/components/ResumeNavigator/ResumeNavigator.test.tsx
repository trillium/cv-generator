import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { ModalProvider } from "../../contexts/ModalContext";
import ResumeNavigator from "./ResumeNavigator";

// Mock the utility functions
vi.mock("../../../lib/utility", () => ({
  listAllResumeFiles: vi.fn(),
  deleteResumeWithBackup: vi.fn(),
  duplicateResume: vi.fn(),
}));

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock URL encoding utility
vi.mock("../../utils/urlSafeEncoding", () => ({
  encodeFilePathForUrl: vi.fn(),
}));

// Mock useModal hook
vi.mock("../../contexts/ModalContext", () => ({
  ModalProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useModal: vi.fn(),
}));

import {
  listAllResumeFiles,
  deleteResumeWithBackup,
  duplicateResume,
} from "../../../lib/utility";
import { useRouter } from "next/navigation";
import { encodeFilePathForUrl } from "../../utils/urlSafeEncoding";
import { useModal } from "../../contexts/ModalContext";

describe("ResumeNavigator", () => {
  const mockRouter = {
    push: vi.fn(),
  };

  const mockModal = {
    closeModal: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    vi.mocked(useModal).mockReturnValue(mockModal);
    vi.mocked(encodeFilePathForUrl).mockImplementation((path: string) => path);
  });

  const renderWithModalProvider = (component: React.ReactElement) => {
    return render(<ModalProvider>{component}</ModalProvider>);
  };

  it("should render loading state initially", () => {
    vi.mocked(listAllResumeFiles).mockResolvedValue({
      success: false,
      error: "Loading...",
    });

    renderWithModalProvider(<ResumeNavigator />);

    expect(screen.getByText("Loading files...")).toBeInTheDocument();
  });

  it("should load and display resume files", async () => {
    const mockFiles = [
      "resume1.yml",
      "resume2.yml",
      "data.yml.template",
      "resume.backup.123.yml",
    ];
    vi.mocked(listAllResumeFiles).mockResolvedValue({
      success: true,
      data: {
        allFiles: mockFiles,
      },
    });

    renderWithModalProvider(<ResumeNavigator />);

    await waitFor(() => {
      expect(screen.getByText("resume1")).toBeInTheDocument();
      expect(screen.getByText("resume2")).toBeInTheDocument();
    });

    // Should filter out template and backup files
    expect(screen.queryByText("data")).not.toBeInTheDocument();
    expect(screen.queryByText("resume")).not.toBeInTheDocument(); // backup file
  });

  it("should handle file selection and navigation", async () => {
    const mockFiles = ["resume1.yml"];
    vi.mocked(listAllResumeFiles).mockResolvedValue({
      success: true,
      data: {
        allFiles: mockFiles,
      },
    });

    renderWithModalProvider(<ResumeNavigator />);

    await waitFor(() => {
      expect(screen.getByText("resume1")).toBeInTheDocument();
    });

    const selectButton = screen.getByText("resume1");
    fireEvent.click(selectButton);

    expect(mockRouter.push).toHaveBeenCalledWith(
      "/single-column/resume/resume1.yml",
    );
    expect(mockModal.closeModal).toHaveBeenCalled();
  });

  it("should handle delete confirmation flow", async () => {
    const mockFiles = ["resume1.yml"];
    vi.mocked(listAllResumeFiles).mockResolvedValue({
      success: true,
      data: {
        allFiles: mockFiles,
      },
    });
    vi.mocked(deleteResumeWithBackup).mockResolvedValue({
      success: true,
    });

    renderWithModalProvider(<ResumeNavigator />);

    await waitFor(() => {
      expect(screen.getByText("resume1")).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByTitle("Delete file");
    fireEvent.click(deleteButton);

    // Should show confirmation modal
    const deleteModal = screen
      .getByText("Delete Resume File")
      .closest(".fixed");
    expect(deleteModal).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete/),
    ).toBeInTheDocument();

    // Click confirm delete
    const modalWithin = within(deleteModal as HTMLElement);
    const confirmButton = modalWithin.getByText("Delete");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(deleteResumeWithBackup).toHaveBeenCalledWith("resume1.yml");
      expect(listAllResumeFiles).toHaveBeenCalledTimes(2); // Initial load + refresh
    });
  });

  it("should handle duplicate flow", async () => {
    const mockFiles = ["resume1.yml"];
    vi.mocked(listAllResumeFiles).mockResolvedValue({
      success: true,
      data: {
        allFiles: mockFiles,
      },
    });
    vi.mocked(duplicateResume).mockResolvedValue({
      success: true,
    });

    renderWithModalProvider(<ResumeNavigator />);

    await waitFor(() => {
      expect(screen.getByText("resume1")).toBeInTheDocument();
    });

    // Click duplicate button
    const duplicateButton = screen.getByTitle("Duplicate file");
    fireEvent.click(duplicateButton);

    // Should show duplicate modal
    expect(screen.getByText("Duplicate Resume")).toBeInTheDocument();

    // Fill in new filename
    const input = screen.getByPlaceholderText(
      "Enter new filename (e.g., resume-copy.yml)",
    );
    fireEvent.change(input, { target: { value: "resume-copy.yml" } });

    // Click duplicate button
    const confirmDuplicateButton = screen.getByText("Duplicate");
    fireEvent.click(confirmDuplicateButton);

    await waitFor(() => {
      expect(duplicateResume).toHaveBeenCalledWith(
        "resume1.yml",
        "resume-copy.yml",
      );
      expect(listAllResumeFiles).toHaveBeenCalledTimes(2); // Initial load + refresh
    });
  });

  it("should handle errors gracefully", async () => {
    vi.mocked(listAllResumeFiles).mockResolvedValue({
      success: false,
      error: "Failed to load files",
    });

    renderWithModalProvider(<ResumeNavigator />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load files")).toBeInTheDocument();
    });
  });

  it("should refresh files when refresh button is clicked", async () => {
    const mockFiles = ["resume1.yml"];
    vi.mocked(listAllResumeFiles).mockResolvedValue({
      success: true,
      data: {
        allFiles: mockFiles,
      },
    });

    renderWithModalProvider(<ResumeNavigator />);

    await waitFor(() => {
      expect(screen.getByText("resume1")).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(listAllResumeFiles).toHaveBeenCalledTimes(2);
    });
  });

  it("should close modal when close button is clicked", async () => {
    const mockFiles = ["resume1.yml"];
    vi.mocked(listAllResumeFiles).mockResolvedValue({
      success: true,
      data: {
        allFiles: mockFiles,
      },
    });

    renderWithModalProvider(<ResumeNavigator />);

    await waitFor(() => {
      expect(screen.getByText("resume1")).toBeInTheDocument();
    });

    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);

    expect(mockModal.closeModal).toHaveBeenCalled();
  });
});
