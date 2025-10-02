"use client";

import React, { useState, useEffect, ReactNode } from "react";
import clsx from "clsx";
import {
  useLinkedInYamlUpdater,
  getNestedValue,
} from "../../hooks/useLinkedInYamlUpdater";
import { useLinkedInData } from "../../contexts/LinkedInContext";
import { useModal } from "../../contexts/ModalContext";
import EditModal from "../EditableField/EditModal";
import EmptyFieldPlaceholder from "../EditableField/EmptyFieldPlaceholder";
import { isFieldEmpty } from "../EditableField/editableFieldUtils";

interface LinkedInEditableFieldProps<T> {
  yamlPath: string;
  value: T;
  fieldType?: "text" | "textarea" | "array" | "link";
  children: ReactNode;
  className?: string;
}

export default function LinkedInEditableField<T extends string | string[]>({
  yamlPath,
  value,
  fieldType = "text",
  children,
  className = "",
}: LinkedInEditableFieldProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>(
    Array.isArray(value) ? value.join("\n") : String(value || ""),
  );
  const [isSaving, setIsSaving] = useState(false);

  const { updateYamlPath } = useLinkedInYamlUpdater();
  const { parsedData, error } = useLinkedInData();
  const { openModal, closeModal } = useModal();

  const isEmpty = isFieldEmpty(value);

  if (!yamlPath || typeof yamlPath !== "string") {
    console.warn(
      "LinkedInEditableField: yamlPath is required but was not provided",
    );
    return <div className={className}>{children}</div>;
  }

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

  const handleSave = async (modalEditValue: string | any[]) => {
    const currentValue = Array.isArray(value)
      ? value.join("\n")
      : String(value || "");

    if (JSON.stringify(modalEditValue) !== JSON.stringify(currentValue)) {
      setIsSaving(true);
      try {
        let newValue: any = modalEditValue;

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
        throw error;
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
        canShowAddButtons={false}
        parsedData={parsedData}
        isSaving={isSaving}
        value={value}
        onSave={handleSave}
        onCancel={handleCancel}
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

  const cursorClasses = "cursor-pointer";
  const baseLayoutClasses =
    "relative block group relative transition-all duration-200";

  const wrapperStyles = clsx(baseLayoutClasses, cursorClasses, className);

  const HighlightOverlay = () => (
    <div className="absolute inset-0 group-hover:bg-blue-500/20 dark:group-hover:bg-blue-900/50 group-hover:shadow group-hover:shadow-blue-200/50 dark:group-hover:shadow-blue-700/50 group-hover:rounded active:bg-blue-100 dark:active:bg-blue-800/50 active:scale-[0.98] z-10 pointer-events-none top-0 right-0 left-0 bottom-0 rounded-lg bg-transparent print:group-hover:bg-transparent print:group-hover:shadow-transparent" />
  );

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
        >
          {children}
        </EmptyFieldPlaceholder>
      </div>
    </>
  );
}
