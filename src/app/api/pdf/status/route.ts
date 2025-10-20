import { NextRequest, NextResponse } from "next/server";
import { pdfJobTracker } from "@/lib/pdfJobTracker";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json(
      { success: false, error: "Missing jobId parameter" },
      { status: 400 },
    );
  }

  const job = pdfJobTracker.getJob(jobId);

  if (!job) {
    return NextResponse.json(
      { success: false, error: "Job not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    job: {
      id: job.id,
      status: job.status,
      directoryPath: job.directoryPath,
      pdfsToRegenerate: job.pdfsToRegenerate,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      metadata: job.metadata,
    },
  });
}
