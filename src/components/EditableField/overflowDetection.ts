import { ReactNode } from "react";

export interface OverflowDetectionResult {
  shouldHighlight: boolean;
  matchPercentage: number;
}

function extractTextFromReactNode(node: ReactNode): string {
  if (typeof node === "string") {
    return node;
  }

  if (typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractTextFromReactNode).join(" ");
  }

  if (node && typeof node === "object" && "props" in node) {
    const element = node as { props?: { children?: ReactNode } };
    if (element.props?.children) {
      return extractTextFromReactNode(element.props.children);
    }
  }

  return "";
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function detectPageOverflow(
  fieldContent: string | ReactNode,
  lastPageLines: string[] | undefined,
): OverflowDetectionResult {
  if (!lastPageLines || lastPageLines.length === 0) {
    return { shouldHighlight: false, matchPercentage: 0 };
  }

  const fieldText =
    typeof fieldContent === "string"
      ? fieldContent
      : extractTextFromReactNode(fieldContent);

  if (!fieldText.trim()) {
    return { shouldHighlight: false, matchPercentage: 0 };
  }

  const normalizedField = normalizeText(fieldText);

  for (const line of lastPageLines) {
    const normalizedLine = normalizeText(line);

    if (normalizedLine.includes(normalizedField)) {
      return { shouldHighlight: true, matchPercentage: 1 };
    }

    if (
      normalizedField.includes(normalizedLine) &&
      normalizedLine.length > 20
    ) {
      return { shouldHighlight: true, matchPercentage: 0.9 };
    }
  }

  return { shouldHighlight: false, matchPercentage: 0 };
}
