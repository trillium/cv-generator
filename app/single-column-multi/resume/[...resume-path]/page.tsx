"use client";
import DynamicMultiColumnPage from "@/app/DynamicMultiColumnPage";
export default function DynamicSingleColumnMultiResumePage() {
  return (
    <DynamicMultiColumnPage
      variant="resume"
      layout="single-column"
      defaultRoute="/single-column/resume"
    />
  );
}
