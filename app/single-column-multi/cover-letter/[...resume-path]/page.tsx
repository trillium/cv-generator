"use client";
import DynamicMultiColumnPage from "@/app/DynamicMultiColumnPage";
export default function DynamicSingleColumnMultiCoverLetterPage() {
  return (
    <DynamicMultiColumnPage
      variant="cover-letter"
      layout="single-column"
      defaultRoute="/single-column/cover-letter"
    />
  );
}
