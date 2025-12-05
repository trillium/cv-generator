import { getFullResume } from "@/lib/utils/resume-builder";
import type { CVData } from "@/types";
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

type Variant = "resume" | "cover-letter";
type Layout = "single-column" | "two-column";

interface DynamicDbPageProps {
  resumeId: number;
  variant: Variant;
  layout: Layout;
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

export default function DynamicDbPage({
  resumeId,
  variant,
  layout,
}: DynamicDbPageProps) {
  const cvData = getFullResume(resumeId);

  if (!cvData) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold text-red-600">Resume not found</h1>
        <p className="mt-4">
          Resume ID {resumeId} does not exist in the database.
        </p>
      </div>
    );
  }

  const Component = componentMap[variant][layout];

  return <Component data={cvData} />;
}
