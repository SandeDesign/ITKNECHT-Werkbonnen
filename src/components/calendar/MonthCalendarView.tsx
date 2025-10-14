import { motion, AnimatePresence } from 'framer-motion';
import { CalendarEvent } from '../../types/calendar';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface MonthCalendarViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onMonthChange?: (direction: 'prev' | 'next') => void;
  onDateClick?: (date: Date) => void;
}

const MonthCalendarView = ({ events, currentDate, onEventClick, onMonthChange, onDateClick }: MonthCalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);

    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);

    const days = [];
    const currentDay = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  };

  const monthDays = getMonthDays();
  const dayNames = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(e => e.dueDate === dateString);
  };

  const getEventCountByStatus = (dayEvents: CalendarEvent[]) => {
    return {
      overdue: dayEvents.filter(e => e.status === 'overdue' && !e.completed).length,
      completed: dayEvents.filter(e => e.completed).length,
      pending: dayEvents.filter(e => !e.completed && e.status !== 'overdue').length,
    };
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

  const handleDateClickInternal = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  const closeSidebar = () => {
    setSelectedDate(null);
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.completed) return 'bg-gray-400 border-gray-500';
    if (event.status === 'overdue') return 'bg-red-500 border-red-600';
    if (event.priority === 'high') return 'bg-orange-500 border-orange-600';
    if (event.priority === 'medium') return 'bg-amber-500 border-amber-600';
    return 'bg-blue-500 border-blue-600';
  };

  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="flex gap-4">
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onMonthChange?.('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
          </h3>

          <button
            onClick={() => onMonthChange?.('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-7">
          {dayNames.map((name) => (
            <div
              key={name}
              className="p-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
            >
              {name}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const eventCounts = getEventCountByStatus(dayEvents);
            const isTodayDate = isToday(day);
            const isCurrentMonthDate = isCurrentMonth(day);
            const isHovered = hoveredDate?.toDateString() === day.toDateString();

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] border-b border-r border-gray-200 dark:border-gray-700 p-2 cursor-pointer transition-all ${
                  isTodayDate ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                } ${
                  !isCurrentMonthDate ? 'bg-gray-50 dark:bg-gray-900/50 opacity-50' : ''
                } ${
                  isHovered ? 'bg-gray-100 dark:bg-gray-700/50' : ''
                } hover:bg-gray-100 dark:hover:bg-gray-700/50`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(day, e)}
                onClick={() => handleDateClickInternal(day)}
                onMouseEnter={() => setHoveredDate(day)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                <div
                  className={`text-sm font-medium mb-1 ${
                    isTodayDate
                      ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center'
                      : isCurrentMonthDate
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {day.getDate()}
                </div>

                {dayEvents.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1 flex-wrap">
                      {eventCounts.overdue > 0 && (
                        <div className="w-2 h-2 rounded-full bg-red-500" title={`${eventCounts.overdue} verlopen`} />
                      )}
                      {eventCounts.pending > 0 && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" title={`${eventCounts.pending} lopend`} />
                      )}
                      {eventCounts.completed > 0 && (
                        <div className="w-2 h-2 rounded-full bg-gray-400" title={`${eventCounts.completed} voltooid`} />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {dayEvents.length} {dayEvents.length === 1 ? 'taak' : 'taken'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedDate.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <button
                onClick={closeSidebar}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[600px]">
              {selectedDateEvents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  Geen taken voor deze dag
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDateEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      draggable
                      onDragStart={(e) => handleDragStart(event, e)}
                      className={`p-3 rounded-lg cursor-move shadow-sm border-l-4 ${getEventColor(event)} ${
                        event.completed ? 'opacity-60' : ''
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      onClick={() => onEventClick(event)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-sm flex-1">{event.title}</h4>
                        {event.dueTime && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            {event.dueTime}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                        {event.description}
                      </p>
                      {event.assignedToName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {event.assignedToName}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonthCalendarView;
