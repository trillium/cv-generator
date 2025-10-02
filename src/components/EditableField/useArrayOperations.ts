"use client";

import { useYamlPathUpdater } from "../../hooks/useYamlPathUpdater";
import { useFileManager } from "../../contexts/FileManagerContext";
import { findArrayInfo, createNewItemFromTemplate } from "./editableFieldUtils";

export function useArrayOperations(yamlPath: string) {
  const { updateYamlPath } = useYamlPathUpdater();
  const { parsedData } = useFileManager();

  const handleAddAbove = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const arrayInfo = findArrayInfo(yamlPath, parsedData);
    if (!arrayInfo) return;

    const { currentIndex, parentPath, parentValue } = arrayInfo;

    // Create a new item based on the existing item structure
    const currentItem = parentValue[currentIndex];
    const newItem = createNewItemFromTemplate(currentItem);

    // Insert the new item above the current one
    const updatedArray = [...parentValue];
    updatedArray.splice(currentIndex, 0, newItem);

    await updateYamlPath(parentPath, updatedArray);
  };

  const handleAddBelow = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const arrayInfo = findArrayInfo(yamlPath, parsedData);
    if (!arrayInfo) return;

    const { currentIndex, parentPath, parentValue } = arrayInfo;

    // Create a new item based on the existing item structure
    const currentItem = parentValue[currentIndex];
    const newItem = createNewItemFromTemplate(currentItem);

    // Insert the new item below the current one
    const updatedArray = [...parentValue];
    updatedArray.splice(currentIndex + 1, 0, newItem);

    await updateYamlPath(parentPath, updatedArray);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const arrayInfo = findArrayInfo(yamlPath, parsedData);
    if (!arrayInfo) return;

    const { currentIndex, parentPath, parentValue } = arrayInfo;

    // Remove the current item from the array
    const updatedArray = [...parentValue];
    updatedArray.splice(currentIndex, 1);

    await updateYamlPath(parentPath, updatedArray);
  };

  const handleMoveUp = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const arrayInfo = findArrayInfo(yamlPath, parsedData);
    if (!arrayInfo) return;

    const { currentIndex, parentPath, parentValue } = arrayInfo;

    if (currentIndex > 0) {
      // Swap with the previous item
      const updatedArray = [...parentValue];
      [updatedArray[currentIndex - 1], updatedArray[currentIndex]] = [
        updatedArray[currentIndex],
        updatedArray[currentIndex - 1],
      ];

      await updateYamlPath(parentPath, updatedArray);
    }
  };

  const handleMoveDown = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const arrayInfo = findArrayInfo(yamlPath, parsedData);
    if (!arrayInfo) return;

    const { currentIndex, parentPath, parentValue } = arrayInfo;

    if (currentIndex < parentValue.length - 1) {
      // Swap with the next item
      const updatedArray = [...parentValue];
      [updatedArray[currentIndex], updatedArray[currentIndex + 1]] = [
        updatedArray[currentIndex + 1],
        updatedArray[currentIndex],
      ];

      await updateYamlPath(parentPath, updatedArray);
    }
  };

  return {
    handleAddAbove,
    handleAddBelow,
    handleDelete,
    handleMoveUp,
    handleMoveDown,
  };
}
