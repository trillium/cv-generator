import fs from "fs";
import path from "path";
import { ResumeMetadata } from "./types/multiResume";

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
    const id = this.generateId(position, company);

    return {
      id,
      position,
      company,
      dateCreated: now,
      lastModified: now,
      basedOn: options.basedOn,
      status: "draft",
      description: options.description,
      tags: options.tags || [],
      applicationDeadline: options.applicationDeadline,
      jobUrl: options.jobUrl,
      notes: options.notes,
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
  static validateMetadata(metadata: any): metadata is ResumeMetadata {
    return (
      typeof metadata === "object" &&
      metadata !== null &&
      typeof metadata.id === "string" &&
      typeof metadata.position === "string" &&
      typeof metadata.dateCreated === "string" &&
      typeof metadata.lastModified === "string" &&
      (metadata.company === undefined ||
        typeof metadata.company === "string") &&
      ["draft", "active", "submitted", "archived"].includes(metadata.status)
    );
  }

  /**
   * Migrate metadata from old format (if needed)
   */
  static migrateMetadata(oldMetadata: any): ResumeMetadata {
    // If already in correct format, return as-is
    if (this.validateMetadata(oldMetadata)) {
      return oldMetadata;
    }

    // Create new metadata from old format
    const now = new Date().toISOString();

    return {
      id: oldMetadata.id || "migrated-" + Date.now(),
      position: oldMetadata.position || "unknown",
      company: oldMetadata.company,
      dateCreated: oldMetadata.dateCreated || now,
      lastModified: oldMetadata.lastModified || now,
      basedOn: oldMetadata.basedOn,
      status: oldMetadata.status || "draft",
      description: oldMetadata.description,
      tags: Array.isArray(oldMetadata.tags) ? oldMetadata.tags : [],
      applicationDeadline: oldMetadata.applicationDeadline,
      jobUrl: oldMetadata.jobUrl,
      notes: oldMetadata.notes,
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
  static getStatusDisplay(status: ResumeMetadata["status"]): string {
    const statusMap = {
      draft: "Draft",
      active: "Active",
      submitted: "Submitted",
      archived: "Archived",
    };
    return statusMap[status] || status;
  }

  /**
   * Get status color for UI
   */
  static getStatusColor(status: ResumeMetadata["status"]): string {
    const colorMap = {
      draft: "gray",
      active: "blue",
      submitted: "green",
      archived: "yellow",
    };
    return colorMap[status] || "gray";
  }
}
