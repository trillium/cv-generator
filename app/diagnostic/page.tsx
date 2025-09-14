import { Suspense } from "react";
import DiagnosticView from "./DiagnosticView";

export default function DiagnosticPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Resume API Diagnostic Tool
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 mb-6">
            This page shows raw API responses from the multi-resume system to
            help diagnose issues.
          </p>

          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading diagnostic data...</span>
              </div>
            }
          >
            <DiagnosticView />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
