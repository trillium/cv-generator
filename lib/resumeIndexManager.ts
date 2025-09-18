import fs from "fs";
import path from "path";
import {
  ResumeIndex,
  PositionGroup,
  CompanyVersion,
  ResumeMetadata,
} from "./types/multiResume";

export class ResumeIndexManager {
  private indexPath: string;

  constructor(private piiPath: string) {
    this.indexPath = path.join(piiPath, "resume-index.json");
  }

  /**
   * Initialize a new resume index if it doesn't exist
   */
  initializeIndex(): ResumeIndex {
    const defaultIndex: ResumeIndex = {
      lastUpdated: new Date().toISOString(),
      default: "data.yml",
      positions: {},
    };

    if (!fs.existsSync(this.indexPath)) {
      this.saveIndex(defaultIndex);
    }

    return defaultIndex;
  }

  /**
   * Read the resume index from disk
   */
  readIndex(): ResumeIndex {
    if (!fs.existsSync(this.indexPath)) {
      return this.initializeIndex();
    }

    try {
      const content = fs.readFileSync(this.indexPath, "utf8");
      return JSON.parse(content) as ResumeIndex;
    } catch (error) {
      console.warn("Could not read resume index, initializing new one:", error);
      return this.initializeIndex();
    }
  }

  /**
   * Save the resume index to disk
   */
  saveIndex(index: ResumeIndex): void {
    index.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2), "utf8");
  }

  /**
   * Add a new resume version to the index
   */
  addResumeVersion(metadata: ResumeMetadata, resumePath: string): void {
    const index = this.readIndex();
    const { position, company } = metadata;

    // Initialize position group if it doesn't exist
    if (!index.positions[position]) {
      index.positions[position] = {
        default: `resumes/${position}/default/data.yml`,
        companies: {},
      };
    }

    // Add company version if company is specified
    if (company) {
      if (!index.positions[position].companies[company]) {
        index.positions[position].companies[company] = [];
      }

      const companyVersion: CompanyVersion = {
        date: metadata.dateCreated.split("T")[0], // Extract date part
        path: resumePath,
        lastModified: metadata.lastModified,
        status: metadata.status,
      };

      // Remove existing version for the same date if it exists
      index.positions[position].companies[company] = index.positions[
        position
      ].companies[company].filter((v) => v.date !== companyVersion.date);

      // Add the new version
      index.positions[position].companies[company].push(companyVersion);

      // Sort by date descending (newest first)
      index.positions[position].companies[company].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    }

    this.saveIndex(index);
  }

  /**
   * Update an existing resume version in the index
   */
  updateResumeVersion(metadata: ResumeMetadata, resumePath: string): void {
    const index = this.readIndex();
    const { position, company } = metadata;

    if (!index.positions[position] || !company) {
      return;
    }

    const companyVersions = index.positions[position].companies[company];
    if (!companyVersions) {
      return;
    }

    const dateKey = metadata.dateCreated.split("T")[0];
    const versionIndex = companyVersions.findIndex((v) => v.date === dateKey);

    if (versionIndex >= 0) {
      companyVersions[versionIndex] = {
        date: dateKey,
        path: resumePath,
        lastModified: metadata.lastModified,
        status: metadata.status,
      };

      this.saveIndex(index);
    }
  }

  /**
   * Remove a resume version from the index
   */
  removeResumeVersion(position: string, company?: string, date?: string): void {
    const index = this.readIndex();

    if (!index.positions[position]) {
      return;
    }

    if (!company) {
      // Remove entire position
      delete index.positions[position];
    } else if (!date) {
      // Remove entire company
      delete index.positions[position].companies[company];
    } else {
      // Remove specific version
      const companyVersions = index.positions[position].companies[company];
      if (companyVersions) {
        index.positions[position].companies[company] = companyVersions.filter(
          (v) => v.date !== date,
        );

        // Clean up empty company entries
        if (index.positions[position].companies[company].length === 0) {
          delete index.positions[position].companies[company];
        }
      }
    }

    // Clean up empty position entries
    const positionGroup = index.positions[position];
    if (positionGroup && Object.keys(positionGroup.companies).length === 0) {
      // Only delete if there's no default version either
      const defaultPath = path.join(this.piiPath, positionGroup.default);
      if (!fs.existsSync(defaultPath)) {
        delete index.positions[position];
      }
    }

    this.saveIndex(index);
  }

  /**
   * List all positions
   */
  listPositions(): string[] {
    const index = this.readIndex();
    return Object.keys(index.positions).sort();
  }

  /**
   * List all companies for a given position
   */
  listCompanies(position: string): string[] {
    const index = this.readIndex();
    const positionGroup = index.positions[position];

    if (!positionGroup) {
      return [];
    }

    return Object.keys(positionGroup.companies).sort();
  }

  /**
   * List all versions for a position and company
   */
  listVersions(position: string, company: string): CompanyVersion[] {
    const index = this.readIndex();
    const positionGroup = index.positions[position];

    if (!positionGroup || !positionGroup.companies[company]) {
      return [];
    }

    return positionGroup.companies[company];
  }

  /**
   * Get recently modified resume versions
   */
  getRecentlyModified(
    limit: number = 10,
  ): { position: string; company: string; version: CompanyVersion }[] {
    const index = this.readIndex();
    const allVersions: {
      position: string;
      company: string;
      version: CompanyVersion;
    }[] = [];

    // Collect all versions
    for (const [position, positionGroup] of Object.entries(index.positions)) {
      for (const [company, versions] of Object.entries(
        positionGroup.companies,
      )) {
        for (const version of versions) {
          allVersions.push({ position, company, version });
        }
      }
    }

    // Sort by last modified date and return top results
    return allVersions
      .sort(
        (a, b) =>
          new Date(b.version.lastModified).getTime() -
          new Date(a.version.lastModified).getTime(),
      )
      .slice(0, limit);
  }

  /**
   * Get the full path for a resume version
   */
  getResumePath(
    position: string,
    company?: string,
    date?: string,
  ): string | null {
    const index = this.readIndex();
    const positionGroup = index.positions[position];

    if (!positionGroup) {
      return null;
    }

    // If no company specified, return default
    if (!company) {
      return path.join(this.piiPath, positionGroup.default);
    }

    const companyVersions = positionGroup.companies[company];
    if (!companyVersions || companyVersions.length === 0) {
      return null;
    }

    // If no date specified, return most recent
    if (!date) {
      return path.join(this.piiPath, companyVersions[0].path);
    }

    // Find specific date
    const version = companyVersions.find((v) => v.date === date);
    return version ? path.join(this.piiPath, version.path) : null;
  }

  /**
   * Check if a resume version exists
   */
  versionExists(position: string, company?: string, date?: string): boolean {
    const resumePath = this.getResumePath(position, company, date);
    return resumePath ? fs.existsSync(resumePath) : false;
  }

  /**
   * Get the index statistics
   */
  getStatistics(): {
    totalPositions: number;
    totalCompanies: number;
    totalVersions: number;
    lastUpdated: string;
  } {
    const index = this.readIndex();
    let totalCompanies = 0;
    let totalVersions = 0;

    for (const positionGroup of Object.values(index.positions)) {
      totalCompanies += Object.keys(positionGroup.companies).length;
      for (const versions of Object.values(positionGroup.companies)) {
        totalVersions += versions.length;
      }
    }

    return {
      totalPositions: Object.keys(index.positions).length,
      totalCompanies,
      totalVersions,
      lastUpdated: index.lastUpdated,
    };
  }
}
