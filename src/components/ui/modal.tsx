"use client";

import React from "react";
import { clsx } from "clsx";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment } from "react";
import { useModal } from "../../contexts/ModalContext";

export default function Modal() {
  const { isOpen, content, size, closeModal } = useModal();

  const getSizeClasses = (size?: "sm" | "md" | "lg" | "xl") => {
    switch (size) {
      case "sm":
        return "sm:max-w-md";
      case "md":
        return "sm:max-w-lg";
      case "lg":
        return "sm:max-w-2xl";
      case "xl":
        return "sm:max-w-4xl";
      default:
        return "sm:max-w-lg";
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeModal}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="bg-opacity-75 fixed inset-0 bg-gray-500/75 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel
                className={clsx(
                  "border-primary-600 relative flex-grow transform overflow-hidden rounded-lg border bg-slate-100 px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:p-6",
                  getSizeClasses(size),
                )}
              >
                {content}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
