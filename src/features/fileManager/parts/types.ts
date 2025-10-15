import { DirectoryFileInfo } from "@/contexts/FileManagerContext";

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
