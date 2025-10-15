import { createContext } from "react";
import type { FileManagerContextType } from "./FileManagerContext";

const FileManagerContext = createContext<FileManagerContextType | undefined>(
  undefined,
);

export { FileManagerContext };
