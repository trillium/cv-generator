import { writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

export interface PdfMetadata {
  pages: number;
  lastPageText?: string;
  lastPageLines?: string[];
  lineBreaks?: number;
  generatedAt: string;
}

export interface MetadataFile {
  pdf?: {
    resume?: PdfMetadata;
    coverLetter?: PdfMetadata;
  };
}

export function saveMetadata(
  resumeDir: string,
  type: "resume" | "coverLetter",
  metadata: PdfMetadata,
): void {
  const metadataPath = path.join(resumeDir, "metadata.json");

  let existingMetadata: MetadataFile = {};
  if (existsSync(metadataPath)) {
    try {
      const content = readFileSync(metadataPath, "utf-8");
      existingMetadata = JSON.parse(content);
    } catch (err) {
      console.warn(`⚠️  Could not read existing metadata: ${err}`);
    }
  }

  if (!existingMetadata.pdf) {
    existingMetadata.pdf = {};
  }

  existingMetadata.pdf[type] = metadata;

  writeFileSync(
    metadataPath,
    JSON.stringify(existingMetadata, null, 2),
    "utf-8",
  );
  console.log(`📝 Metadata saved to ${metadataPath}`);
}
