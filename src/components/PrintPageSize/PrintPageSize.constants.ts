// ...existing code...
const DEFAULT_PAGE_SIZES = {
  letter: { name: "US Letter", width: 8.5, height: 11 },
  a4: { name: "A4", width: 8.27, height: 11.69 },
  legal: { name: "US Legal", width: 8.5, height: 14 },
  tabloid: { name: "Tabloid", width: 11, height: 17 },
};

export { DEFAULT_PAGE_SIZES };

export type PageSize = {
  name: string;
  width: number;
  height: number;
};

export interface PrintPageSizeProps {
  targetSelector?: string;
  pageSize?: PageSize;
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  dpi?: number;
  onPageSizeChange?: (pageSize: PageSize) => void;
}
// ...existing code...
