import fs from "fs";
import path from "path";
import type { ResumeMetadata } from "../src/types";

export class ResumeMetadataManager {
  /**
   * Generate a unique resume ID
   */
  static generateId(position: string, company?: string, date?: string): string {
    const dateStr = date || new Date().toISOString().split("T")[0];
    const parts = [position];

    if (company) {
      parts.push(company.toLowerCase().replace(/\s+/g, "-"));
    }

    parts.push(dateStr);

    return parts.join("-");
  }

  /**
   * Create new resume metadata
   */
  static createMetadata(
    position: string,
    company?: string,
    options: {
      basedOn?: string;
      description?: string;
      tags?: string[];
      applicationDeadline?: string;
      jobUrl?: string;
      notes?: string;
    } = {},
  ): ResumeMetadata {
    const now = new Date().toISOString();

    return {
      targetPosition: position,
      targetCompany: company,
      targetJobUrl: options.jobUrl,
      applicationDate: now,
      lastModified: now,
      applicationStatus: "draft",
      notes: options.notes,
      tailoredFor: options.tags,
    };
  }

  /**
   * Save metadata to file
   */
  static saveMetadata(metadataPath: string, metadata: ResumeMetadata): void {
    // Update last modified time
    metadata.lastModified = new Date().toISOString();

    // Ensure directory exists
    const dir = path.dirname(metadataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf8");
  }

  /**
   * Load metadata from file
   */
  static loadMetadata(metadataPath: string): ResumeMetadata | null {
    if (!fs.existsSync(metadataPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(metadataPath, "utf8");
      return JSON.parse(content) as ResumeMetadata;
    } catch (error) {
      console.warn(`Could not load metadata from ${metadataPath}:`, error);
      return null;
    }
  }

  /**
   * Update existing metadata
   */
  static updateMetadata(
    metadataPath: string,
    updates: Partial<ResumeMetadata>,
  ): ResumeMetadata | null {
    const existing = this.loadMetadata(metadataPath);
    if (!existing) {
      return null;
    }

    const updated = {
      ...existing,
      ...updates,
      lastModified: new Date().toISOString(),
    };

    this.saveMetadata(metadataPath, updated);
    return updated;
  }

  /**
   * Get metadata file path for a resume version
   */
  static getMetadataPath(resumeDir: string): string {
    return path.join(resumeDir, "metadata.json");
  }

  /**
   * Validate metadata structure
   */
  static validateMetadata(metadata: unknown): metadata is ResumeMetadata {
    const m = metadata as Record<string, unknown>;
    return (
      typeof metadata === "object" &&
      metadata !== null &&
      (m.targetPosition === undefined ||
        typeof m.targetPosition === "string") &&
      (m.targetCompany === undefined || typeof m.targetCompany === "string") &&
      (m.applicationDate === undefined ||
        typeof m.applicationDate === "string") &&
      (m.lastModified === undefined || typeof m.lastModified === "string") &&
      (m.applicationStatus === undefined ||
        [
          "draft",
          "applied",
          "interview",
          "offer",
          "rejected",
          "withdrawn",
        ].includes(m.applicationStatus as string))
    );
  }

  /**
   * Migrate metadata from old format (if needed)
   */
  static migrateMetadata(oldMetadata: unknown): ResumeMetadata {
    // If already in correct format, return as-is
    if (this.validateMetadata(oldMetadata)) {
      return oldMetadata;
    }

    // Create new metadata from old format
    const now = new Date().toISOString();
    const m = oldMetadata as Record<string, unknown>;

    return {
      targetPosition: (m.position || m.targetPosition || "unknown") as string,
      targetCompany: (m.company || m.targetCompany) as string | undefined,
      applicationDate: (m.dateCreated || m.applicationDate || now) as string,
      lastModified: (m.lastModified || now) as string,
      applicationStatus: (m.status ||
        m.applicationStatus ||
        "draft") as ResumeMetadata["applicationStatus"],
      notes: m.notes as string | undefined,
      tailoredFor: Array.isArray(m.tags) ? (m.tags as string[]) : undefined,
    };
  }

  /**
   * Create metadata for default resume (backward compatibility)
   */
  static createDefaultMetadata(position: string = "default"): ResumeMetadata {
    return this.createMetadata(position, undefined, {
      description: "Default resume version",
      basedOn: "data.yml",
    });
  }

  /**
   * Get human-readable status
   */
  static getStatusDisplay(
    status?: ResumeMetadata["applicationStatus"],
  ): string {
    if (!status) return "Unknown";
    const statusMap = {
      draft: "Draft",
      applied: "Applied",
      interview: "Interview",
      offer: "Offer",
      rejected: "Rejected",
      withdrawn: "Withdrawn",
    };
    return statusMap[status] || status;
  }

  /**
   * Get status color for UI
   */
  static getStatusColor(status?: ResumeMetadata["applicationStatus"]): string {
    if (!status) return "gray";
    const colorMap = {
      draft: "gray",
      applied: "blue",
      interview: "yellow",
      offer: "green",
      rejected: "red",
      withdrawn: "purple",
    };
    return colorMap[status] || "gray";
  }
}
