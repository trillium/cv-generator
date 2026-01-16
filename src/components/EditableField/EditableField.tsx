"use client";

import React, { useState, useEffect, ReactNode } from "react";
import clsx from "clsx";
import { useYamlPathUpdater, getNestedValue } from "@/hooks/useYamlPathUpdater";
import { useDirectoryManager } from "@/contexts/DirectoryManager/DirectoryManagerContext.hook";
import { useModal } from "@/contexts/ModalContext";
import ActionButtons from "./ActionButtons";
import EmptyFieldPlaceholder from "./EmptyFieldPlaceholder";
import EditModal from "./EditModal";
import { useArrayOperations } from "./useArrayOperations";
import { shouldShowAddButtons, isFieldEmpty } from "./editableFieldUtils";
import { detectPageOverflow } from "./overflowDetection";

const HIGHLIGHT_CLASSES =
  "absolute inset-0 group-hover:bg-blue-500/20 " +
  "dark:group-hover:bg-blue-900/50 " +
  "group-hover:shadow group-hover:shadow-blue-200/50 " +
  "dark:group-hover:shadow-blue-700/50 " +
  "group-hover:rounded active:bg-blue-100 " +
  "dark:active:bg-blue-800/50 active:scale-[0.98] " +
  "z-10 pointer-events-none rounded-lg bg-transparent print:hidden";

const OVERFLOW_HIGHLIGHT_CLASSES =
  "absolute inset-0 group-hover:bg-orange-500/30 " +
  "dark:group-hover:bg-orange-700/40 " +
  "group-hover:shadow-orange-200/50 " +
  "dark:group-hover:shadow-orange-700/50 " +
  "rounded-lg z-20 pointer-events-none print:hidden";

const PAGE_BREAK_LINE_CLASSES =
  "absolute -top-1 left-0 right-0 h-[2px] bg-orange-500 " +
  "dark:bg-orange-400 shadow-lg shadow-orange-500/50 " +
  "z-30 pointer-events-none print:hidden";

interface EditableFieldProps<T> {
  yamlPath: string;
  value: T;
  fieldType?: "text" | "textarea" | "array" | "link";
  children: ReactNode;
  className?: string;
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

/**
 * Generic Higher-Order Component that wraps any content to make it editable
 * Provides inline editing with YAML path updates and CSS-only visual feedback
 */
export default function EditableField<T extends string | string[]>({
  yamlPath,
  value,
  fieldType = "text",
  children,
  className = "",
  linkData,
}: EditableFieldProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>(
    Array.isArray(value) ? value.join("\n") : String(value || ""),
  );
  const [isSaving, setIsSaving] = useState(false);

  const { updateYamlPath } = useYamlPathUpdater();
  const { parsedData, error, storedPdfMetadata, documentType } =
    useDirectoryManager();
  const { openModal, closeModal } = useModal();
  const {
    handleAddAbove,
    handleAddBelow,
    handleDelete,
    handleMoveUp,
    handleMoveDown,
  } = useArrayOperations(yamlPath);

  const canShowAddButtons = shouldShowAddButtons(yamlPath, parsedData);
  const isEmpty = isFieldEmpty(value);

  const pdfMeta =
    documentType === "resume"
      ? storedPdfMetadata?.pdf?.resume
      : storedPdfMetadata?.pdf?.coverLetter;

  const lastPageLines = pdfMeta?.lastPageLines;
  const pages = pdfMeta?.pages;

  const { shouldHighlight, isFirstOverflow } = detectPageOverflow(
    children,
    lastPageLines,
  );
  const hasOverflow = (pages ?? 0) > 1 && shouldHighlight;

  // Update edit value when the YAML data changes externally
  useEffect(() => {
    if (yamlPath && typeof yamlPath === "string") {
      const currentValue = getNestedValue(parsedData, yamlPath);
      const stringValue = Array.isArray(currentValue)
        ? currentValue.join("\n")
        : String(currentValue || "");
      setEditValue(stringValue);
    }
  }, [parsedData, yamlPath]);

  // Function to check if children contain a link tag
  function hasChildrenProp(props: unknown): props is { children: ReactNode } {
    return typeof props === "object" && props !== null && "children" in props;
  }

  const hasLinkTag = (node: ReactNode): boolean => {
    return React.Children.toArray(node).some((child) => {
      if (React.isValidElement(child)) {
        const el = child as React.ReactElement<
          unknown,
          string | React.JSXElementConstructor<unknown>
        >;
        if (el.type === "a") return true;
        if (hasChildrenProp(el.props) && el.props.children)
          return hasLinkTag(el.props.children);
      }
      return false;
    });
  };

  const containsLink = hasLinkTag(children);

  // Safety check: if yamlPath is not provided, just render children without editing functionality
  if (!yamlPath || typeof yamlPath !== "string") {
    console.warn(
      "EditableField: yamlPath is required but was not provided or is invalid",
    );
    return <div className={className}>{children}</div>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing && !error) {
      setIsEditing(true);
      openEditModal();
    }
  };

