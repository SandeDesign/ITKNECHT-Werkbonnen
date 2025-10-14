import { motion } from 'framer-motion';
import { CalendarEvent } from '../../types/calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface WeekGridViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onWeekChange?: (direction: 'prev' | 'next') => void;
}

const WeekGridView = ({ events, currentDate, onEventClick, onDateClick, onWeekChange }: WeekGridViewProps) => {
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = currentDate.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(currentDate.getDate() - daysToSubtract);
    startOfWeek.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const dayNames = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(e => e.dueDate === dateString).sort((a, b) => {
      if (!a.dueTime) return 1;
      if (!b.dueTime) return -1;
      return a.dueTime.localeCompare(b.dueTime);
    });
  };

  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    e.dataTransfer.setData('eventId', event.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (date: Date, e: React.DragEvent) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('eventId');
    if (!eventId) return;

    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const newDateString = date.toISOString().split('T')[0];

    try {
      const todoRef = doc(db, 'todos', eventId);
      await updateDoc(todoRef, {
        dueDate: newDateString
      });
    } catch (error) {
      console.error('Error updating task date:', error);
    }
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.completed) return 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300';
    if (event.status === 'overdue') return 'bg-red-500 text-white';
    if (event.priority === 'high') return 'bg-orange-500 text-white';
    if (event.priority === 'medium') return 'bg-amber-500 text-white';
    return 'bg-blue-500 text-white';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onWeekChange?.('prev')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {weekDays[0].toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} - {weekDays[6].toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
        </h3>

        <button
          onClick={() => onWeekChange?.('next')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-7 divide-x divide-gray-200 dark:divide-gray-700">
        {weekDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[400px] ${isTodayDate ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(day, e)}
            >
              <div
                className={`p-3 text-center border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  isTodayDate ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                }`}
                onClick={() => onDateClick?.(day)}
              >
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {dayNames[index]}
                </div>
                <div
                  className={`text-lg font-semibold ${
                    isTodayDate
                      ? 'bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {day.getDate()}
                </div>
                {dayEvents.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {dayEvents.length} {dayEvents.length === 1 ? 'taak' : 'taken'}
                  </div>
                )}
              </div>

              <div className="p-2 space-y-1 overflow-y-auto max-h-[350px]">
                {dayEvents.slice(0, 6).map((event, eventIndex) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: eventIndex * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    draggable
                    onDragStart={(e) => handleDragStart(event, e)}
                    className={`p-2 rounded-md cursor-move shadow-sm hover:shadow-md transition-all ${getEventColor(event)} ${
                      event.completed ? 'opacity-60 line-through' : ''
                    }`}
                    onClick={() => onEventClick(event)}
                  >
                    <div className="text-xs font-medium truncate">
                      {event.dueTime && <span className="mr-1">{event.dueTime}</span>}
                      {event.title}
                    </div>
                  </motion.div>
                ))}
                {dayEvents.length > 6 && (
                  <div className="text-xs text-center text-gray-500 dark:text-gray-400 py-1">
                    +{dayEvents.length - 6} meer
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekGridView;
