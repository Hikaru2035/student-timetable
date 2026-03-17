import { Clock, MapPin, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function CalendarView({ timeBlocks, onDelete }) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Ensure timeBlocks is always an array
  const blocks = timeBlocks || [];

  const timeToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  // Get the start of the current week (Monday)
  const getWeekStart = (offset = 0) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + (offset * 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  // Generate array of dates for the current week
  const getWeekDates = () => {
    const weekStart = getWeekStart(currentWeekOffset);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // Format date as YYYY-MM-DD
  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check if a date is today
  const isToday = (date) => {
    const today = new Date();
    return formatDateKey(date) === formatDateKey(today);
  };

  // Format date for display
  const formatDateDisplay = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      dayName: days[date.getDay()],
      dayNum: date.getDate(),
      month: months[date.getMonth()],
    };
  };

  // Get week range for header
  const getWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    if (start.getMonth() === end.getMonth()) {
      return `${months[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
    }
  };

  const timeSlots = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00'
  ];

  const getBlocksForDate = (date) => {
    const dateKey = formatDateKey(date);
    return blocks.filter(block => block.date === dateKey);
  };

  const calculateBlockPosition = (startTime, endTime) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const duration = endMinutes - startMinutes;

    const start = Math.max(startMinutes, 7 * 60);
    const end = Math.min(endMinutes, 21 * 60);

    const top = ((startMinutes - 7 * 60) / 60) * 4; // 4rem per hour
    const height = (duration / 60) * 4;

    return { top: `${top}rem`, height: `${height}rem` };
  };

  const getOverlappingBlocks = (blocks) => {
    return blocks.map((block, index) => {
      const startA = timeToMinutes(block.startTime);
      const endA = timeToMinutes(block.endTime);

      const overlaps = blocks.filter((b) => {
        if (b.id === block.id) return false;

        const startB = timeToMinutes(b.startTime);
        const endB = timeToMinutes(b.endTime);

        return startA < endB && endA > startB;
      });

      return {
        ...block,
        overlapCount: overlaps.length + 1,
        overlapIndex: index,
      };
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Week Navigation Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Previous Week</span>
          </button>

          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {getWeekRange()}
            </h2>
            {currentWeekOffset === 0 && (
              <p className="text-sm text-blue-600">Current Week</p>
            )}
          </div>

          <button
            onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <span className="text-sm">Next Week</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {currentWeekOffset !== 0 && (
          <div className="mt-3 text-center">
            <button
              onClick={() => setCurrentWeekOffset(0)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Return to Current Week
            </button>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
            <div className="p-4 text-sm font-medium text-gray-500">Time</div>
            {weekDates.map((date, index) => {
              const { dayName, dayNum, month } = formatDateDisplay(date);
              const today = isToday(date);

              return (
                <div
                  key={index}
                  className={`p-4 text-center border-l border-gray-200 ${today ? 'bg-blue-50' : ''
                    }`}
                >
                  <div className={`text-sm font-medium ${today ? 'text-blue-600' : 'text-gray-900'}`}>
                    {dayName}
                  </div>
                  <div className={`text-xs ${today ? 'text-blue-500' : 'text-gray-500'}`}>
                    {month} {dayNum}
                  </div>
                  {today && (
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                        Today
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time Grid */}
          <div className="grid grid-cols-8">
            {/* Time Labels */}
            <div>
              {timeSlots.map((time) => (
                <div key={time} className="h-16 p-2 text-sm text-gray-500 border-b border-gray-200">
                  {time}
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {weekDates.map((date, dayIndex) => {
              const dateBlocks = getBlocksForDate(date);
              const today = isToday(date);

              return (
                <div
                  key={dayIndex}
                  className={`relative overflow-hidden border-l border-gray-200 ${today ? 'bg-blue-50/30' : ''}`}
                >
                  {/* Time slot grid lines */}
                  {timeSlots.map((time) => (
                    <div
                      key={time}
                      className="h-16 border-b border-gray-200"
                    />
                  ))}

                  {/* Time blocks */}
                  {getOverlappingBlocks(dateBlocks).map((block) => {
                    const position = calculateBlockPosition(block.startTime, block.endTime);
                    return (
                      <div
                        key={block.id}
                        className={`absolute ${block.color} border-l-4 rounded-lg p-2 overflow-hidden group`}
                        style={{
                          ...calculateBlockPosition(block.startTime, block.endTime),
                          width: `${100 / block.overlapCount}%`,
                          left: `${(block.overlapIndex % block.overlapCount) * (100 / block.overlapCount)}%`
                        }}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 truncate">
                              {block.title}
                            </h4>
                            <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {block.startTime} - {block.endTime}
                              </span>
                            </div>
                            {block.location && (
                              <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{block.location}</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => onDelete(block.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                        {block.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {block.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}