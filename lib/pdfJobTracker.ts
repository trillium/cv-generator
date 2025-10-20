import { randomBytes } from "crypto";

export interface PdfJobMetadata {
  pageCount?: number;
  offScreenText?: string[];
  error?: string;
}

export interface PdfJob {
  id: string;
  status: "processing" | "complete" | "failed";
  directoryPath: string;
  pdfsToRegenerate: string[];
  startedAt: number;
  completedAt?: number;
  metadata?: PdfJobMetadata;
}

class PdfJobTracker {
  private jobs: Map<string, PdfJob> = new Map();
  private readonly MAX_JOBS = 100;
  private readonly JOB_TTL = 5 * 60 * 1000;

  createJob(directoryPath: string, pdfsToRegenerate: string[]): string {
    const id = randomBytes(16).toString("hex");
    const job: PdfJob = {
      id,
      status: "processing",
      directoryPath,
      pdfsToRegenerate,
      startedAt: Date.now(),
    };

    this.jobs.set(id, job);
    this.cleanup();

    return id;
  }

  getJob(id: string): PdfJob | undefined {
    return this.jobs.get(id);
  }

  completeJob(id: string, metadata: PdfJobMetadata): void {
    const job = this.jobs.get(id);
    if (job) {
      job.status = "complete";
      job.completedAt = Date.now();
      job.metadata = metadata;
    }
  }

  failJob(id: string, error: string): void {
    const job = this.jobs.get(id);
    if (job) {
      job.status = "failed";
      job.completedAt = Date.now();
      job.metadata = { error };
    }
  }

  private cleanup(): void {
    if (this.jobs.size <= this.MAX_JOBS) return;

    const now = Date.now();
    const entriesToDelete: string[] = [];

    for (const [id, job] of this.jobs.entries()) {
      const age = now - job.startedAt;
      if (age > this.JOB_TTL) {
        entriesToDelete.push(id);
      }
    }

    for (const id of entriesToDelete) {
      this.jobs.delete(id);
    }
  }
}

export const pdfJobTracker = new PdfJobTracker();
