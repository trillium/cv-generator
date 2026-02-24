import type { ValidationError } from '@/types/multiFileManager.types'

interface ValidationErrorsProps {
  errors: ValidationError[]
  directoryPath: string
}

export default function ValidationErrors({ errors, directoryPath }: ValidationErrorsProps) {
  if (!errors || errors.length === 0) {
    return null
  }

  const errorCount = errors.filter((e) => e.severity === 'error').length
  const warningCount = errors.filter((e) => e.severity === 'warning').length

  const formatSourceFile = (sourceFile: string | string[]): string => {
    if (Array.isArray(sourceFile)) {
      return sourceFile.map((f) => f.replace(/^pii\/resumes\//, '')).join(', ')
    }
    return sourceFile.replace(/^pii\/resumes\//, '')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-red-50 border-2 border-red-300 rounded-lg">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-red-800 mb-2">Data Validation Errors</h2>
        <p className="text-red-700">
          Found {errorCount} error{errorCount !== 1 ? 's' : ''}
          {warningCount > 0 && ` and ${warningCount} warning${warningCount !== 1 ? 's' : ''}`} in
          resume data for <code className="bg-red-200 px-1 rounded">{directoryPath}</code>
        </p>
        <p className="text-sm text-red-600 mt-2">
          Fix these issues in the source files to render the resume correctly.
        </p>
      </div>

      <div className="space-y-4">
        {errors.map((error, index) => (
          <div
            key={index}
            className={`p-4 rounded border-l-4 ${
              error.severity === 'error'
                ? 'bg-white border-red-500'
                : 'bg-yellow-50 border-yellow-500'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      error.severity === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {error.severity.toUpperCase()}
                  </span>
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {error.field}
                  </code>
                </div>
                <p className="text-gray-800 font-medium">{error.message}</p>
              </div>
            </div>

            <div className="mt-3 space-y-1 text-sm">
              <div className="flex gap-2">
                <span className="font-semibold text-gray-600">File:</span>
                <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">
                  {formatSourceFile(error.sourceFile)}
                </code>
              </div>

              {error.expected && (
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600">Expected:</span>
                  <code className="bg-green-100 px-2 py-0.5 rounded font-mono text-green-800">
                    {error.expected}
                  </code>
                </div>
              )}

              {error.actual && (
                <div className="flex gap-2">
                  <span className="font-semibold text-gray-600">Actual:</span>
                  <code className="bg-red-100 px-2 py-0.5 rounded font-mono text-red-800">
                    {error.actual}
                  </code>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-bold text-blue-900 mb-2">How to fix:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>Open the source file(s) listed above in your editor</li>
          <li>Check the field paths and compare the actual structure to the expected structure</li>
          <li>
            For arrays: ensure the field is formatted as <code>- item</code> (array), not{' '}
            <code>&quot;0&quot;: item</code> (object)
          </li>
          <li>For required fields: add any missing fields</li>
          <li>Save the file - the page will automatically reload</li>
        </ol>
      </div>
    </div>
  )
}
