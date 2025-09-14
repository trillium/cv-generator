"use client";

import React, { useState, useEffect, ReactNode } from "react";
import {
  useYamlPathUpdater,
  getNestedValue,
} from "../../hooks/useYamlPathUpdater";
import { useYamlData } from "../../contexts/ResumeContext";
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
  const [isHovered, setIsHovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { updateYamlPath } = useYamlPathUpdater();
  const { parsedData, error } = useYamlData();
  const { openModal, closeModal } = useModal();
  const { handleAddAbove, handleAddBelow, handleDelete } =
    useArrayOperations(yamlPath);

  const canShowAddButtons = shouldShowAddButtons(yamlPath, parsedData);
  const isEmpty = isFieldEmpty(value);

  // Safety check: if yamlPath is not provided, just render children without editing functionality
  if (!yamlPath || typeof yamlPath !== "string") {
    console.warn(
      "EditableField: yamlPath is required but was not provided or is invalid",
    );
    return <div className={className}>{children}</div>;
  }

  // Update edit value when the YAML data changes externally
  useEffect(() => {
    const currentValue = getNestedValue(parsedData, yamlPath);
    const stringValue = Array.isArray(currentValue)
      ? currentValue.join("\n")
      : String(currentValue || "");
    setEditValue(stringValue);
  }, [parsedData, yamlPath]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing && !error) {
      setIsEditing(true);
      openEditModal();
    }
  };

  const handleSave = async (modalEditValue: string) => {
    const currentValue = Array.isArray(value)
      ? value.join("\n")
      : String(value || "");

    if (modalEditValue !== currentValue) {
      setIsSaving(true);
      try {
        let newValue: any = modalEditValue.trim();

        // Handle different field types
        if (fieldType === "array") {
          newValue = modalEditValue
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        }

        await updateYamlPath(yamlPath, newValue);
        setEditValue(modalEditValue);
      } catch (error) {
        console.error("Error saving field:", yamlPath, error);
        // Revert to original value on error
        const originalValue = Array.isArray(value)
          ? value.join("\n")
          : String(value || "");
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

    openModal(<ModalContent />);
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
  const wrapperStyles = `
    relative inline-block
    transition-all duration-200
    ${!isEditing && !error ? "cursor-pointer" : ""}
    ${isHovered && !isEditing && !error ? "editable-hover" : ""}
    ${isEditing ? "editable-editing" : ""}
    ${className}
  `.trim();

  // Render view mode
  return (
    <div
      className={wrapperStyles}
      onClick={handleClick}
      onKeyDown={handleWrapperKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={!error ? 0 : -1}
      role="button"
      aria-label={`Edit ${yamlPath?.split(".").pop() || "field"}`}
      title={
        !error
          ? "Click to edit (or press Enter/Space)"
          : "Cannot edit: YAML has errors"
      }
    >
      <EmptyFieldPlaceholder
        fieldType={fieldType}
        isEmpty={isEmpty}
        yamlPath={yamlPath}
      >
        {children}
      </EmptyFieldPlaceholder>

      {/* Action buttons container */}
      {isHovered && !isEditing && !error && (
        <ActionButtons
          canShowAddButtons={canShowAddButtons}
          onDelete={handleDelete}
          onAddAbove={handleAddAbove}
          onAddBelow={handleAddBelow}
          onEdit={handleClick}
        />
      )}
    </div>
  );
}
