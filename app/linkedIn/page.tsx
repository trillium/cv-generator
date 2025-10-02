"use client";

import { useEffect } from "react";
import LinkedInProfile from "../../src/components/LinkedIn/LinkedInProfile";
import {
  LinkedInProvider,
  useLinkedInData,
} from "../../src/contexts/LinkedInContext";

function LinkedInPageContent() {
  const { currentLinkedInData, loadLinkedInFile, loading, error } =
    useLinkedInData();

  useEffect(() => {
    loadLinkedInFile("linkedin.yml");
  }, [loadLinkedInFile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading LinkedIn profile...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!currentLinkedInData) {
    return null;
  }

  return <LinkedInProfile data={currentLinkedInData} />;
}

export default function LinkedInPage() {
  return (
    <LinkedInProvider>
      <LinkedInPageContent />
    </LinkedInProvider>
  );
}
