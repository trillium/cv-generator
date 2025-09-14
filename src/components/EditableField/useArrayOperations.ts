"use client";

import { useYamlPathUpdater } from "../../hooks/useYamlPathUpdater";
import { useYamlData } from "../../contexts/ResumeContext";
import {
    findArrayInfo,
    createNewItemFromTemplate,
} from "./editableFieldUtils";

export function useArrayOperations(yamlPath: string) {
    const { updateYamlPath } = useYamlPathUpdater();
    const { parsedData } = useYamlData();

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

    return {
        handleAddAbove,
        handleAddBelow,
        handleDelete,
    };
}
