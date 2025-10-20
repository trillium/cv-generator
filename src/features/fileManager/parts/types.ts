import type { DirectoryFileInfo } from "@/lib/multiFileManager.types";

export interface EditingFieldState {
  path: string;
  value: string;
}

export interface TreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: TreeNode[];
  file?: DirectoryFileInfo;
}
