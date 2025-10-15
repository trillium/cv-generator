import * as React from "react";
import { useState } from "react";
import clsx from "clsx";
import {
  MdFolder,
  MdFolderOpen,
  MdInsertDriveFile,
  MdCircle,
} from "react-icons/md";
import { TreeNode } from "./types";
import SectionBadge from "./SectionBadge";

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  onSelectDirectory: (path: string) => void;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  depth,
  selectedFile,
  onSelectFile,
  onSelectDirectory,
}) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const isSelected = selectedFile === node.path;
  const hasChildren = node.children && node.children.length > 0;
  const paddingLeft = depth * 16;

  function handleClick() {
    if (node.type === "directory") {
      setIsExpanded(!isExpanded);
      onSelectDirectory(node.path);
    } else {
      onSelectFile(node.path);
    }
  }

  return (
    <>
      <div
        className={clsx(
          "flex items-center py-1.5 px-2 cursor-pointer transition-colors",
          isSelected
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
            : "hover:bg-gray-50 dark:hover:bg-gray-700",
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={handleClick}
      >
        {node.type === "directory" && (
          <span className="mr-1.5 text-gray-500 dark:text-gray-400">
            {hasChildren ? (
              isExpanded ? (
                <MdFolderOpen className="inline w-4 h-4" />
              ) : (
                <MdFolder className="inline w-4 h-4" />
              )
            ) : (
              <MdCircle className="inline w-3 h-3" />
            )}
          </span>
        )}
        {node.type === "file" && (
          <span className="mr-1.5 text-gray-400 dark:text-gray-500">
            <MdInsertDriveFile className="inline w-4 h-4" />
          </span>
        )}
        <span
          className={clsx(
            node.type === "directory"
              ? "font-medium text-gray-900 dark:text-gray-100"
              : "text-gray-700 dark:text-gray-300",
          )}
        >
          {node.name}
        </span>
        {node.file && node.file.sections.length > 0 && (
          <span className="ml-2 flex flex-wrap gap-1">
            {node.file.sections.map((section) => (
              <SectionBadge key={section} section={section} />
            ))}
          </span>
        )}
        {/* Directory action buttons */}
        {node.type === "directory" && (
          <span className="ml-3 flex gap-2">
            <a
              href={`/single-column-multi/resume/${encodeURIComponent(node.path)}`}
              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="Open Resume"
            >
              Open Resume
            </a>
            <a
              href={`/single-column-multi/cover-letter/${encodeURIComponent(node.path)}`}
              className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="Open Cover Letter"
            >
              Open Cover Letter
            </a>
          </span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelectFile={onSelectFile}
              onSelectDirectory={onSelectDirectory}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default TreeNodeItem;