  const handleSave = async (modalEditValue: string | string[] | unknown[]) => {
    const currentValue = Array.isArray(value)
      ? value.join("\n")
      : String(value || "");

    if (JSON.stringify(modalEditValue) !== JSON.stringify(currentValue)) {
      setIsSaving(true);
      try {
        let newValue: string | string[] | unknown[] = modalEditValue;

        // Handle different field types
        if (fieldType === "array" && typeof modalEditValue === "string") {
          newValue = modalEditValue
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        }
        // For unknown[] (like link objects), pass through as-is

        await updateYamlPath(yamlPath, newValue);
        const stringValue = Array.isArray(newValue)
          ? Array.isArray(newValue[0]) ||
            (newValue.length > 0 && typeof newValue[0] === "object")
            ? JSON.stringify(newValue) // For object arrays like links
            : newValue.join("\n") // For string arrays
          : String(newValue || "");
        setEditValue(stringValue);
      } catch (error) {
        console.error("Error saving field:", yamlPath, error);
        // Revert to original value on error
        const revertValue = Array.isArray(value)
          ? value.join("\n")
          : String(value || "");
        setEditValue(revertValue);
        throw error; // Let the modal handle the error
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditing(false);
    closeModal();
  };

  const handleCancel = () => {
    const originalValue = Array.isArray(value)
      ? value.join("\n")
      : String(value || "");
    setEditValue(originalValue);
    setIsEditing(false);
    closeModal();
  };

  const openEditModal = () => {
    const ModalContent = () => (
      <EditModal
        editValue={editValue}
        fieldType={fieldType}
        yamlPath={yamlPath}
        canShowAddButtons={canShowAddButtons}
        parsedData={parsedData}
        isSaving={isSaving}
        value={value}
        onSave={handleSave}
        onCancel={handleCancel}
        linkData={linkData}
      />
    );

    openModal(<ModalContent />, "md", handleCancel);
  };

  const handleWrapperKeyDown = (e: React.KeyboardEvent) => {
    if (!isEditing && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      if (!error) {
        setIsEditing(true);
        openEditModal();
      }
    }
  };

  // Base styles with CSS-only visual feedback
  const cursorClasses = "cursor-pointer";
  const baseLayoutClasses =
    "relative inline-block group relative transition-all duration-200 print:static print:inline";

  const wrapperStyles = clsx(
    baseLayoutClasses,
    cursorClasses,
    {
      interactiveClasses: !isEditing && !error,
      editingStateClasses: isEditing,
      linkStylingClasses: containsLink,
    },
    className,
  );

  const HighlightOverlay = () => (
    <div
      className={clsx({
        [OVERFLOW_HIGHLIGHT_CLASSES]: hasOverflow,
        [HIGHLIGHT_CLASSES]: !hasOverflow,
      })}
      title={
        hasOverflow
          ? `Warning: This content appears on page ${pages}`
          : undefined
      }
    />
  );

  const PageBreakLine = () =>
    isFirstOverflow ? (
      <div
        className={clsx(PAGE_BREAK_LINE_CLASSES)}
        title="Page break - content below appears on page 2"
      />
    ) : null;

  // Render view mode
  return (
    <>
      <div
        className={wrapperStyles}
        onClick={handleClick}
        onKeyDown={handleWrapperKeyDown}
        tabIndex={!error ? 0 : -1}
        role="button"
        aria-label={`Edit ${yamlPath?.split(".").pop() || "field"}`}
        title={
          !error
            ? "Click to edit (or press Enter/Space)"
            : "Cannot edit: YAML has errors"
        }
      >
        <div className="hidden print:contents">{children}</div>
        <div className="print:hidden">
          <HighlightOverlay />
          <PageBreakLine />
          <EmptyFieldPlaceholder
            fieldType={fieldType}
            isEmpty={isEmpty}
            yamlPath={yamlPath}
            linkData={linkData}
          >
            {children}
          </EmptyFieldPlaceholder>

          {/* Action buttons container */}
          {!isEditing && !error && (
            <ActionButtons
              canShowAddButtons={canShowAddButtons}
              onDelete={handleDelete}
              onAddAbove={handleAddAbove}
              onAddBelow={handleAddBelow}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onEdit={handleClick}
            />
          )}
        </div>
      </div>
    </>
  );
}
