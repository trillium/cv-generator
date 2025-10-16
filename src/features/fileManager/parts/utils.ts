import { DirectoryFileInfo } from "@/lib/multiFileManager";
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

  // Sort function: files first, then directories (both alphabetically)
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.type === "file" && b.type === "directory") return -1;
      if (a.type === "directory" && b.type === "file") return 1;
      return a.name.localeCompare(b.name);
    });
  };

  // Recursively sort all children
  const sortTreeRecursively = (node: TreeNode): TreeNode => {
    if (node.children && node.children.length > 0) {
      node.children = sortNodes(node.children);
      node.children.forEach(sortTreeRecursively);
    }
    return node;
  };

  const rootNodes = Object.values(tree).filter((node) => {
    const depth = node.path.split("/").length;
    return depth === 1;
  });

  // Sort root nodes and all their descendants
  const sortedRootNodes = sortNodes(rootNodes);
  sortedRootNodes.forEach(sortTreeRecursively);

  return sortedRootNodes;
}
