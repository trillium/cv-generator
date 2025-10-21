import * as React from "react";
import { useState } from "react";
import { useModal } from "@/contexts/ModalContext";
import type { DirectoryFileInfo } from "@/types/multiFileManager.types";
import type { CVData } from "@/types";

interface SplitSectionContentProps {
  selectedFile: string;
  fileInfo: DirectoryFileInfo | undefined;
  currentDirectory: string | null;
  parsedData: CVData | null;
  onClose: () => void;
  onSplit: (sectionKeys: string[], targetFileName: string) => void;
}

const SplitSectionContent: React.FC<SplitSectionContentProps> = ({
  selectedFile,
  fileInfo,
  currentDirectory,
  parsedData,
  onClose,
  onSplit,
}) => {
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(),
  );
  const [targetFileName, setTargetFileName] = useState("");
  const { useAutoFocus } = useModal();
  const inputRef = useAutoFocus<HTMLInputElement>();

  const fileSections = fileInfo?.sections || [];
  const mergedDataSections = parsedData ? Object.keys(parsedData) : [];
  const sections = fileSections.length > 0 ? fileSections : mergedDataSections;
  const isUsingMergedData =
    fileSections.length === 0 && mergedDataSections.length > 0;
  const allSelected = selectedSections.size === sections.length;

  function toggleSection(section: string) {
    const newSelection = new Set(selectedSections);
    if (newSelection.has(section)) {
      newSelection.delete(section);
    } else {
      newSelection.add(section);
    }
    setSelectedSections(newSelection);
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedSections(new Set());
    } else {
      setSelectedSections(new Set(sections));
    }
  }

  function handleSplit() {
    if (selectedSections.size > 0 && targetFileName.trim()) {
      onSplit(Array.from(selectedSections), targetFileName.trim());
    }
  }

  if (sections.length === 0) {
    return (
      <>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Split Section to New File
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No sections available. Please load a directory first.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Split Section to New File
      </h3>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {isUsingMergedData ? (
            <>
              Target Directory:{" "}
              <span className="font-mono">{currentDirectory}</span>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sections from merged data (inherited from parent directories)
              </div>
            </>
          ) : (
            <>Source File: {selectedFile}</>
          )}
        </label>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Sections ({selectedSections.size}/{sections.length})
            </span>
            <button
              onClick={toggleAll}
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>
          </div>

          {allSelected && !isUsingMergedData && (
            <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded text-sm text-yellow-800 dark:text-yellow-200">
              All sections selected - this will duplicate the entire file
            </div>
          )}

          <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-3 bg-gray-50 dark:bg-gray-900">
            {sections.map((section: string) => (
              <label
                key={section}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedSections.has(section)}
                  onChange={() => toggleSection(section)}
                  className="w-4 h-4 text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                  {section}
                </span>
              </label>
            ))}
          </div>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={targetFileName}
          onChange={(e) => setTargetFileName(e.target.value)}
          placeholder="Target file name (e.g., work.yml)"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          onKeyDown={(e) => e.key === "Enter" && handleSplit()}
        />
      </div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={handleSplit}
          disabled={selectedSections.size === 0 || !targetFileName.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUsingMergedData
            ? "Create File"
            : allSelected
              ? "Duplicate File"
              : "Split Sections"}
        </button>
      </div>
    </>
  );
};

export default SplitSectionContent;
