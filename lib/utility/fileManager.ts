/**
 * Frontend utility functions for file management
 * Interacts with the backend API endpoints in /api/fs
 */

import { CVData } from "../../src/types";

export interface FileListResponse {
  allFiles: string[];
  mainDirFiles: number;
  resumeFiles: number;
  totalFiles: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * List all resume files - Get complete directory structure with main files and resumes subdirectory
 */
export async function listAllResumeFiles(): Promise<
  ApiResponse<FileListResponse>
> {
  try {
    const response = await fetch("/api/fs", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // Extract the file data from the API response
    const data: FileListResponse = {
      allFiles: result.allFiles,
      mainDirFiles: result.mainDirFiles,
      resumeFiles: result.resumeFiles,
      totalFiles: result.totalFiles,
    };

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to list resume files",
    };
  }
}

/**
 * Read resume data - Load YAML resume data for editing/viewing
 */
export async function readResumeData(
  filePaths: string[],
): Promise<ApiResponse<Record<string, CVData>>> {
  try {
    const response = await fetch("/api/fs/get-files", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: filePaths,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    return {
      success: true,
      data: result.files, // Extract the files object from the response
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to read resume data",
    };
  }
}

/**
 * Save resume changes - Write updated resume data back to file with diff tracking
 */
export async function saveResumeChanges(
  filePath: string,
  resumeData: CVData,
  options?: {
    createDiff?: boolean;
    baseDirectory?: string;
  },
): Promise<
  ApiResponse<{
    filePath: string;
    yamlContent: string;
    fileExisted: boolean;
    diffCreated: boolean;
  }>
> {
  try {
    const requestBody = {
      filePath,
      data: resumeData,
      createDiff: options?.createDiff ?? true,
      baseDirectory: options?.baseDirectory,
    };

    console.log("🔍 saveResumeChanges called with:", {
      filePath,
      resumeDataKeys: Object.keys(resumeData),
      options,
      requestBody,
    });

    const response = await fetch("/api/fs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(
      "📡 API response status:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API error response:", errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`,
      );
    }

    const data = await response.json();
    console.log("📥 API response data:", data);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("❌ saveResumeChanges error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save resume changes",
    };
  }
}

/**
 * Save YAML content directly - Write YAML content to file without JSON conversion
 * This preserves the exact YAML formatting that was generated
 */
export async function saveYamlContent(
  filePath: string,
  yamlContent: string,
  options?: {
    createDiff?: boolean;
    baseDirectory?: string;
  },
): Promise<
  ApiResponse<{
    filePath: string;
    yamlContent: string;
    fileExisted: boolean;
    diffCreated: boolean;
  }>
> {
  try {
    const requestBody = {
      filePath,
      yamlContent,
      createDiff: options?.createDiff ?? true,
      baseDirectory: options?.baseDirectory,
    };

    console.log("🔍 saveYamlContent called with:", {
      filePath,
      yamlContentLength: yamlContent.length,
      options,
      requestBody,
    });

    const response = await fetch("/api/fs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(
      "📡 API response status:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API error response:", errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`,
      );
    }

    const data = await response.json();
    console.log("📥 API response data:", data);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("❌ saveYamlContent error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save YAML content",
    };
  }
}

/**
 * Delete resume with backup - Remove resume file while creating backup for recovery
 */
export async function deleteResumeWithBackup(
  filePath: string,
  options?: {
    createBackup?: boolean;
    baseDirectory?: string;
  },
): Promise<
  ApiResponse<{
    filePath: string;
    backupCreated: boolean;
  }>
> {
  try {
    const queryParams = new URLSearchParams({
      filePath,
      createBackup: (options?.createBackup ?? true).toString(),
    });

    if (options?.baseDirectory) {
      queryParams.set("baseDirectory", options.baseDirectory);
    }

    const response = await fetch(`/api/fs/delete?${queryParams}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete resume",
    };
  }
}

/**
 * Duplicate resume - Copy existing resume to new file with confirmation for overwrites
 */
export async function duplicateResume(
  sourcePath: string,
  destinationPath: string,
  options?: {
    overwrite?: boolean;
    baseDirectory?: string;
  },
): Promise<
  ApiResponse<{
    sourcePath: string;
    destinationPath: string;
    overwritten: boolean;
  }>
> {
  try {
    const response = await fetch("/api/fs/copy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourcePath,
        destinationPath,
        overwrite: options?.overwrite ?? false,
        baseDirectory: options?.baseDirectory,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to duplicate resume",
    };
  }
}
