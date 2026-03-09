import { useState } from 'react';
import { X, Calendar, Clock, MapPin, FileText, Tag } from 'lucide-react';

export default function AddTimeBlockDialog({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'class',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    description: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const colorMap = {
      class: 'bg-blue-100 border-blue-300',
      activity: 'bg-green-100 border-green-300',
      study: 'bg-purple-100 border-purple-300',
      exam: 'bg-red-100 border-red-300',
      other: 'bg-gray-100 border-gray-300',
    };

    const newBlock = {
      id: Date.now().toString(),
      ...formData,
      color: colorMap[formData.type],
    };

    onAdd(newBlock);
    
    // Reset form
    setFormData({
      title: '',
      type: 'class',
      date: '',
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      description: '',
    });
    
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Add Time Block</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Title *
                </div>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mathematics 101"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Type *
                </div>
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="class">Class</option>
                <option value="activity">Activity</option>
                <option value="study">Study Session</option>
                <option value="exam">Exam</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date *
                </div>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                min={today}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Start Time *
                  </div>
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    End Time *
                  </div>
                </label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </div>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Room 204, Library"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Additional details about this time block"
              />
            </div>

            {/* Color Preview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              <div className={`p-3 rounded-lg border-l-4 ${
                formData.type === 'class' ? 'bg-blue-100 border-blue-300' :
                formData.type === 'activity' ? 'bg-green-100 border-green-300' :
                formData.type === 'study' ? 'bg-purple-100 border-purple-300' :
                formData.type === 'exam' ? 'bg-red-100 border-red-300' :
                'bg-gray-100 border-gray-300'
              }`}>
                <p className="font-medium text-sm">{formData.title || 'Your title here'}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {formData.startTime} - {formData.endTime}
                  {formData.location && ` • ${formData.location}`}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Time Block
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
