import { useState, useEffect } from 'react';
import { BookOpen, Users, Calendar, MapPin, Clock } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { api } from '../../utils/api';

export default function MyClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      // For now, just show all classes - in a real app, filter by teacher
      const { classes } = await api.request('/admin/classes');
      setClasses(classes || []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your classes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              My Classes
            </h1>
            <p className="text-gray-600">
              Manage your assigned classes and view student enrollments
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Classes</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {classes.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {classes.reduce((sum, cls) => sum + (cls._count?.enrollments || 0), 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Classes</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {classes.filter(cls => cls.status === 'ACTIVE').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Classes List */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Your Classes</h2>
            </div>

            {classes.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">No classes assigned yet</p>
                <p className="text-sm">Contact your administrator to get assigned to classes</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {classes.map((cls) => (
                  <div key={cls.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {cls.name}
                        </h3>
                        <p className="text-sm text-gray-500">Code: {cls.code}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        cls.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : cls.status === 'INACTIVE'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {cls.status}
                      </span>
                    </div>

                    {cls.description && (
                      <p className="text-sm text-gray-600 mb-4">{cls.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {cls.schedule || 'No schedule set'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {cls.room || 'No room assigned'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        {cls._count?.enrollments || 0} {cls.capacity ? `/ ${cls.capacity}` : ''} students
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
