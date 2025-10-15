import * as React from "react";
import { useState } from "react";
import { useModal } from "@/contexts/ModalContext";

interface SplitSectionContentProps {
  selectedFile: string;
  onClose: () => void;
  onSplit: (sectionKey: string, targetFileName: string) => void;
}

const SplitSectionContent: React.FC<SplitSectionContentProps> = ({
  selectedFile,
  onClose,
  onSplit,
}) => {
  const [sectionKey, setSectionKey] = useState("");
  const [targetFileName, setTargetFileName] = useState("");
  const { useAutoFocus } = useModal();
  const inputRef = useAutoFocus<HTMLInputElement>();

  function handleSplit() {
    if (sectionKey.trim() && targetFileName.trim()) {
      onSplit(sectionKey.trim(), targetFileName.trim());
    }
  }

  return (
    <>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Split Section to New File
      </h3>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Source File: {selectedFile}
        </label>
        <input
          ref={inputRef}
          type="text"
          value={sectionKey}
          onChange={(e) => setSectionKey(e.target.value)}
          placeholder="Section key (e.g., workExperience)"
          className="w-full px-3 py-2 mb-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <input
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
          disabled={!sectionKey.trim() || !targetFileName.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Split
        </button>
      </div>
    </>
  );
};

export default SplitSectionContent;
