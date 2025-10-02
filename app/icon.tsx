import { ImageResponse } from "next/og";
import { size, contentType } from "./icon.constants";

export default function Icon() {
  return new ImageResponse(<InlineStyles />, {
    ...size,
  });
}

// InlineStyles version:
const InlineStyles = () => (
  <div
    style={{
      fontSize: 20,
      backgroundColor: "black",
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
    }}
  >
    <span
      style={{
        fontWeight: 800,
        color: "#ef4444",
      }}
    >
      C
    </span>
    <span>V</span>
  </div>
);
