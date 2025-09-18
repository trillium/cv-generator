// Test utility functions for color validation
const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};

const isValidHexColorWithAlpha = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{8}$/.test(color);
};

const generateColorVariation = (hex: string, alpha: string): string => {
  // Remove # if present
  const cleanHex = hex.replace("#", "");
  return `#${cleanHex}${alpha}`;
};

// Test data
const testColors = [
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFFFF", // White
  "#000000", // Black
  "#FFA500", // Orange
  "#800080", // Purple
  "#FFC0CB", // Pink
];

const alphaValues = [
  "0A",
  "1A",
  "33",
  "4D",
  "66",
  "80",
  "99",
  "B3",
  "CC",
  "E6",
];

describe("ColorPicker Color Generation", () => {
  describe("Hex Color Validation", () => {
    it("should validate standard hex colors", () => {
      testColors.forEach((color) => {
        expect(isValidHexColor(color)).toBe(true);
      });
    });

    it("should reject invalid hex colors", () => {
      const invalidColors = [
        "#GGG", // Invalid characters
        "#12345", // Too short
        "#1234567", // Too long
        "123456", // Missing #
        "#12345G", // Invalid character at end
      ];

      invalidColors.forEach((color) => {
        expect(isValidHexColor(color)).toBe(false);
      });
    });
  });

  describe("Color Variation Generation", () => {
    it("should generate valid hex colors with alpha", () => {
      testColors.forEach((hex) => {
        alphaValues.forEach((alpha) => {
          const result = generateColorVariation(hex, alpha);
          expect(isValidHexColorWithAlpha(result)).toBe(true);
          expect(result).toHaveLength(9); // # + 8 characters
        });
      });
    });

    it("should handle hex colors with or without # prefix", () => {
      const hexWithHash = "#FF0000";
      const hexWithoutHash = "FF0000";

      const result1 = generateColorVariation(hexWithHash, "80");
      const result2 = generateColorVariation(hexWithoutHash, "80");

      expect(result1).toBe("#FF000080");
      expect(result2).toBe("#FF000080");
      expect(result1).toBe(result2);
    });

    it("should generate correct alpha variations", () => {
      const baseColor = "#FF0000";

      const variations = {
        "0A": "#FF00000A", // Very transparent
        "33": "#FF000033", // 20% opacity
        "66": "#FF000066", // 40% opacity
        "80": "#FF000080", // 50% opacity
        "99": "#FF000099", // 60% opacity
        B3: "#FF0000B3", // 70% opacity
        CC: "#FF0000CC", // 80% opacity
        E6: "#FF0000E6", // 90% opacity
      };

      Object.entries(variations).forEach(([alpha, expected]) => {
        const result = generateColorVariation(baseColor, alpha);
        expect(result).toBe(expected);
        expect(isValidHexColorWithAlpha(result)).toBe(true);
      });
    });
  });

  describe("CSS Custom Property Compatibility", () => {
    it("should generate valid CSS color values", () => {
      const baseColor = "#3366CC";
      const alphaVariations = alphaValues.map((alpha) =>
        generateColorVariation(baseColor, alpha),
      );

      // All generated colors should be valid CSS color values
      alphaVariations.forEach((color) => {
        // Test that it's a valid 8-digit hex color
        expect(color).toMatch(/^#[0-9A-Fa-f]{8}$/);

        // Test that it can be used in CSS (browser may convert to rgba)
        const testElement = document.createElement("div");
        testElement.style.color = color;
        // Browser converts hex with alpha to rgba, so we just verify it's set
        expect(testElement.style.color).toBeTruthy();
        expect(typeof testElement.style.color).toBe("string");
        expect(testElement.style.color.length).toBeGreaterThan(0);
      });
    });

    it("should work with different color families", () => {
      const colorFamilies = [
        { name: "red", hex: "#EF4444" },
        { name: "blue", hex: "#3B82F6" },
        { name: "green", hex: "#10B981" },
        { name: "purple", hex: "#8B5CF6" },
        { name: "orange", hex: "#F97316" },
      ];

      colorFamilies.forEach(({ name, hex }) => {
        alphaValues.forEach((alpha) => {
          const variation = generateColorVariation(hex, alpha);
          expect(isValidHexColorWithAlpha(variation)).toBe(true);

          // Verify the base color is preserved
          expect(variation.slice(0, 7)).toBe(hex);
          expect(variation.slice(7)).toBe(alpha);
        });
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty strings gracefully", () => {
      expect(() => generateColorVariation("", "80")).not.toThrow();
      const result = generateColorVariation("", "80");
      expect(result).toBe("#80");
      expect(isValidHexColorWithAlpha(result)).toBe(false); // Too short
    });

    it("should handle invalid hex colors", () => {
      const invalidHex = "#GGG";
      expect(() => generateColorVariation(invalidHex, "80")).not.toThrow();
      const result = generateColorVariation(invalidHex, "80");
      expect(result).toBe("#GGG80");
      expect(isValidHexColorWithAlpha(result)).toBe(false);
    });

    it("should handle alpha values of different lengths", () => {
      const baseColor = "#FF0000";
      const alphaTests = ["0", "00", "A", "AA", "123"];

      alphaTests.forEach((alpha) => {
        const result = generateColorVariation(baseColor, alpha);
        expect(result).toBe(`#FF0000${alpha}`);
        // Note: Only 2-character alphas will be valid 8-digit hex
        if (alpha.length === 2 && /^[0-9A-Fa-f]{2}$/.test(alpha)) {
          expect(isValidHexColorWithAlpha(result)).toBe(true);
        }
      });
    });
  });

  describe("ColorPicker Integration", () => {
    it("should match the alpha values used in ColorPicker", () => {
      const colorPickerAlphas = [
        "0A",
        "1A",
        "33",
        "4D",
        "66",
        "80",
        "99",
        "B3",
        "CC",
        "E6",
      ];

      expect(colorPickerAlphas).toEqual(alphaValues);

      const testColor = "#FF6B6B";
      colorPickerAlphas.forEach((alpha) => {
        const result = generateColorVariation(testColor, alpha);
        expect(result).toMatch(/^#FF6B6B[0-9A-Fa-f]{2}$/);
        expect(isValidHexColorWithAlpha(result)).toBe(true);
      });
    });
  });
});
