"use client";
import DynamicMultiColumnPage from "@/app/DynamicMultiColumnPage";
export default function DynamicTwoColumnMultiResumePage() {
  return (
    <DynamicMultiColumnPage
      variant="resume"
      layout="two-column"
      defaultRoute="/two-column/resume"
    />
  );
}
