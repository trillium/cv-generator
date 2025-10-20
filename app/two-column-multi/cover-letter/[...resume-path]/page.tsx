"use client";
import DynamicMultiColumnPage from "@/app/DynamicMultiColumnPage";
export default function DynamicTwoColumnMultiCoverLetterPage() {
  return (
    <DynamicMultiColumnPage
      variant="cover-letter"
      layout="two-column"
      defaultRoute="/two-column/cover-letter"
    />
  );
}
