import { createContext } from "react";
import type { DirectoryManagerContextType } from "./DirectoryManagerContext";

export const DirectoryManagerContext = createContext<
  DirectoryManagerContextType | undefined
>(undefined);
