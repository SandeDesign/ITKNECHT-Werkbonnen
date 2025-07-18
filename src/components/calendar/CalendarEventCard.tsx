import { motion } from 'framer-motion';
import { Clock, User, AlertTriangle, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';
import { CalendarEvent } from '../../types/calendar';

interface CalendarEventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: () => void;
}

const CalendarEventCard = ({ event, compact = false, onClick }: CalendarEventCardProps) => {
  const getStatusStyles = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'overdue':
        return {
          bg: 'bg-error-500 dark:bg-error-600',
          border: 'border-error-600 dark:border-error-700',
          text: 'text-white',
          icon: AlertTriangle
        };
      case 'due_today':
        return {
          bg: 'bg-warning-50 dark:bg-warning-900/20',
          border: 'border-warning-200 dark:border-warning-800',
          text: 'text-warning-700 dark:text-warning-400',
          icon: Clock
        };
      case 'completed':
        return {
          bg: 'bg-success-50 dark:bg-success-900/20',
          border: 'border-success-200 dark:border-success-800',
          text: 'text-success-700 dark:text-success-400',
          icon: CheckCircle
        };
      default:
        return {
          bg: 'bg-primary-50 dark:bg-primary-900/20',
          border: 'border-primary-200 dark:border-primary-800',
          text: 'text-primary-700 dark:text-primary-400',
          icon: CalendarIcon
        };
    }
  };

  const styles = getStatusStyles(event.status);
  const StatusIcon = styles.icon;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className={`p-2 rounded-md cursor-pointer transition-all ${styles.bg} ${styles.border} border`}
        onClick={onClick}
      >
        <div className="flex items-center space-x-2">
          <StatusIcon className={`h-3 w-3 ${styles.text} flex-shrink-0`} />
          <span className={`text-xs font-medium truncate ${styles.text}`}>
            {event.title}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {event.dueTime}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`p-4 rounded-lg cursor-pointer transition-all shadow-sm hover:shadow-md ${styles.bg} ${styles.border} border`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <StatusIcon className={`h-4 w-4 ${styles.text}`} />
          <h3 className={`font-medium text-sm ${styles.text}`}>
            {event.title}
          </h3>
        </div>
        {event.priority && (
          <span className={`px-2 py-1 text-xs rounded-full ${
            event.priority === 'high' ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400' :
            event.priority === 'medium' ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400' :
            'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
          }`}>
            {event.priority}
          </span>
        )}
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
        {event.description}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-3">
          <span className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {event.dueTime}
          </span>
          {event.assignedToName && (
            <span className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              {event.assignedToName}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CalendarEventCard;