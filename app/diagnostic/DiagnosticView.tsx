"use client";

import { useState, useEffect } from "react";

/**
 * This document queries api/fs to get all the files within a dir.
 */

interface FileSystemResponse {
  success: boolean;
  directory: string;
  files: string[];
  error?: string;
}

function DiagnosticView() {
  const [data, setData] = useState<FileSystemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/fs", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const result: FileSystemResponse = await response.json();

        if (result.success) {
          setData(result);
          setError(null);
        } else {
          setError(result.error || "Failed to fetch files");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  if (loading) {
    return (
      <>
        <h2>File System Diagnostic</h2>
        <p>Loading...</p>
      </>
    );
  }

  if (error) {
    return (
      <>
        <h2>File System Diagnostic</h2>
        <p style={{ color: "red" }}>Error: {error}</p>
      </>
    );
  }

  return (
    <>
      <h2>File System Diagnostic</h2>
      <p>
        Directory: <strong>{data?.directory}</strong>
      </p>
      <p>
        Files found: <strong>{data?.files.length}</strong>
      </p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
}

export default DiagnosticView;
