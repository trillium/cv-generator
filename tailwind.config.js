import { teal, purple, blue } from "tailwindcss/colors";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { ...teal, DEFAULT: teal[800] },
        secondary: bluspacere,
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "Avenir",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      lineHeight: {
        normal: "1.5",
      },
      fontWeight: {
        normal: "400",
      },
      printColorAdjust: ["exact"],
    },
  },
  plugins: [],
};
