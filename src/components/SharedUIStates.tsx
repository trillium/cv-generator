export function LoadingState({ message }: { message?: string }) {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 dark:border-primary-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">{message || 'Loading...'}</p>
      </div>
    </div>
  )
}

export function ErrorState({
  title = 'Error',
  message,
  path,
  buttonText,
  onButtonClickAction,
}: {
  title?: string
  message: string
  path?: string
  buttonText?: string
  onButtonClickAction?: () => void
}) {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-wrap">{message}</p>
        {path && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Path attempted:{' '}
            <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{path}</code>
          </p>
        )}
        {buttonText && (
          <button
            onClick={onButtonClickAction}
            className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
          >
            {buttonText}
          </button>
        )}
      </div>
    </div>
  )
}

export function EmptyState({
  title = 'No Data',
  message,
  icon = '⚠️',
}: {
  title?: string
  message: string
  icon?: string
}) {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">{icon}</div>
        <h1 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  )
}
