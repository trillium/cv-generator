"use client";

import { MdRefresh } from "react-icons/md";
import { toast } from "sonner";

export default function ReprintButton() {
  const handleReprint = async () => {
    try {
      toast.info("Triggering PDF regeneration...");

      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to trigger PDF generation");
      }

      toast.success("PDF regeneration started");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to reprint: ${message}`);
    }
  };

  return (
    <button
      onClick={handleReprint}
      className="flex items-center gap-2 rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      title="Regenerate PDF"
    >
      <MdRefresh className="w-4 h-4" />
      <span>Reprint</span>
    </button>
  );
}
