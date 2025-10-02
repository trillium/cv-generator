"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { LuPaintbrushVertical } from "react-icons/lu";
import colors from "tailwindcss/colors";
import { useModal } from "../../contexts/ModalContext";
import { ColorPickerProps, TailwindColor } from "./types";
import { COLOR_FAMILIES, COLOR_SHADES } from "./constants";
import { getColorFromTailwind } from "./utils";

export default function ColorPicker({
  selectedColor,
  onColorSelect,
  className = "",
  showAsModal = false,
  buttonText = "Choose Color",
  buttonIcon,
  modalTitle = "Choose a Color",
  modalDescription = "Select a color from the palette",
}: ColorPickerProps) {
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const { openModal, closeModal } = useModal();

  const handleColorClick = (colorName: string, shade: string) => {
    const hex = getColorFromTailwind(colorName, shade);
    const color: TailwindColor = {
      name: colorName,
      shade,
      hex,
      className: `bg-${colorName}-${shade}`,
    };

    console.log(`🚨 DEBUG: Color selected: ${colorName}-${shade} (${hex})`);

    // Apply the color to CSS custom properties for theme customization
    if (typeof window !== "undefined") {
      // Set primary theme colors to the selected color family's shades
      const colorFamily = (
        colors as unknown as Record<string, Record<string, string>>
      )[colorName];
      if (colorFamily && typeof colorFamily === "object") {
        document.documentElement.style.setProperty(
          "--color-primary",
          colorFamily[shade] || hex,
        );
        document.documentElement.style.setProperty(
          "--color-primary-50",
          colorFamily["50"] || hex,
        );
        document.documentElement.style.setProperty(
          "--color-primary-100",
          colorFamily["100"] || hex,
        );
        document.documentElement.style.setProperty(
          "--color-primary-200",
          colorFamily["200"] || hex,
        );
        document.documentElement.style.setProperty(
          "--color-primary-300",
          colorFamily["300"] || hex,
        );
        document.documentElement.style.setProperty(
          "--color-primary-400",
          colorFamily["400"] || hex,
        );
        document.documentElement.style.setProperty(
          "--color-primary-500",
          colorFamily["500"] || hex,
        );
        document.documentElement.style.setProperty(
          "--color-primary-600",
          colorFamily["600"] || hex,
        );
        document.documentElement.style.setProperty(
          "--color-primary-700",
          colorFamily["700"] || hex,
        );
        document.documentElement.style.setProperty(
          "--color-primary-800",
          colorFamily["800"] || hex,
        );
        document.documentElement.style.setProperty(
          "--color-primary-900",
          colorFamily["900"] || hex,
        );
        document.documentElement.style.setProperty(
          "--color-primary-950",
          colorFamily["950"] || hex,
        );
      } else {
        // Fallback to selected color
        document.documentElement.style.setProperty("--color-primary", hex);
      }
      // Debug: print --color-primary and some shades
      const computedStyle = getComputedStyle(document.documentElement);
      console.log(
        "🚨 DEBUG: --color-primary:",
        computedStyle.getPropertyValue("--color-primary"),
      );
      console.log(
        "🚨 DEBUG: --color-primary-500:",
        computedStyle.getPropertyValue("--color-primary-500"),
      );
      console.log(
        "🚨 DEBUG: --color-primary-700:",
        computedStyle.getPropertyValue("--color-primary-700"),
      );

      // Debug body color
      const bodyComputed = getComputedStyle(document.body);
      console.log("🚨 DEBUG: Body color after selection:", bodyComputed.color);
      console.log("🚨 DEBUG: Body background:", bodyComputed.backgroundColor);
    }

    onColorSelect?.(color);
    if (showAsModal) {
      closeModal();
    }
  };

  const openColorPickerModal = () => {
    const ColorPickerModal = () => (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-primary-900 dark:text-primary-800">
            {modalTitle}
          </h2>
          <p className="text-sm text-primary-700 dark:text-primary-200 mt-1">
            {modalDescription}
          </p>
        </div>

        <ColorPicker
          selectedColor={selectedColor}
          onColorSelect={(color) => {
            console.log(
              `🚨 DEBUG: Modal color selected: ${color.name}-${color.shade}`,
            );
            handleColorClick(color.name, color.shade);
          }}
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

    openModal(<ColorPickerModal />, "lg");
  };

  if (showAsModal) {
    return (
      <button
        onClick={openColorPickerModal}
        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors relative"
        title={buttonText}
      >
        {buttonIcon || <LuPaintbrushVertical className="w-5 h-5" />}
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

  return (
    <div className={clsx("space-y-4", className)}>
      <div className="text-sm font-medium text-primary-900 dark:text-primary-800">
        Choose a color
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
        {COLOR_FAMILIES.map((colorName) => (
          <div key={colorName} className="space-y-1">
            <div className="text-xs font-medium text-primary-700 dark:text-primary-200 capitalize">
              {colorName}
            </div>

            <div className="grid grid-cols-10 gap-0.5">
              {COLOR_SHADES.map((shade) => {
                const hex = getColorFromTailwind(colorName, shade);
                const isSelected = selectedColor === `${colorName}-${shade}`;
                const isHovered = hoveredColor === `${colorName}-${shade}`;

                return (
                  <button
                    key={shade}
                    onClick={() => {
                      console.log(`🚨 DEBUG: Clicked ${colorName}-${shade}`);
                      handleColorClick(colorName, shade);
                    }}
                    onMouseEnter={() =>
                      setHoveredColor(`${colorName}-${shade}`)
                    }
                    onMouseLeave={() => setHoveredColor(null)}
                    className={clsx(
                      "w-8 h-8 rounded-md border-2 transition-all duration-200",
                      "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                      {
                        "border-gray-400 dark:border-gray-500":
                          !isSelected && !isHovered,
                        "border-blue-500 shadow-lg": isSelected,
                        "border-gray-600 dark:border-gray-300":
                          isHovered && !isSelected,
                      },
                    )}
                    style={{ backgroundColor: hex }}
                    title={`${colorName}-${shade} (${hex})`}
                    aria-label={`Select ${colorName} ${shade}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedColor && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="text-sm text-primary-700 dark:text-primary-200">
            Selected:
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border border-gray-300"
              style={{
                backgroundColor: selectedColor
                  ? getColorFromTailwind(
                      selectedColor.split("-")[0],
                      selectedColor.split("-")[1],
                    )
                  : undefined,
              }}
            />
            <span className="text-sm font-medium text-primary-900 dark:text-primary-800">
              {selectedColor}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
