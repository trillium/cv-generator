import * as React from "react";

const PageHeader = ({
  currentDirectory,
}: {
  currentDirectory: string | null;
}) => (
  <div className="mb-6">
    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
      File Manager
    </h1>
    <p className="text-gray-600 dark:text-gray-400 mt-1">
      Path: {currentDirectory || "No directory loaded"}
    </p>
  </div>
);

export default PageHeader;
