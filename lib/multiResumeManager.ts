import fs from "fs";
import path from "path";
import * as yaml from "js-yaml";
import {
    ResumeContext,
    ResumeVersion,
    CreateResumeVersionOptions,
    ResumeListOptions,
    ResumeNavigationResult,
    ResumeMetadata
} from "./types/multiResume";
import { ResumeIndexManager } from "./resumeIndexManager";
import { ResumeMetadataManager } from "./resumeMetadataManager";
import { getPiiDirectory } from "./getPiiPath";

export class MultiResumeManager {
    private piiPath: string;
    private indexManager: ResumeIndexManager;
    private resumesDir: string;

    constructor() {
        this.piiPath = getPiiDirectory();
        this.indexManager = new ResumeIndexManager(this.piiPath);
        this.resumesDir = path.join(this.piiPath, "resumes");
        this.ensureDirectoryStructure();
    }

    /**
     * Ensure the basic directory structure exists
     */
    private ensureDirectoryStructure(): void {
        if (!fs.existsSync(this.resumesDir)) {
            fs.mkdirSync(this.resumesDir, { recursive: true });
        }
    }

    /**
     * Get YAML data for a specific resume context
     */
    getYamlData(context?: ResumeContext): string {
        try {
            if (!context) {
                // Return default data.yml if no context specified
                const defaultPath = path.join(this.piiPath, "data.yml");
                const tempPath = path.join(this.piiPath, "data.temp.yml");

                // Check for temp file first (matches existing behavior)
                if (fs.existsSync(tempPath)) {
                    return fs.readFileSync(tempPath, "utf8");
                }

                if (fs.existsSync(defaultPath)) {
                    return fs.readFileSync(defaultPath, "utf8");
                }

                throw new Error("No default data.yml file found");
            }

            // Get path for specific context
            const resumePath = this.indexManager.getResumePath(
                context.position!,
                context.company,
                context.date
            );

            if (!resumePath || !fs.existsSync(resumePath)) {
                throw new Error(`Resume not found for context: ${JSON.stringify(context)}`);
            }

            return fs.readFileSync(resumePath, "utf8");
        } catch (error) {
            console.error("Error reading YAML file:", error);
            return `# Error: Could not read resume data - ${error instanceof Error ? error.message : "Unknown error"}`;
        }
    }

    /**
     * Create a new resume version
     */
    async createResumeVersion(options: CreateResumeVersionOptions): Promise<ResumeVersion> {
        const { position, company, basedOn } = options;

        // Generate paths
        const dateStr = new Date().toISOString().split('T')[0];
        const versionDir = company
            ? path.join(this.resumesDir, position, company, dateStr)
            : path.join(this.resumesDir, position, "default");

        const dataPath = path.join(versionDir, "data.yml");
        const metadataPath = ResumeMetadataManager.getMetadataPath(versionDir);

        // Check if version already exists
        if (fs.existsSync(dataPath)) {
            throw new Error(`Resume version already exists: ${position}${company ? `/${company}` : ""}`);
        }

        // Create directory structure
        fs.mkdirSync(versionDir, { recursive: true });

        // Get base resume content
        let baseContent: string;
        if (basedOn) {
            // Parse basedOn to get context
            const basedOnParts = basedOn.split('-');
            const baseContext: ResumeContext = {
                position: basedOnParts[0],
                company: basedOnParts[1],
                date: basedOnParts[2]
            };
            baseContent = this.getYamlData(baseContext);
        } else {
            // Use default data.yml
            baseContent = this.getYamlData();
        }

        // Save resume data
        fs.writeFileSync(dataPath, baseContent, "utf8");

        // Create metadata
        const metadata = ResumeMetadataManager.createMetadata(position, company, {
            basedOn,
            description: options.description,
            tags: options.tags,
            applicationDeadline: options.applicationDeadline,
            jobUrl: options.jobUrl,
            notes: options.notes
        });

        ResumeMetadataManager.saveMetadata(metadataPath, metadata);

        // Update index
        const relativePath = path.relative(this.piiPath, dataPath);
        this.indexManager.addResumeVersion(metadata, relativePath);

        return {
            id: metadata.id,
            position: metadata.position,
            company: metadata.company,
            date: dateStr,
            path: dataPath,
            metadata
        };
    }

