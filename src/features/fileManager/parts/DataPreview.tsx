import * as React from "react";

interface DataPreviewProps {
  data: unknown;
}

const DataPreview: React.FC<DataPreviewProps> = ({ data }) => (
  <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
      Directory Data
    </h2>
    <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded text-xs overflow-auto max-h-96 text-gray-900 dark:text-gray-100">
      {JSON.stringify(data, null, 2)}
    </pre>
  </div>
);

export default DataPreview;
