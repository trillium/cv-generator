"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SingleColumnCatchAll() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the default single-column resume page
    router.replace("/single-column/resume");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          Redirecting to resume page...
        </p>
      </div>
    </div>
  );
}
