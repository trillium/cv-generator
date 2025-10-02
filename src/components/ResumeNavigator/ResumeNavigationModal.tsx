"use client";

import { useModal } from "../../contexts/ModalContext";
import ResumeNavigator from "../ResumeNavigator/ResumeNavigator";

interface ResumeNavigationModalProps {
  buttonText?: string;
  buttonClassName?: string;
  showNavigationActions?: boolean;
  onSelectResume?: (filePath: string) => void;
}

/**
 * A component that opens the ResumeNavigator in a modal with navigation capabilities
 * This is useful for adding navigation functionality to any page
 */
export default function ResumeNavigationModal({
  buttonText = "Browse Resumes",
  buttonClassName = "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors",
  showNavigationActions = true,
  onSelectResume,
}: ResumeNavigationModalProps) {
  const { openModal } = useModal();

  const openNavigator = () => {
    openModal(
      <ResumeNavigator
        onSelectResume={onSelectResume}
        showNavigationActions={showNavigationActions}
      />,
      "xl",
    );
  };

  return (
    <button onClick={openNavigator} className={buttonClassName}>
      {buttonText}
    </button>
  );
}
