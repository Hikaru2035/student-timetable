import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { api } from '../../utils/api';

export default function RoleRedirect() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { user } = await api.getCurrentUser();
        setUserRole(user.role);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect based on role
  if (userRole === 'ADMIN') {
    return <Navigate to="/admin-provision" replace />;
  }

  // Students and Teachers go to dashboard
  return <Navigate to="/dashboard" replace />;
}
