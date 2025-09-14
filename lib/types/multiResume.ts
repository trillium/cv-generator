/**
 * Multi-Resume System Type Definitions
 */

export interface ResumeVersion {
    id: string;
    position: string;
    company?: string;
    date: string;
    path: string;
    metadata: ResumeMetadata;
}

export interface ResumeMetadata {
    id: string;
    position: string;
    company?: string;
    dateCreated: string;
    lastModified: string;
    basedOn?: string;
    status: "draft" | "active" | "submitted" | "archived";
    description?: string;
    tags?: string[];
    applicationDeadline?: string;
    jobUrl?: string;
    notes?: string;
}

export interface ResumeIndex {
    lastUpdated: string;
    default: string;
    positions: Record<string, PositionGroup>;
}

export interface PositionGroup {
    default: string;
    companies: Record<string, CompanyVersion[]>;
}

export interface CompanyVersion {
    date: string;
    path: string;
    lastModified: string;
    status: string;
}

export interface ResumeContext {
    position?: string;
    company?: string;
    date?: string;
}

export interface CreateResumeVersionOptions {
    basedOn?: string;
    position: string;
    company?: string;
    description?: string;
    tags?: string[];
    applicationDeadline?: string;
    jobUrl?: string;
    notes?: string;
}

export interface ResumeNavigationResult {
    versions: ResumeVersion[];
    total: number;
    positions: string[];
    companies: Record<string, string[]>;
}

export interface NavigationData {
    positions: string[];
    companiesByPosition: Record<string, string[]>;
    recent: Array<{ position: string; company: string; date: string; status: string }>;
    statistics: {
        totalPositions: number;
        totalCompanies: number;
        totalVersions: number;
    };
}

export type ResumeStatus = "draft" | "active" | "submitted" | "archived";

export interface ResumeListOptions {
    position?: string;
    company?: string;
    status?: ResumeStatus;
    limit?: number;
    sortBy?: 'dateCreated' | 'lastModified' | 'company' | 'position';
    sortOrder?: 'asc' | 'desc';
}
