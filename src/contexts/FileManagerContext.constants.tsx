// Utility/context constants for FileManagerContext
import { createContext } from "react";
import type { FileManagerContextType } from "../types/fileManager";

const FileManagerContext = createContext<FileManagerContextType | undefined>(
  undefined,
);

export { FileManagerContext };