    /**
     * List resume versions with filtering and sorting
     */
    listResumeVersions(options: ResumeListOptions = {}): ResumeNavigationResult {
        const index = this.indexManager.readIndex();
        const versions: ResumeVersion[] = [];
        const positions = new Set<string>();
        const companies: Record<string, Set<string>> = {};

        // Collect all versions
        for (const [position, positionGroup] of Object.entries(index.positions)) {
            positions.add(position);

            // Skip if position filter doesn't match
            if (options.position && position !== options.position) {
                continue;
            }

            // Add default version if it exists
            const defaultPath = path.join(this.piiPath, positionGroup.default);
            if (fs.existsSync(defaultPath)) {
                const metadataPath = ResumeMetadataManager.getMetadataPath(path.dirname(defaultPath));
                let metadata = ResumeMetadataManager.loadMetadata(metadataPath);

                // Create metadata if it doesn't exist (for backward compatibility)
                if (!metadata) {
                    metadata = ResumeMetadataManager.createDefaultMetadata(position);
                    ResumeMetadataManager.saveMetadata(metadataPath, metadata);
                }

                // Apply status filter
                if (!options.status || metadata.status === options.status) {
                    versions.push({
                        id: `${position}-default`,
                        position,
                        date: metadata.dateCreated.split('T')[0],
                        path: defaultPath,
                        metadata
                    });
                }
            }

            // Add company-specific versions
            for (const [company, companyVersions] of Object.entries(positionGroup.companies)) {
                if (!companies[position]) {
                    companies[position] = new Set();
                }
                companies[position].add(company);

                // Skip if company filter doesn't match
                if (options.company && company !== options.company) {
                    continue;
                }

                for (const version of companyVersions) {
                    const fullPath = path.join(this.piiPath, version.path);
                    const metadataPath = ResumeMetadataManager.getMetadataPath(path.dirname(fullPath));
                    const metadata = ResumeMetadataManager.loadMetadata(metadataPath);

                    if (metadata && (!options.status || metadata.status === options.status)) {
                        versions.push({
                            id: metadata.id,
                            position,
                            company,
                            date: version.date,
                            path: fullPath,
                            metadata
                        });
                    }
                }
            }
        }

        // Sort versions
        const sortBy = options.sortBy || 'lastModified';
        const sortOrder = options.sortOrder || 'desc';

        versions.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortBy) {
                case 'dateCreated':
                    aValue = new Date(a.metadata.dateCreated);
                    bValue = new Date(b.metadata.dateCreated);
                    break;
                case 'lastModified':
                    aValue = new Date(a.metadata.lastModified);
                    bValue = new Date(b.metadata.lastModified);
                    break;
                case 'company':
                    aValue = a.company || '';
                    bValue = b.company || '';
                    break;
                case 'position':
                    aValue = a.position;
                    bValue = b.position;
                    break;
                default:
                    aValue = a.metadata.lastModified;
                    bValue = b.metadata.lastModified;
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        // Apply limit
        const limitedVersions = options.limit ? versions.slice(0, options.limit) : versions;

        // Convert companies sets to arrays
        const companiesArray: Record<string, string[]> = {};
        for (const [pos, compSet] of Object.entries(companies)) {
            companiesArray[pos] = Array.from(compSet).sort();
        }

        return {
            versions: limitedVersions,
            total: versions.length,
            positions: Array.from(positions).sort(),
            companies: companiesArray
        };
    }

    /**
     * Get a specific resume version
     */
    getResumeVersion(position: string, company?: string, date?: string): ResumeVersion | null {
        const resumePath = this.indexManager.getResumePath(position, company, date);
        if (!resumePath || !fs.existsSync(resumePath)) {
            return null;
        }

        const metadataPath = ResumeMetadataManager.getMetadataPath(path.dirname(resumePath));
        const metadata = ResumeMetadataManager.loadMetadata(metadataPath);

        if (!metadata) {
            return null;
        }

        return {
            id: metadata.id,
            position,
            company,
            date: date || new Date().toISOString().split('T')[0],
            path: resumePath,
            metadata
        };
    }

