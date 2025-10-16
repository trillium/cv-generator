import * as React from "react";
import { useModal } from "@/contexts/ModalContext";

interface DeleteFileContentProps {
  selectedFile: string;
  onClose: () => void;
  onDelete: () => void;
}

const DeleteFileContent: React.FC<DeleteFileContentProps> = ({
  selectedFile,
  onClose,
  onDelete,
}) => {
  const { useAutoFocus } = useModal();
  const deleteButtonRef = useAutoFocus<HTMLButtonElement>();

  // Prevent deletion of the root "resumes" folder
  const isRootResumesFolder = selectedFile === "resumes";

  if (isRootResumesFolder) {
    return (
      <>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Cannot Delete Root Folder
        </h3>
        <p className="text-red-600 dark:text-red-400 mb-4">
          The root <strong>resumes</strong> folder cannot be deleted as it is
          the base directory for all resume files.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            ref={deleteButtonRef}
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Delete File
      </h3>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        Are you sure you want to delete <strong>{selectedFile}</strong>?
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        The file will be moved to the deleted/ folder.
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          ref={deleteButtonRef}
          onClick={onDelete}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </>
  );
};

export default DeleteFileContent;
