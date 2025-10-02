"use client";

import { clsx } from "clsx";
import PrintPageSize, { DEFAULT_PAGE_SIZES } from "../PrintPageSize";
import ResumeSelector from "../ResumeSelector/ResumeSelector";
import ThemeSwitch from "../ThemeSwitch";
import LayoutSelector from "./LayoutSelector";
import { ColorPickerSwitch } from "../ColorPicker";

import HomeButton from "./HomeButton";
import FileBrowserButton from "./FileBrowserButton";

import TypeToggle from "./TypeToggle";

export default function Navigation() {
  return (
    <nav className={clsx("print:hidden top-4 right-4 z-40")}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <ResumeSelector />

          <PrintPageSize
            pageSize={DEFAULT_PAGE_SIZES.letter}
            margins={{ top: 0.25, bottom: 0.25, left: 0.25, right: 0.25 }}
          />

          <LayoutSelector />

          <TypeToggle />

          <ColorPickerSwitch />

          <FileBrowserButton />

          <HomeButton />

          <ThemeSwitch />
        </div>
      </div>
    </nav>
  );
}
