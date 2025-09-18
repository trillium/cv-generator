import colors from "tailwindcss/colors";

// Utility function to get color from Tailwind colors
export const getColorFromTailwind = (
  colorName: string,
  shade: string,
): string => {
  const colorFamily = (colors as any)[colorName];
  if (colorFamily && typeof colorFamily === "object" && colorFamily[shade]) {
    return colorFamily[shade];
  }
  return `#${colorName}-${shade}`; // Fallback
};

// Utility function to create color with alpha
export const createColorWithAlpha = (color: string, alpha: number): string => {
  if (color.startsWith("oklch(")) {
    // For OKLCH colors, use the / alpha syntax
    const colorWithoutClosing = color.slice(0, -1); // Remove the closing )
    return `${colorWithoutClosing} / ${alpha})`;
  } else if (color.startsWith("#")) {
    // For hex colors, append the alpha as hex
    const alphaHex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");
    return `${color}${alphaHex}`;
  } else {
    // Fallback for other color formats
    return color;
  }
};
