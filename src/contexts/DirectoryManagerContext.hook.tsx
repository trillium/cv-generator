import { useContext } from "react";
import { DirectoryManagerContext } from "./DirectoryManagerContext.context";

export function useDirectoryManager() {
  const context = useContext(DirectoryManagerContext);
  if (context === undefined) {
    throw new Error(
      "useDirectoryManager must be used within a DirectoryManagerProvider",
    );
  }
  return context;
}
