"use client";

import React, { ReactNode } from "react";

interface EmptyFieldPlaceholderProps {
  children: ReactNode;
  fieldType: "text" | "textarea" | "array" | "link";
  isEmpty: boolean;
  yamlPath: string;
}

export default function EmptyFieldPlaceholder({
  children,
  fieldType,
  isEmpty,
  yamlPath,
}: EmptyFieldPlaceholderProps) {
  if (isEmpty) {
    return (
      <div>
        {children}
        {/* Empty field indicator */}
        <span className="text-gray-400 italic text-sm opacity-70 pointer-events-none print:hidden">
          "Click to edit {yamlPath} (not visible in print view)
        </span>
        {/* Minimum clickable area for empty fields */}
      </div>
    );
  }

  return <>{children}</>;
}
