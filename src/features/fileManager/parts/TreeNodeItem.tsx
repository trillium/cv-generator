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
        {node.file && (
          <span className="ml-2 text-gray-500 dark:text-gray-400">
            {node.file.sections.length > 0 &&
              `(${node.file.sections.join(", ")})`}
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
