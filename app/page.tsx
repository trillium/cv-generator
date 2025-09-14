import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          CV Generator
        </h1>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
              Single Column
            </h2>
            <div className="space-y-2">
              <Link
                href="/single-column/resume"
                className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                Resume
              </Link>
              <Link
                href="/single-column/cover-letter"
                className="block w-full text-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cover Letter
              </Link>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
              Two Column
            </h2>
            <div className="space-y-2">
              <Link
                href="/two-column/resume"
                className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
              >
                Resume
              </Link>
              <Link
                href="/two-column/cover-letter"
                className="block w-full text-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cover Letter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
