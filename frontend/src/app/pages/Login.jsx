import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LogIn, UserPlus, User, GraduationCap } from 'lucide-react';
import { api } from '../../utils/api';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await api.login(username, password);
        
        // Redirect based on user role
        if (response.user?.role === 'ADMIN') {
          navigate('/admin-provision');
        } else {
          navigate('/');
        }
      } else {
        const response = await api.register(username, password, role);
        
        // Redirect based on user role
        if (response.user?.role === 'ADMIN') {
          navigate('/admin-provision');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-600">
              {isLogin ? 'Login to your account' : 'Register as a new user'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>

            {/* Role Selection - Only show for registration */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Register as
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('STUDENT')}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                      role === 'STUDENT'
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <User className="w-8 h-8" />
                    <span className="font-medium">Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('TEACHER')}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                      role === 'TEACHER'
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <GraduationCap className="w-8 h-8" />
                    <span className="font-medium">Teacher</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {role === 'STUDENT' 
                    ? 'Access your personal timetable and activities'
                    : 'Manage your classes and student schedules'}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isLogin ? 'Logging in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  {isLogin ? 'Login' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setRole('STUDENT');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {isLogin
                ? "Don't have an account? Register"
                : 'Already have an account? Login'}
            </button>
          </div>

          {/* Admin Note */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              <strong>Note:</strong> Admin accounts must be created separately using the admin creation script.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}