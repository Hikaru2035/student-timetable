import { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import CalendarView from '../components/CalendarView';
import AddTimeBlockDialog from '../components/AddTimeBlockDialog';
import { api } from '../../utils/api';

export default function Dashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeBlocks();
  }, []);

  const fetchTimeBlocks = async () => {
    try {
      const { timeBlocks } = await api.getTimeBlocks();
      setTimeBlocks(timeBlocks || []);
    } catch (error) {
      console.error('Failed to fetch time blocks:', error);
      setTimeBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeBlock = async (newBlock) => {
    try {
      const { timeBlock } = await api.createTimeBlock(newBlock);
      setTimeBlocks([...(timeBlocks || []), timeBlock]);
    } catch (error) {
      console.error('Failed to create time block:', error);
      alert('Failed to create time block. Please try again.');
    }
  };

  const handleDeleteTimeBlock = async (id) => {
    try {
      await api.deleteTimeBlock(id);
      setTimeBlocks((timeBlocks || []).filter((block) => block.id !== id));
    } catch (error) {
      console.error('Failed to delete time block:', error);
      alert('Failed to delete time block. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your timetable...</p>
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                  Weekly Timetable
                </h1>
                <p className="text-gray-600">
                  Manage your classes and activities
                </p>
              </div>
              <button
                onClick={() => setIsDialogOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Time Block
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Classes</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {timeBlocks?.filter((b) => b.type === 'class').length || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Activities</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {timeBlocks.filter((b) => b.type === 'activity').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Events</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {timeBlocks?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <CalendarView
            timeBlocks={timeBlocks}
            onDelete={handleDeleteTimeBlock}
          />
        </div>
      </div>

      <AddTimeBlockDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAdd={handleAddTimeBlock}
      />
    </div>
  );
}