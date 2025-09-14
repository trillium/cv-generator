"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface ModalState {
  isOpen: boolean;
  content: React.ReactNode | null;
  size?: "sm" | "md" | "lg" | "xl";
}

interface ModalContextValue {
  isOpen: boolean;
  content: React.ReactNode | null;
  size?: "sm" | "md" | "lg" | "xl";
  openModal: (
    content: React.ReactNode,
    size?: "sm" | "md" | "lg" | "xl",
  ) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    content: null,
    size: "md",
  });

  const openModal = useCallback(
    (content: React.ReactNode, size: "sm" | "md" | "lg" | "xl" = "md") => {
      setModal({
        isOpen: true,
        content,
        size,
      });
    },
    [],
  );

  const closeModal = useCallback(() => {
    setModal({
      isOpen: false,
      content: null,
      size: "md",
    });
  }, []);

  return (
    <ModalContext.Provider
      value={{
        isOpen: modal.isOpen,
        content: modal.content,
        size: modal.size,
        openModal,
        closeModal,
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
