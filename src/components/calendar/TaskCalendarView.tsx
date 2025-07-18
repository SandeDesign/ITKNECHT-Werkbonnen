import { useMemo } from 'react';
import { CalendarEvent } from '../../types/calendar';
import CalendarEventCard from './CalendarEventCard';

interface TaskCalendarViewProps {
  events: CalendarEvent[];
  date: string;
  compact?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
}

const TaskCalendarView = ({ events, date, compact = false, onEventClick }: TaskCalendarViewProps) => {
  const dayEvents = useMemo(() => {
    return events.filter(event => event.dueDate === date);
  }, [events, date]);

  console.log('TaskCalendarView: Rendering', dayEvents.length, 'events for date', date);

  if (dayEvents.length === 0) {
    return null;
  }

  if (compact) {
    const maxVisible = 2;
    const visibleEvents = dayEvents.slice(0, maxVisible);
    const remainingCount = dayEvents.length - maxVisible;

    return (
      <div className="space-y-1">
        {visibleEvents.map((event) => (
          <CalendarEventCard
            key={event.id}
            event={event}
            compact={true}
            onClick={() => onEventClick?.(event)}
          />
        ))}
        {remainingCount > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
            +{remainingCount} meer
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dayEvents.map((event) => (
        <CalendarEventCard
          key={event.id}
          event={event}
          compact={false}
          onClick={() => onEventClick?.(event)}
        />
      ))}
    </div>
  );
};

export default TaskCalendarView;