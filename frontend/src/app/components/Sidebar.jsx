import { Calendar, Settings, Home, LogOut, User, BarChart3, Shield, BookOpen, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { user } = await api.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, []);

  // Different navigation based on role
  const getNavItems = () => {
    if (!currentUser) return [];

    console.log('User role:', currentUser.role); // Debug log
    
    if (currentUser.role === 'ADMIN') {
      return [
        { path: '/admin-provision', icon: Shield, label: 'Provision' },
        { path: '/data-dashboard', icon: BarChart3, label: 'Analytics' },
      ];
    }
    
    if (currentUser.role === 'TEACHER') {
      return [
        { path: '/dashboard', icon: Home, label: 'Dashboard' },
        { path: '/my-classes', icon: BookOpen, label: 'My Classes' },
        { path: '/admin', icon: Settings, label: 'Settings' },
      ];
    }
    
    // Student
    return [
      { path: '/dashboard', icon: Home, label: 'Dashboard' },
      { path: '/admin', icon: Settings, label: 'Settings' },
    ];
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    try {
      await api.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Navigate anyway
      navigate('/login');
    }
  };

  const getRoleDisplay = () => {
    if (!currentUser?.role) return 'Loading...';
    
    const roleMap = {
      'ADMIN': 'Administrator',
      'TEACHER': 'Teacher',
      'STUDENT': 'Student',
    };
    
    return roleMap[currentUser.role] || currentUser.role;
  };

  const brand = {
    title: currentUser?.role === 'ADMIN' ? 'Admin Portal' : 'Timetable App',
    subtitle: currentUser?.role === 'ADMIN' ? 'Management System' : 'Student & Teacher Portal',
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">
          {brand.title}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {brand.subtitle}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {currentUser?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentUser?.username || 'Loading...'}
            </p>
            <p className="text-xs text-gray-500">
              {getRoleDisplay()}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}