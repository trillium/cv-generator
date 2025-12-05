"use client";

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
  cvData: CVData;
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
  cvData,
  variant,
  layout,
}: DynamicDbPageProps) {
  const Component = componentMap[variant][layout];

  return <Component data={cvData} />;
}
