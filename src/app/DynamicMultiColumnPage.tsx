"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { CVData } from "@/types";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/src/components/SharedUIStates";
import { useDirectoryManager } from "@/contexts/DirectoryManager/DirectoryManagerContext.hook";

import dynamic from "next/dynamic";

const SingleColumnResume = dynamic(
  () => import("@/components/Resume/single-column/resume"),
);
const SingleColumnCoverLetter = dynamic(
  () => import("@/components/Resume/single-column/cover-letter"),
);
const TwoColumnResume = dynamic(
  () => import("@/components/Resume/two-column/resume"),
);
const TwoColumnCoverLetter = dynamic(
  () => import("@/components/Resume/two-column/cover-letter"),
);

import type { ComponentType } from "react";
import type { CVData } from "@/types";

type Variant = "resume" | "cover-letter";
type Layout = "single-column" | "two-column";

interface DynamicMultiColumnPageProps {
  variant: Variant;
  layout: Layout;
  defaultRoute: string;
}

const componentMap: Record<
  Variant,
  Record<Layout, ComponentType<{ data: CVData }>>
> = {
  resume: {
    "single-column": SingleColumnResume,
    "two-column": TwoColumnResume,
  },
  "cover-letter": {
    "single-column": SingleColumnCoverLetter,
    "two-column": TwoColumnCoverLetter,
  },
};

export default function DynamicMultiColumnPage({
  variant,
  layout,
  defaultRoute,
}: DynamicMultiColumnPageProps) {
  const params = useParams();
  const router = useRouter();
  const {
    parsedData,
    loadDirectory,
    loading: contextLoading,
    error: contextError,
    setDocumentType,
  } = useDirectoryManager();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedDirPath, setResolvedDirPath] = useState<string | null>(null);
  // Extract directory path from params - catch-all route returns an array
  const resumePathSegments = params?.["resume-path"] as string[] | undefined;
  const dirPath = resumePathSegments ? resumePathSegments.join("/") : undefined;

  useEffect(() => {
    setDocumentType(variant);
  }, [variant, setDocumentType]);

  useEffect(() => {
    async function validateAndLoad() {
      if (!dirPath) {
        setError("No directory path provided");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        await loadDirectory(dirPath);
        setResolvedDirPath(dirPath);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : `Failed to load directory: ${dirPath}`;
        setError(errorMessage);
        console.error("Error loading directory:", err);
      } finally {
        setLoading(false);
      }
    }
    validateAndLoad();
  }, [dirPath, loadDirectory]);

  const Component = componentMap[variant][layout];

  if (loading || contextLoading || !Component) {
    return <LoadingState message={`Loading directory: ${dirPath}...`} />;
  }

  const displayError = error || contextError;
  if (displayError) {
    return (
      <ErrorState
        title="Directory Not Found"
        message={displayError}
        path={dirPath}
        buttonText={`Go to Default ${variant === "resume" ? "Resume" : "Cover Letter"}`}
        onButtonClickAction={() => router.push(defaultRoute)}
      />
    );
  }

  if (!parsedData) {
    return (
      <EmptyState
        title={`No ${variant === "resume" ? "Resume" : "Cover Letter"} Data`}
        message="The directory was found but contains no data files."
      />
    );
  }

  return (
    <div>
      <div className="sr-only">
        Currently displaying directory: {resolvedDirPath || dirPath}
      </div>
      <Component data={parsedData as CVData} />
    </div>
  );
}
