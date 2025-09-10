"use client";

import { useState } from "react";

/**
 * Custom hook for managing section editing state
 * Provides methods to open section editor and track current editing section
 */
export function useSectionEditor() {
  const [currentEditingSection, setCurrentEditingSection] = useState<
    string | null
  >(null);

  const openSectionEditor = (yamlPath: string) => {
    setCurrentEditingSection(yamlPath);
  };

  const closeSectionEditor = () => {
    setCurrentEditingSection(null);
  };

  return {
    currentEditingSection,
    isEditingSection: currentEditingSection !== null,
    openSectionEditor,
    closeSectionEditor,
  };
}
