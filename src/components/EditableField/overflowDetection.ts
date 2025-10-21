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
  lastPageText: string | undefined,
  threshold: number = 0.1,
): OverflowDetectionResult {
  if (!lastPageText) {
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
  const normalizedLastPage = normalizeText(lastPageText);

  const fieldWords = normalizedField.split(" ").filter((w) => w.length > 0);
  const lastPageWords = new Set(
    normalizedLastPage.split(" ").filter((w) => w.length > 0),
  );

  if (fieldWords.length === 0) {
    return { shouldHighlight: false, matchPercentage: 0 };
  }

  const matchingWords = fieldWords.filter((word) => lastPageWords.has(word));
  const matchPercentage = matchingWords.length / fieldWords.length;

  return {
    shouldHighlight: matchPercentage >= threshold,
    matchPercentage,
  };
}
