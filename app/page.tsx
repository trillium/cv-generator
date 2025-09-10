import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">CV Generator</h1>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-700 mb-3">
              Single Column
            </h2>
            <div className="space-y-2">
              <Link
                href="/single-column/resume"
                className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Resume
              </Link>
              <Link
                href="/single-column/cover-letter"
                className="block w-full text-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cover Letter
              </Link>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-700 mb-3">
              Two Column
            </h2>
            <div className="space-y-2">
              <Link
                href="/two-column/resume"
                className="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Resume
              </Link>
              <Link
                href="/two-column/cover-letter"
                className="block w-full text-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
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
