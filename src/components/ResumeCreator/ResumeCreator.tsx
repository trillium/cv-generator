import React, { useState } from "react";
import { useResumeContext } from "../../contexts/ResumeContext";

interface CreatedResume {
  fileName: string;
  position: string;
  company?: string;
}

interface ResumeCreatorProps {
  onClose: () => void;
  onResumeCreated: (resume: CreatedResume) => void;
}

const ResumeCreator: React.FC<ResumeCreatorProps> = ({
  onClose,
  onResumeCreated,
}) => {
  const { createNewResume, loading } = useResumeContext();

  // Form state
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!position.trim()) {
      setError("Position is required");
      return;
    }

    try {
      // Create basic template data
      const templateData = {
        info: {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          role: position.trim(),
        },
      };

      // Generate filename from position
      const fileName = `${position.trim().toLowerCase().replace(/\s+/g, "-")}.yml`;

      await createNewResume(fileName, templateData);

      // Call the callback with a simple object
      onResumeCreated({
        position: position.trim(),
        company: company.trim(),
        fileName,
      });

      onClose();

      // Reset form
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create resume");
    }
  };

  const resetForm = () => {
    setPosition("");
    setCompany("");
    setDescription("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-gray-900">
          Create New Resume
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Create a new resume file with a basic template
        </p>
      </div>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {/* Position */}
        <div>
          <label
            htmlFor="position"
            className="block text-sm font-medium text-gray-700"
          >
            Position <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="e.g., software-engineer, frontend-developer"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        {/* Company */}
        <div>
          <label
            htmlFor="company"
            className="block text-sm font-medium text-gray-700"
          >
            Company
          </label>
          <input
            type="text"
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name (optional)"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief description of this resume version"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Resume"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResumeCreator;