    /**
     * Update resume content
     */
    updateResumeContent(position: string, content: string, company?: string, date?: string): void {
        const resumePath = this.indexManager.getResumePath(position, company, date);
        if (!resumePath) {
            throw new Error(`Resume not found: ${position}${company ? `/${company}` : ""}`);
        }

        // Validate YAML before saving
        try {
            yaml.load(content);
        } catch (error) {
            throw new Error(`Invalid YAML: ${error instanceof Error ? error.message : "Unknown error"}`);
        }

        // Save content
        fs.writeFileSync(resumePath, content, "utf8");

        // Update metadata last modified time
        const metadataPath = ResumeMetadataManager.getMetadataPath(path.dirname(resumePath));
        const metadata = ResumeMetadataManager.loadMetadata(metadataPath);
        if (metadata) {
            ResumeMetadataManager.saveMetadata(metadataPath, metadata);

            // Update index
            const relativePath = path.relative(this.piiPath, resumePath);
            this.indexManager.updateResumeVersion(metadata, relativePath);
        }
    }

    /**
     * Update resume metadata
     */
    updateResumeMetadata(
        position: string,
        updates: Partial<ResumeMetadata>,
        company?: string,
        date?: string
    ): ResumeMetadata | null {
        const resumePath = this.indexManager.getResumePath(position, company, date);
        if (!resumePath) {
            return null;
        }

        const metadataPath = ResumeMetadataManager.getMetadataPath(path.dirname(resumePath));
        const updated = ResumeMetadataManager.updateMetadata(metadataPath, updates);

        if (updated) {
            const relativePath = path.relative(this.piiPath, resumePath);
            this.indexManager.updateResumeVersion(updated, relativePath);
        }

        return updated;
    }

    /**
     * Delete a resume version
     */
    deleteResumeVersion(position: string, company?: string, date?: string): boolean {
        const resumePath = this.indexManager.getResumePath(position, company, date);
        if (!resumePath || !fs.existsSync(resumePath)) {
            return false;
        }

        try {
            // Delete the entire version directory
            const versionDir = path.dirname(resumePath);
            fs.rmSync(versionDir, { recursive: true, force: true });

            // Update index
            this.indexManager.removeResumeVersion(position, company, date);

            return true;
        } catch (error) {
            console.error("Error deleting resume version:", error);
            return false;
        }
    }

    /**
     * Copy a resume version to create a new one
     */
    async copyResumeVersion(
        sourcePosition: string,
        targetOptions: CreateResumeVersionOptions,
        sourceCompany?: string,
        sourceDate?: string
    ): Promise<ResumeVersion> {
        const sourceVersion = this.getResumeVersion(sourcePosition, sourceCompany, sourceDate);
        if (!sourceVersion) {
            throw new Error(`Source resume not found: ${sourcePosition}${sourceCompany ? `/${sourceCompany}` : ""}`);
        }

        // Read source content
        const sourceContent = fs.readFileSync(sourceVersion.path, "utf8");

        // Create new version with source content
        const newVersion = await this.createResumeVersion({
            ...targetOptions,
            basedOn: sourceVersion.id
        });

        // Update the content (in case we want to modify it during copy)
        fs.writeFileSync(newVersion.path, sourceContent, "utf8");

        return newVersion;
    }

    /**
     * Get navigation data for UI
     */
    getNavigationData(): {
        positions: string[];
        companiesByPosition: Record<string, string[]>;
        recent: Array<{ position: string; company: string; date: string; status: string }>;
        statistics: {
            totalPositions: number;
            totalCompanies: number;
            totalVersions: number;
        };
    } {
        const listResult = this.listResumeVersions();
        const recentVersions = this.indexManager.getRecentlyModified(5);
        const stats = this.indexManager.getStatistics();

        return {
            positions: listResult.positions,
            companiesByPosition: listResult.companies,
            recent: recentVersions.map(item => ({
                position: item.position,
                company: item.company,
                date: item.version.date,
                status: item.version.status
            })),
            statistics: {
                totalPositions: stats.totalPositions,
                totalCompanies: stats.totalCompanies,
                totalVersions: stats.totalVersions
            }
        };
    }

