"use client";

import React, { ReactNode, cloneElement, isValidElement } from "react";

interface EmptyFieldPlaceholderProps {
  children: ReactNode;
  fieldType: "text" | "textarea" | "array" | "link";
  isEmpty: boolean;
  yamlPath: string;
  // For link fieldType
  linkData?: {
    text: string;
    url: string;
    icon?: ReactNode;
    textYamlPath: string;
    urlYamlPath: string;
    onSaveLink?: (text: string, url: string) => Promise<void>;
  };
}

export default function EmptyFieldPlaceholder({
  children,
  fieldType,
  isEmpty,
  yamlPath,
  linkData,
}: EmptyFieldPlaceholderProps) {
  // Generate specific placeholder messages for technical skills
  const getPlaceholderMessage = () => {
    if (fieldType === "link" || yamlPath.includes("links")) {
      return "Click to add a link";
    }
    if (yamlPath.includes("technical")) {
      if (yamlPath.includes(".category")) {
        return "Click to add Category";
      } else if (yamlPath.includes(".bubbles.")) {
        return "Click to add Skill";
      } else if (yamlPath.includes("bubbles") && !yamlPath.includes(".")) {
        return "Click to add Skills";
      } else if (
        yamlPath.includes("technical.") &&
        yamlPath.split(".").length === 2
      ) {
        return "Click to add technical skills section";
      }
    }
    return `Click to edit ${yamlPath} (not visible in print view)`;
  };

  // Function to check if content is blank or just spaces
  const isContentBlank = (content: any): boolean => {
    if (typeof content === "string") {
      return content.trim() === "";
    }
    if (Array.isArray(content)) {
      return (
        content.length === 0 || content.every((item) => isContentBlank(item))
      );
    }
    return content == null || content === "";
  };

  // Function to recursively replace blank content with placeholder
  const replaceBlankContent = (node: ReactNode): ReactNode => {
    if (!isValidElement(node)) {
      // If it's a text node or other non-element, check if it's blank
      if (typeof node === "string" && isContentBlank(node)) {
        return (
          <span className="text-gray-400 italic opacity-70 hover:opacity-90 transition-opacity block print:hidden">
            {getPlaceholderMessage()}
          </span>
        );
      }
      return node;
    }

    // Handle null children for empty arrays
    if (
      !isValidElement(node) &&
      node == null &&
      isEmpty &&
      (fieldType === "link" || yamlPath.includes("links"))
    ) {
      return (
        <span className="text-gray-400 italic opacity-70 hover:opacity-90 transition-opacity block print:hidden">
          {getPlaceholderMessage()}
        </span>
      );
    }

    // If it's a React element, check its children
    const element = node as React.ReactElement;
    const { children: elementChildren, ...props } = element.props;

    if (elementChildren == null) {
      return element;
    }

    // If children is a string and blank, replace it
    if (
      typeof elementChildren === "string" &&
      isContentBlank(elementChildren)
    ) {
      const newProps = { ...props };
      if (
        element.type === "a" &&
        (!newProps.href || newProps.href.trim() === "")
      ) {
        newProps.href = "#";
      }

      return cloneElement(
        element,
        newProps,
        <React.Fragment key={`placeholder-${yamlPath}`}>
          <span className="text-gray-400 italic opacity-70 hover:opacity-90 transition-opacity block print:hidden">
            {getPlaceholderMessage()}
          </span>
          <span className="text-gray-400 italic opacity-70 hover:opacity-90 transition-opacity print:inline-block hidden">
            {" "}
          </span>
        </React.Fragment>,
      );
    }

    // If children is an array, process each child
    if (Array.isArray(elementChildren)) {
      const processedChildren = elementChildren.map((child) =>
        replaceBlankContent(child),
      );
      return cloneElement(element, props, processedChildren);
    }

    // If children is a single React element, process it recursively
    if (isValidElement(elementChildren)) {
      const processedChild = replaceBlankContent(elementChildren);
      return cloneElement(element, props, processedChild);
    }

    // Otherwise, return as-is
    return element;
  };

  if (isEmpty) {
    // Replace blank content with placeholder while preserving wrapper and styling
    const processedChildren = replaceBlankContent(children);

    // Don't wrap in additional div to preserve click event bubbling
    return <>{processedChildren}</>;
  }

  return <>{children}</>;
}
