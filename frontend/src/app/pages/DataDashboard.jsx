import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, Users, BookOpen, Calendar, Clock } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { api } from '../../utils/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DataDashboard() {
  const [stats, setStats] = useState(null);
  const [timeBlocksByType, setTimeBlocksByType] = useState([]);
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [enrollmentStats, setEnrollmentStats] = useState([]);
  const [activityTimeline, setActivityTimeline] = useState([]);
  const [studentActivity, setStudentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [statsRes, typeRes, registrationsRes, enrollmentRes, timelineRes, activityRes] = await Promise.all([
        api.request('/analytics/stats'),
        api.request('/analytics/timeblocks/by-type'),
        api.request('/analytics/users/registrations'),
        api.request('/analytics/classes/enrollment-stats'),
        api.request('/analytics/activity/timeline?days=30'),
        api.request('/analytics/students/activity-summary'),
      ]);

      setStats(statsRes.stats);
      setTimeBlocksByType(typeRes.data.map(item => ({
        name: item.type.charAt(0).toUpperCase() + item.type.slice(1),
        value: item._count.type,
      })));
      setUserRegistrations(registrationsRes.data);
      setEnrollmentStats(enrollmentRes.data);
      setActivityTimeline(timelineRes.data);
      setStudentActivity(activityRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
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
            <p className="text-gray-600">Loading analytics...</p>
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
              Data Analytics Dashboard
            </h1>
            <p className="text-gray-600">
              Overview of student activities, enrollments, and system usage
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Classes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalClasses || 0}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <BookOpen className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Activities</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalTimeBlocks || 0}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Activity className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Enrollments</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalEnrollments || 0}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Activity Types Pie Chart */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Activities by Type
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={timeBlocksByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {timeBlocksByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* User Registrations Line Chart */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                User Registrations Over Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="admins" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Activity Timeline (Last 30 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="class" stackId="a" fill="#3b82f6" />
                <Bar dataKey="activity" stackId="a" fill="#10b981" />
                <Bar dataKey="exam" stackId="a" fill="#ef4444" />
                <Bar dataKey="study" stackId="a" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Class Enrollment Stats */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Class Enrollment Status
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={enrollmentStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="code" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="enrolled" fill="#3b82f6" />
                  <Bar dataKey="available" fill="#d1d5db" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Active Students */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Most Active Students
              </h3>
              <div className="space-y-3">
                {studentActivity.map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">@{student.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {student.activities} activities
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.enrollments} enrollments
                      </p>
                    </div>
                  </div>
                ))}
                {studentActivity.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
