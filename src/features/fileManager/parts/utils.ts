import { DirectoryFileInfo } from "@/contexts/FileManagerContext";
import { TreeNode } from "./types";

export function buildTree(files: DirectoryFileInfo[]): TreeNode[] {
  const tree: Record<string, TreeNode> = {};

  files.forEach((file) => {
    const parts = file.path.split("/");
    let currentPath = "";

    parts.forEach((part: string, index: number) => {
      const isLast = index === parts.length - 1;
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!tree[currentPath]) {
        // Check if this is a directory entry from the file list
        const isDirectory = file.metadata.type === "directory" && isLast;

        tree[currentPath] = {
          name: part,
          path: currentPath,
          type: isDirectory || !isLast ? "directory" : "file",
          children: [],
          file: isLast && !isDirectory ? file : undefined,
        };
      }

      if (parentPath && tree[parentPath]) {
        const parent = tree[parentPath];
        if (!parent.children) parent.children = [];
        if (!parent.children.find((c) => c.path === currentPath)) {
          parent.children.push(tree[currentPath]);
        }
      }
    });
  });

  const rootNodes = Object.values(tree).filter((node) => {
    const depth = node.path.split("/").length;
    return depth === 1;
  });

  return rootNodes;
}
