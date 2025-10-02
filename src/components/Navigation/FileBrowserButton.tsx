"use client";

import { useRouter } from "next/navigation";
import { FiFolder } from "react-icons/fi";

export default function FileBrowserButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/file-manager")}
      className="flex items-center gap-2 rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      title="Browse All Files"
    >
      <FiFolder className="w-4 h-4" />
      <span>Files</span>
    </button>
  );
}
