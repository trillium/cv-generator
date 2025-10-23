import type {
  PdfJobState,
  PdfMetadata,
} from "@/contexts/DirectoryManager/DirectoryManagerContext";
import type {
  PdfMetadataFile,
  PdfMetadata as StoredPdfMetadata,
} from "@/types/multiFileManager.types";

export function getPdfUrl(
  directory: string | null,
  type: "resume" | "cover-letter",
): string | null {
  if (!directory) return null;

  const params = new URLSearchParams({
    resumePath: directory,
    type: type,
  });

  return `/api/pdf/view?${params.toString()}`;
}

function convertStoredMetadata(stored: StoredPdfMetadata): PdfMetadata {
  return {
    pageCount: stored.pages,
  };
}

export function getPdfMetadata(
  metadata: PdfMetadataFile | null,
  type: string,
): PdfMetadata | null {
  if (!metadata?.pdf) return null;

  let storedMeta: StoredPdfMetadata | undefined;

  if (type === "resume") storedMeta = metadata.pdf.resume;
  else if (type === "cover-letter") storedMeta = metadata.pdf.coverLetter;

  return storedMeta ? convertStoredMetadata(storedMeta) : null;
}

export function isPdfReady(pdfJobs: PdfJobState[], type: string): boolean {
  const job = pdfJobs.find((j) => j.pdfTypes.includes(type));
  return job ? job.status === "complete" : false;
}

export function isPdfGenerating(pdfJobs: PdfJobState[], type: string): boolean {
  const job = pdfJobs.find((j) => j.pdfTypes.includes(type));
  return job ? job.status === "processing" : false;
}

export function hasPdfError(
  metadata: PdfMetadataFile | null,
  type: string,
): boolean {
  const pdfMeta = getPdfMetadata(metadata, type);
  return pdfMeta ? !!pdfMeta.error : false;
}
