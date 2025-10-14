import { motion } from 'framer-motion';
import { CalendarEvent } from '../../types/calendar';
import { useState, useRef, useEffect } from 'react';
import { Clock, Plus } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface DayTimelineViewProps {
  events: CalendarEvent[];
  date: Date;
  onEventClick: (event: CalendarEvent) => void;
  onCreateTask?: (date: string, time: string) => void;
}

const DayTimelineView = ({ events, date, onEventClick, onCreateTask }: DayTimelineViewProps) => {
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dropTime, setDropTime] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const hours = Array.from({ length: 18 }, (_, i) => i + 6);
  const dateString = date.toISOString().split('T')[0];
  const dayEvents = events.filter(e => e.dueDate === dateString);

  const noTimeEvents = dayEvents.filter(e => !e.dueTime || e.dueTime === '00:00');
  const timedEvents = dayEvents.filter(e => e.dueTime && e.dueTime !== '00:00');

  const scrollToCurrentTime = () => {
    if (timelineRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      if (currentHour >= 6 && currentHour < 24) {
        const hourElement = timelineRef.current.querySelector(`[data-hour="${currentHour}"]`);
        if (hourElement) {
          hourElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(scrollToCurrentTime, 300);
    return () => clearTimeout(timer);
  }, [date]);

  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (hour: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const time = `${hour.toString().padStart(2, '0')}:00`;
    setDropTime(time);
  };

  const handleDrop = async (hour: number, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedEvent) return;

    const newTime = `${hour.toString().padStart(2, '0')}:00`;

    try {
      const todoRef = doc(db, 'todos', draggedEvent.id);
      await updateDoc(todoRef, {
        dueDate: dateString,
        dueTime: newTime
      });
    } catch (error) {
      console.error('Error updating task time:', error);
    }

    setDraggedEvent(null);
    setDropTime(null);
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
    setDropTime(null);
  };

  const getEventPosition = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return ((hours - 6) * 80) + (minutes / 60 * 80);
  };

  const isCurrentHour = (hour: number): boolean => {
    const now = new Date();
    return now.getHours() === hour &&
           now.toISOString().split('T')[0] === dateString;
  };

  const getCurrentTimePosition = (): number => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return ((hours - 6) * 80) + (minutes / 60 * 80);
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.completed) return 'bg-gray-400 dark:bg-gray-600 border-gray-500';
    if (event.status === 'overdue') return 'bg-gradient-to-r from-red-500 to-red-600 border-red-700';
    if (event.priority === 'high') return 'bg-gradient-to-r from-orange-500 to-red-500 border-orange-700';
    if (event.priority === 'medium') return 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-700';
    return 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-700';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {noTimeEvents.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Geen specifieke tijd</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {noTimeEvents.map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ scale: 1.02 }}
                className={`p-3 rounded-lg text-white cursor-pointer shadow-md ${getEventColor(event)}`}
                onClick={() => onEventClick(event)}
                draggable
                onDragStart={(e) => handleDragStart(event, e)}
                onDragEnd={handleDragEnd}
              >
                <h4 className="font-medium text-sm truncate">{event.title}</h4>
                <p className="text-xs opacity-90 truncate mt-1">{event.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div ref={timelineRef} className="relative h-[600px] overflow-y-auto">
        <div className="relative" style={{ height: `${hours.length * 80}px` }}>
          {hours.map((hour) => (
            <div
              key={hour}
              data-hour={hour}
              className={`absolute w-full h-20 border-t border-gray-200 dark:border-gray-700 ${
                isCurrentHour(hour) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
              }`}
              style={{ top: `${(hour - 6) * 80}px` }}
              onDragOver={(e) => handleDragOver(hour, e)}
              onDrop={(e) => handleDrop(hour, e)}
            >
              <div className="flex h-full">
                <div className="w-16 flex-shrink-0 pr-3 text-right">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </div>
                <div className="flex-1 relative">
                  {dropTime === `${hour.toString().padStart(2, '0')}:00` && draggedEvent && (
                    <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none" />
                  )}
                  {onCreateTask && (
                    <button
                      onClick={() => onCreateTask(dateString, `${hour.toString().padStart(2, '0')}:00`)}
                      className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 transition-opacity group"
                    >
                      <div className="flex items-center justify-center h-full bg-blue-50/80 dark:bg-blue-900/20 rounded-lg">
                        <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {timedEvents.map((event) => {
            const position = getEventPosition(event.dueTime);
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02, zIndex: 10 }}
                className={`absolute left-16 right-4 ml-4 rounded-lg shadow-lg cursor-move text-white ${getEventColor(event)} ${
                  event.completed ? 'opacity-60' : ''
                }`}
                style={{
                  top: `${position}px`,
                  height: '72px'
                }}
                draggable
                onDragStart={(e) => handleDragStart(event, e)}
                onDragEnd={handleDragEnd}
                onClick={() => onEventClick(event)}
              >
                <div className="p-3 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm truncate flex-1">{event.title}</h4>
                      <span className="text-xs opacity-90 ml-2">{event.dueTime}</span>
                    </div>
                    <p className="text-xs opacity-90 line-clamp-1">{event.description}</p>
                  </div>
                  {event.assignedToName && (
                    <p className="text-xs opacity-75 truncate">{event.assignedToName}</p>
                  )}
                </div>
              </motion.div>
            );
          })}

          {date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute left-16 right-4 h-0.5 bg-red-500 z-20"
              style={{ top: `${getCurrentTimePosition()}px` }}
            >
              <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DayTimelineView;
