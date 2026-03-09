import { useRouteError, Link } from 'react-router';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

export default function ErrorBoundary() {
  const error = useRouteError();

  console.error('Route error:', error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Oops! Something went wrong
        </h1>

        <p className="text-gray-600 text-center mb-6">
          We encountered an unexpected error. This could be due to a network issue or server problem.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-mono text-gray-700 break-words">
              {error.message || error.statusText || 'Unknown error'}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh Page
          </button>

          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
          </Link>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Troubleshooting tips:</strong>
          </p>
          <ul className="text-sm text-blue-800 mt-2 space-y-1">
            <li>• Check your internet connection</li>
            <li>• Make sure the backend server is running</li>
            <li>• Clear your browser cache and reload</li>
            <li>• Try logging out and logging back in</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