    /**
     * Scan the file system for existing resume files and update the index
     */
    scanAndUpdateIndex(): {
        scanned: number;
        added: number;
        updated: number;
        errors: string[];
    } {
        const result: {
            scanned: number;
            added: number;
            updated: number;
            errors: string[];
        } = {
            scanned: 0,
            added: 0,
            updated: 0,
            errors: []
        };

        try {
            // Ensure resumes directory exists
            if (!fs.existsSync(this.resumesDir)) {
                return result;
            }

            // Get current index
            const index = this.indexManager.readIndex();
            const existingVersions = new Set<string>();

            // Track existing versions in index
            for (const [position, positionGroup] of Object.entries(index.positions)) {
                for (const [company, versions] of Object.entries(positionGroup.companies)) {
                    for (const version of versions) {
                        existingVersions.add(`${position}:${company}:${version.date}`);
                    }
                }
            }

            // Scan directory structure
            const positions = fs.readdirSync(this.resumesDir, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            for (const position of positions) {
                const positionDir = path.join(this.resumesDir, position);

                // Scan for companies or default
                const companies = fs.readdirSync(positionDir, { withFileTypes: true })
                    .filter(dirent => dirent.isDirectory())
                    .map(dirent => dirent.name);

                for (const company of companies) {
                    const companyDir = path.join(positionDir, company);

                    // Handle special case for "default" directory
                    if (company === "default") {
                        const defaultDataPath = path.join(companyDir, "data.yml");
                        if (fs.existsSync(defaultDataPath)) {
                            result.scanned++;

                            // Initialize position if it doesn't exist
                            if (!index.positions[position]) {
                                index.positions[position] = {
                                    default: `resumes/${position}/default/data.yml`,
                                    companies: {}
                                };
                                result.added++;
                            }
                        }
                        continue;
                    }

                    // Scan for date directories
                    const dates = fs.readdirSync(companyDir, { withFileTypes: true })
                        .filter(dirent => dirent.isDirectory())
                        .map(dirent => dirent.name);

                    for (const date of dates) {
                        const dateDir = path.join(companyDir, date);
                        const dataPath = path.join(dateDir, "data.yml");
                        const metadataPath = path.join(dateDir, "metadata.json");

                        if (fs.existsSync(dataPath)) {
                            result.scanned++;

                            const versionKey = `${position}:${company}:${date}`;

                            try {
                                // Load or create metadata
                                let metadata = ResumeMetadataManager.loadMetadata(metadataPath);

                                if (!metadata) {
                                    // Create metadata for existing file
                                    const stats = fs.statSync(dataPath);
                                    metadata = ResumeMetadataManager.createMetadata(position, company, {
                                        description: `Resume for ${position} at ${company}`,
                                        tags: [position, company]
                                    });

                                    // Use file timestamps if available
                                    metadata.dateCreated = stats.birthtime.toISOString();
                                    metadata.lastModified = stats.mtime.toISOString();

                                    // Save the new metadata
                                    ResumeMetadataManager.saveMetadata(metadataPath, metadata);
                                }

                                // Check if this version is already in the index
                                if (existingVersions.has(versionKey)) {
                                    // Update existing entry
                                    const relativePath = path.relative(this.piiPath, dataPath);
                                    this.indexManager.updateResumeVersion(metadata, relativePath);
                                    result.updated++;
                                } else {
                                    // Add new entry
                                    const relativePath = path.relative(this.piiPath, dataPath);
                                    this.indexManager.addResumeVersion(metadata, relativePath);
                                    result.added++;
                                }

                            } catch (error) {
                                const errorMsg = `Failed to process ${position}/${company}/${date}: ${error instanceof Error ? error.message : "Unknown error"}`;
                                result.errors.push(errorMsg);
                                console.error(errorMsg);
                            }
                        }
                    }
                }
            }

        } catch (error) {
            const errorMsg = `Scan failed: ${error instanceof Error ? error.message : "Unknown error"}`;
            result.errors.push(errorMsg);
            console.error(errorMsg);
        }

        return result;
    }

    /**
     * Initialize multi-resume system (for migration/setup)
     */
    initialize(): void {
        this.ensureDirectoryStructure();
        this.indexManager.initializeIndex();

        // Automatically scan for existing files after initialization
        this.scanAndUpdateIndex();
    }
}
