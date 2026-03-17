import { useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, Plus, Edit2, Trash2, UserCog } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { api } from '../../utils/api';

export default function AdminProvision() {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, classesRes] = await Promise.all([
        api.request('/admin/users'),
        api.request('/admin/classes'),
      ]);

      const users = usersRes.users || [];

      setStudents(users.filter(u => u.role === 'STUDENT'));
      setTeachers(users.filter(u => u.role === 'TEACHER'));
      setClasses(classesRes.classes || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      await api.request(`/admin/users/${id}`, { method: 'DELETE' });
      setStudents(students.filter(s => s.id !== id));
    } catch (error) {
      alert('Failed to delete student');
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;

    try {
      await api.request(`/admin/teachers/${id}`, { method: 'DELETE' });
      setTeachers(teachers.filter(t => t.id !== id));
    } catch (error) {
      alert('Failed to delete teacher');
    }
  };

  const handleDeleteClass = async (id) => {
    if (!confirm('Are you sure you want to delete this class?')) return;

    try {
      await api.request(`/admin/classes/${id}`, { method: 'DELETE' });
      setClasses(classes.filter(c => c.id !== id));
    } catch (error) {
      alert('Failed to delete class');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
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
              Admin Provision Dashboard
            </h1>
            <p className="text-gray-600">
              Manage students, teachers, and classes
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {students.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Teachers</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {teachers.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Classes</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {classes.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('students')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'students'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Students
              </button>
              <button
                onClick={() => setActiveTab('teachers')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'teachers'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <GraduationCap className="w-4 h-4 inline mr-2" />
                Teachers
              </button>
              <button
                onClick={() => setActiveTab('classes')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'classes'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                Classes
              </button>
            </div>

            <div className="p-6">
              {/* Students Tab */}
              {activeTab === 'students' && (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Username</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Role</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Activities</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Enrollments</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{student.username}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {student.personalInfo
                                ? `${student.personalInfo.firstName} ${student.personalInfo.lastName}`
                                : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {student.personalInfo?.email || 'N/A'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${student.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                                }`}>
                                {student.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{student._count.timeBlocks}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{student._count.enrollments}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDeleteStudent(student.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {students.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No students found
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Teachers Tab */}
              {activeTab === 'teachers' && (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Phone</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Role</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Department</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Subject</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Classes</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teachers.map((teacher) => (
                          <tr key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {teacher.personalInfo
                                ? `${teacher.personalInfo.firstName} ${teacher.personalInfo.lastName}`
                                : teacher.username}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{teacher.personalInfo?.email || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{teacher.personalInfo?.phone || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                {teacher.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{teacher.department || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{teacher.subject || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{teacher._count.classes}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDeleteTeacher(teacher.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {teachers.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No teachers found
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Classes Tab */}
              {activeTab === 'classes' && (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Code</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Teacher</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Schedule</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Room</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Capacity</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Enrolled</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map((cls) => (
                          <tr key={cls.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{cls.code}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{cls.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {cls.teacher
                                ? `${cls.teacher.firstName} ${cls.teacher.lastName}`
                                : 'Unassigned'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{cls.schedule || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{cls.room || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{cls.capacity || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{cls._count.enrollments}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${cls.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : cls.status === 'INACTIVE'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-blue-100 text-blue-800'
                                }`}>
                                {cls.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDeleteClass(cls.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {classes.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No classes found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
