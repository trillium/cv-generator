"use client";

import { useState, useEffect } from "react";
import { LuPaintbrushVertical } from "react-icons/lu";
import colors from "tailwindcss/colors";
import { useModal } from "../../contexts/ModalContext";
import { toast } from "sonner";
import ColorPicker from "./ColorPicker";
import { TailwindColor } from "./types";
import { getColorFromTailwind } from "./utils";

// ColorPickerSwitch - A self-contained color picker button with modal
export function ColorPickerSwitch() {
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    undefined,
  );
  const { openModal, closeModal } = useModal();

  // Load selected color from localStorage on client side only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedColor = localStorage.getItem("selectedColor");
      if (storedColor) {
        setSelectedColor(storedColor);
      }
    }
  }, []);

  const handleColorSelect = (color: TailwindColor) => {
    const colorKey = `${color.name}-${color.shade}`;
    setSelectedColor(colorKey);
    localStorage.setItem("selectedColor", colorKey);

    type TailwindColors = typeof colors;
    type ColorShadeValue = string | Record<string, string>;

    const colorFamily = (colors as TailwindColors)[
      color.name as keyof TailwindColors
    ] as ColorShadeValue;
    if (colorFamily && typeof colorFamily === "object") {
      document.documentElement.style.setProperty(
        "--color-primary",
        colorFamily[color.shade] || color.hex,
      );
      document.documentElement.style.setProperty(
        "--color-primary-50",
        colorFamily["50"] || color.hex,
      );
      document.documentElement.style.setProperty(
        "--color-primary-100",
        colorFamily["100"] || color.hex,
      );
      document.documentElement.style.setProperty(
        "--color-primary-200",
        colorFamily["200"] || color.hex,
      );
      document.documentElement.style.setProperty(
        "--color-primary-300",
        colorFamily["300"] || color.hex,
      );
      document.documentElement.style.setProperty(
        "--color-primary-400",
        colorFamily["400"] || color.hex,
      );
      document.documentElement.style.setProperty(
        "--color-primary-500",
        colorFamily["500"] || color.hex,
      );
      document.documentElement.style.setProperty(
        "--color-primary-600",
        colorFamily["600"] || color.hex,
      );
      document.documentElement.style.setProperty(
        "--color-primary-700",
        colorFamily["700"] || color.hex,
      );
      document.documentElement.style.setProperty(
        "--color-primary-800",
        colorFamily["800"] || color.hex,
      );
      document.documentElement.style.setProperty(
        "--color-primary-900",
        colorFamily["900"] || color.hex,
      );
      document.documentElement.style.setProperty(
        "--color-primary-950",
        colorFamily["950"] || color.hex,
      );
    } else {
      // Fallback to selected color
      document.documentElement.style.setProperty("--color-primary", color.hex);
    }

    toast.success(`Accent color changed to ${color.name} ${color.shade}`);

    closeModal();
  };

  const openColorPickerModal = () => {
    toast.info("Opening color picker...");

    const ColorPickerModal = () => (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Choose Accent Color
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Select a color to customize the theme accent
          </p>
        </div>

        <ColorPicker
          selectedColor={selectedColor}
          onColorSelect={handleColorSelect}
          className="max-h-80"
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={closeModal}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );

    const modalContent = <ColorPickerModal />;
    openModal(modalContent, "lg");
  };

  return (
    <button
      onClick={openColorPickerModal}
      className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors relative"
      title="Choose accent color"
    >
      <LuPaintbrushVertical className="w-5 h-5" />
      {selectedColor && (
        <div
          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800"
          style={{
            backgroundColor: selectedColor
              ? getColorFromTailwind(
                  selectedColor.split("-")[0],
                  selectedColor.split("-")[1],
                )
              : undefined,
          }}
        />
      )}
    </button>
  );
}
