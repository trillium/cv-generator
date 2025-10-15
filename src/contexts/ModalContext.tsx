"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

interface ModalState {
  isOpen: boolean;
  content: React.ReactNode | null;
  size?: "sm" | "md" | "lg" | "xl";
  onClose?: () => void;
}

interface ModalContextValue {
  isOpen: boolean;
  content: React.ReactNode | null;
  size?: "sm" | "md" | "lg" | "xl";
  onClose?: () => void;
  openModal: (
    content: React.ReactNode,
    size?: "sm" | "md" | "lg" | "xl",
    onClose?: () => void,
  ) => void;
  closeModal: () => void;
  useAutoFocus: <T extends HTMLElement>() => React.RefObject<T>;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    content: null,
    size: "md",
    onClose: undefined,
  });

  const openModal = useCallback(
    (
      content: React.ReactNode,
      size: "sm" | "md" | "lg" | "xl" = "md",
      onClose?: () => void,
    ) => {
      setModal({
        isOpen: true,
        content,
        size,
        onClose,
      });
    },
    [],
  );

  const closeModal = useCallback(() => {
    setModal({
      isOpen: false,
      content: null,
      size: "md",
      onClose: undefined,
    });
  }, []);

  // Hook that modal content components can use to auto-focus an element
  const useAutoFocus = useCallback(<T extends HTMLElement>() => {
    const elementRef = useRef<T>(null);

    useEffect(() => {
      // Delay to ensure modal transition is complete and element is rendered
      const timer = setTimeout(() => {
        elementRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }, []);

    return elementRef;
  }, []);

  return (
    <ModalContext.Provider
      value={{
        isOpen: modal.isOpen,
        content: modal.content,
        size: modal.size,
        onClose: modal.onClose,
        openModal,
        closeModal,
        useAutoFocus,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
