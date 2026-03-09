import { Calendar, Settings, Home, LogOut, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = localStorage.getItem('currentUser');

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/admin', icon: Settings, label: 'Admin' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Calendar className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="font-semibold text-lg">Student Timetable</h1>
            <p className="text-xs text-gray-500">Reminder App</p>
          </div>
        </div>
      </div>

      {/* Current User */}
      <div className="p-4 border-b border-gray-200 bg-blue-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentUser}
            </p>
            <p className="text-xs text-gray-500">Student</p>
          </div>
        </div>
      </div>

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
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors border border-red-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>

      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          © 2026 Student Timetable App
        </p>
      </div>
    </div>
  );
}