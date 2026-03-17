import { createBrowserRouter, Navigate } from "react-router";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import AdminProvision from "./pages/AdminProvision";
import DataDashboard from "./pages/DataDashboard";
import MyClasses from "./pages/MyClasses";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRedirect from "./components/RoleRedirect";
import ErrorBoundary from "./components/ErrorBoundary";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <RoleRedirect />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <Admin />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/admin-provision",
    element: (
      <ProtectedRoute>
        <AdminProvision />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/data-dashboard",
    element: (
      <ProtectedRoute>
        <DataDashboard />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/my-classes",
    element: (
      <ProtectedRoute>
        <MyClasses />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "*",
    element: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">Page not found</p>
          <a
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    ),
  },
]);