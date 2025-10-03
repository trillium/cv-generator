import { useContext } from "react";
import { FileManagerContext } from "./FileManagerContext.constants";

export function useFileManager() {
  const context = useContext(FileManagerContext);
  if (context === undefined) {
    throw new Error("useFileManager must be used within a FileManagerProvider");
  }
  return context;
}
