"use client";

import React, { useState, useEffect, ReactNode } from "react";
import clsx from "clsx";
import {
  useYamlPathUpdater,
  getNestedValue,
} from "../../hooks/useYamlPathUpdater";
import { useFileManager } from "../../contexts/FileManagerContext";
import { useModal } from "../../contexts/ModalContext";
import ActionButtons from "./ActionButtons";
import EmptyFieldPlaceholder from "./EmptyFieldPlaceholder";
import EditModal from "./EditModal";
import { useArrayOperations } from "./useArrayOperations";
import { shouldShowAddButtons, isFieldEmpty } from "./editableFieldUtils";

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
  const { parsedData, error } = useFileManager();
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
  const hasLinkTag = (node: ReactNode): boolean => {
    return React.Children.toArray(node).some((child) => {
      if (React.isValidElement(child)) {
        if (child.type === "a") return true;
        if (child.props.children) return hasLinkTag(child.props.children);
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

  const handleSave = async (modalEditValue: string | string[]) => {
    const currentValue = Array.isArray(value)
      ? value.join("\n")
      : String(value || "");

    if (JSON.stringify(modalEditValue) !== JSON.stringify(currentValue)) {
      setIsSaving(true);
      try {
        let newValue: string | string[] = modalEditValue;

        // Handle different field types
        if (fieldType === "array" && typeof modalEditValue === "string") {
          newValue = modalEditValue
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        }

        await updateYamlPath(yamlPath, newValue);
        const stringValue = Array.isArray(newValue)
          ? newValue.join("\n")
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
    "relative inline-block group relative transition-all duration-200";

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

  // Highlight overlay div that sits on top of all content
  const HighlightOverlay = () => (
    <div className="absolute inset-0 group-hover:bg-blue-500/20 dark:group-hover:bg-blue-900/50 group-hover:shadow group-hover:shadow-blue-200/50 dark:group-hover:shadow-blue-700/50 group-hover:rounded active:bg-blue-100 dark:active:bg-blue-800/50 active:scale-[0.98] z-10 pointer-events-none top-0 right-0 left-0 bottom-0 rounded-lg bg-transparent print:group-hover:bg-transparent print:group-hover:shadow-transparent" />
  );

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
        <HighlightOverlay />
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
    </>
  );
}
