"use client";

import { useState, useEffect } from "react";
import { useDirectoryManager } from "@/contexts/DirectoryManager/DirectoryManagerContext.hook";
import { useModal } from "@/contexts/ModalContext";
import { getPdfUrl, isPdfGenerating, hasPdfError } from "./utils";
import PdfPreview from "./PdfPreview";

export default function Thumbnail() {
  const { currentDirectory, documentType, pdfJobs, storedPdfMetadata } =
    useDirectoryManager();
  const { openModal } = useModal();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
  }, [currentDirectory, documentType]);

  if (!documentType) return null;

  const pdfUrl = getPdfUrl(currentDirectory, documentType);
  const isGenerating = isPdfGenerating(pdfJobs, documentType);
  const hasError = hasPdfError(storedPdfMetadata, documentType);

  const handleClick = () => {
    if (pdfUrl && !isGenerating) {
      openModal(<PdfPreview pdfUrl={pdfUrl} />, "xl");
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const getBorderColor = () => {
    if (isGenerating) return "border-yellow-500";
    if (isLoading && !isGenerating) return "border-purple-500";
    if (hasError) return "border-red-500";
    return "border-green-500";
  };

  const getStatusLabel = () => {
    if (isGenerating) return "Generating";
    if (isLoading && !isGenerating) return "Loading";
    return null;
  };

  return (
    <button
      className={`pdf-badge-preview relative rounded border-2 hover:border-blue-500 transition-colors overflow-hidden ${getBorderColor()}`}
      onClick={handleClick}
      type="button"
      disabled={isGenerating || !pdfUrl}
      title={
        isGenerating
          ? "PDF generating..."
          : hasError
            ? "PDF has errors"
            : "Preview PDF"
      }
      style={{ width: "60px", height: "80px" }}
    >
      {isGenerating ? (
        <div className="flex items-center justify-center h-full bg-yellow-50">
          <span className="text-2xl">⏳</span>
        </div>
      ) : hasError ? (
        <div className="flex items-center justify-center h-full bg-red-50">
          <span className="text-2xl">⚠️</span>
        </div>
      ) : pdfUrl ? (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-purple-50 z-10">
              <span className="text-2xl">📥</span>
            </div>
          )}
          <iframe
            src={`${pdfUrl}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full pointer-events-none border-0"
            title="PDF Thumbnail"
            onLoad={handleIframeLoad}
            style={{
              transform: "scale(0.25)",
              transformOrigin: "top left",
              width: "400%",
              height: "400%",
            }}
          />
        </>
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <span className="text-2xl">?</span>
        </div>
      )}

      {getStatusLabel() && (
        <div
          className={`absolute bottom-0 left-0 right-0 text-white text-xs text-center py-0.5 ${
            isGenerating ? "bg-yellow-500" : "bg-purple-500"
          }`}
        >
          {getStatusLabel()}
        </div>
      )}
    </button>
  );
}
