"use client";

import React from "react";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";

interface ActionButtonsProps {
  canShowAddButtons: boolean;
  onDelete: (e: React.MouseEvent) => void;
  onAddAbove: (e: React.MouseEvent) => void;
  onAddBelow: (e: React.MouseEvent) => void;
  onMoveUp: (e: React.MouseEvent) => void;
  onMoveDown: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
}

const buttonSizeClassses = "w-5 h-5";

export default function ActionButtons({
  canShowAddButtons,
  onDelete,
  onAddAbove,
  onAddBelow,
  onMoveUp,
  onMoveDown,
  onEdit,
}: ActionButtonsProps) {
  return (
    <div className="print:hidden">
      {/* Delete button on the left */}
      {canShowAddButtons && (
        <div className="absolute top-1/2 -left-5 transform -translate-y-1/2 z-10 print:hidden hidden group-hover:block">
          <button
            onClick={onDelete}
            className="bg-red-500 text-white text-xs px-1 py-0.5 rounded-full shadow-sm hover:bg-red-600 transition-colors"
            title="Delete this item"
          >
            <svg
              className={buttonSizeClassses}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Add above button - centered at top */}
      {canShowAddButtons && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10 print:hidden hidden group-hover:flex space-x-1">
          <button
            onClick={onMoveUp}
            className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full shadow-sm hover:bg-blue-600 transition-colors"
            title="Move up"
          >
            <FiChevronUp className={buttonSizeClassses} />
          </button>
          <button
            onClick={onAddAbove}
            className="bg-green-500 text-white text-xs px-1 py-0.5 rounded-full shadow-sm hover:bg-green-600 transition-colors"
            title="Add new item above"
          >
            <svg
              className={buttonSizeClassses}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Add below button - centered at bottom */}
      {canShowAddButtons && (
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 z-40 print:hidden hidden group-hover:flex space-x-1">
          <button
            onClick={onMoveDown}
            className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full shadow-sm hover:bg-blue-600 transition-colors"
            title="Move down"
          >
            <FiChevronDown className={buttonSizeClassses} />
          </button>
          <button
            onClick={onAddBelow}
            className="bg-green-500 text-white text-xs px-1 py-0.5 rounded-full shadow-sm hover:bg-green-600 transition-colors"
            title="Add new item below"
          >
            <svg
              className={buttonSizeClassses}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Edit button on the right */}
      <div className="absolute top-1/2 -right-5 transform -translate-y-1/2 z-10 print:hidden hidden group-hover:block">
        <button
          onClick={onEdit}
          className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full shadow-sm hover:bg-blue-600 transition-colors"
          title="Edit this field"
        >
          <svg
            className={buttonSizeClassses}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
