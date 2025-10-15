import * as React from "react";
import SectionBadge from "./SectionBadge";
import { DirectoryFileInfo } from "@/contexts/FileManagerContext";

interface SelectedFileInfoProps {
  selectedFile: string | null;
  files: DirectoryFileInfo[];
}

const SelectedFileInfo: React.FC<SelectedFileInfoProps> = ({
  selectedFile,
  files,
}) => {
  if (!selectedFile) return null;
  const fileInfo = files.find((f) => f.path === selectedFile);
  if (!fileInfo) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Selected File
      </h2>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Path:</span>
          <div className="font-mono text-xs text-gray-900 dark:text-gray-100">
            {fileInfo.path}
          </div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Format:</span>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {fileInfo.format.toUpperCase()}
          </div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Type:</span>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {fileInfo.isFullData ? "Full Data" : "Section Specific"}
          </div>
        </div>
        {fileInfo.sections.length > 0 && (
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              Sections ({fileInfo.sections.length}):
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {fileInfo.sections.map((section) => (
                <SectionBadge key={section} section={section} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectedFileInfo;
