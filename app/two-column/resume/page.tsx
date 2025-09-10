"use client";

import { useEffect, useState } from "react";
import TwoColumnResume from "../../../src/components/Resume/two-column/resume";
import { useYamlData } from "../../../src/contexts/YamlDataContext";
import * as yaml from "js-yaml";
import type { CVData } from "../../../src/types";

export default function TwoColumnResumePage() {
  const { yamlContent, parsedData, refreshData } = useYamlData();
  const [resumeData, setResumeData] = useState<CVData | null>(null);

  // Update resume data when YAML content changes
  useEffect(() => {
    if (parsedData) {
      setResumeData(parsedData as CVData);
    } else if (yamlContent) {
      try {
        const parsed = yaml.load(yamlContent) as CVData;
        setResumeData(parsed);
      } catch (error) {
        console.error("Error parsing YAML:", error);
        // Keep existing data if parsing fails
      }
    }
  }, [yamlContent, parsedData]);

  // Refresh data on component mount to ensure we have the latest
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Show loading state while data is being fetched
  if (!resumeData) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resume data...</p>
        </div>
      </div>
    );
  }

  return <TwoColumnResume data={resumeData} />;
}
