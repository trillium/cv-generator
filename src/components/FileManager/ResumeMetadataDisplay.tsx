"use client";

import { ResumeMetadata } from "../../types";
import { FiCalendar, FiBriefcase, FiFileText, FiEdit2 } from "react-icons/fi";

interface ResumeMetadataDisplayProps {
  metadata?: ResumeMetadata;
  onEdit?: () => void;
  showEditButton?: boolean;
}

export default function ResumeMetadataDisplay({
  metadata,
  onEdit,
  showEditButton = true,
}: ResumeMetadataDisplayProps) {
  const hasMetadata =
    metadata &&
    (metadata.targetCompany ||
      metadata.targetPosition ||
      metadata.applicationStatus ||
      metadata.notes ||
      (metadata.tailoredFor && metadata.tailoredFor.length > 0));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
      case "applied":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "interview":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "offer":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      case "withdrawn":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-2 mb-3 group/metadata relative">
      {showEditButton && onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute -top-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded opacity-0 group-hover/metadata:opacity-100 transition-opacity z-10"
          title="Edit metadata"
        >
          <FiEdit2 className="w-3 h-3" />
        </button>
      )}

      {!hasMetadata && showEditButton && onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          + Add metadata
        </button>
      )}
      {metadata?.targetCompany && (
        <div className="flex items-center gap-2">
          <FiBriefcase className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {metadata.targetCompany}
          </span>
          {metadata?.applicationStatus && (
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(metadata.applicationStatus)}`}
            >
              {metadata.applicationStatus}
            </span>
          )}
        </div>
      )}

      {metadata?.targetPosition && (
        <div className="flex items-center gap-2">
          <FiFileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {metadata.targetPosition}
          </span>
        </div>
      )}

      {metadata?.applicationDate && (
        <div className="flex items-center gap-2">
          <FiCalendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 dark:text-gray-500">
            Applied {new Date(metadata.applicationDate).toLocaleDateString()}
          </span>
        </div>
      )}

      {metadata?.tailoredFor && metadata.tailoredFor.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {metadata.tailoredFor.map((item, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.5 rounded text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            >
              {item}
            </span>
          ))}
        </div>
      )}

      {metadata?.notes && (
        <div className="text-xs text-gray-600 dark:text-gray-400 italic line-clamp-2 mt-2 pl-5">
          {metadata.notes}
        </div>
      )}
    </div>
  );
}
