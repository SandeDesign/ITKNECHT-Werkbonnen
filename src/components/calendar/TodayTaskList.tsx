import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { CalendarEvent } from '../../types/calendar';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface TodayTaskListProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const TodayTaskList = ({ events, onEventClick }: TodayTaskListProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const todayTasks = events.filter(e => e.dueDate === today && !e.completed);
  const tomorrowTasks = events.filter(e => e.dueDate === tomorrow && !e.completed);
  const overdueTasks = events.filter(e => e.status === 'overdue' && !e.completed);

  const displayTasks = [...overdueTasks, ...todayTasks, ...tomorrowTasks].slice(0, 8);

  const handleToggleComplete = async (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const todoRef = doc(db, 'todos', event.id);
      await updateDoc(todoRef, {
        completed: !event.completed
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getTaskIcon = (event: CalendarEvent) => {
    if (event.status === 'overdue') return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (event.status === 'due_today') return <Clock className="h-4 w-4 text-amber-500" />;
    return <CheckCircle className="h-4 w-4 text-gray-400" />;
  };

  const getTaskStyles = (event: CalendarEvent) => {
    if (event.status === 'overdue') {
      return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20';
    }
    if (event.status === 'due_today') {
      return 'border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20';
    }
    return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20';
  };

  if (displayTasks.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Aankomende Taken
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {overdueTasks.length > 0 && <span className="text-red-600 dark:text-red-400 font-medium">{overdueTasks.length} verlopen</span>}
              {overdueTasks.length > 0 && (todayTasks.length > 0 || tomorrowTasks.length > 0) && <span> · </span>}
              {todayTasks.length > 0 && <span>{todayTasks.length} vandaag</span>}
              {todayTasks.length > 0 && tomorrowTasks.length > 0 && <span> · </span>}
              {tomorrowTasks.length > 0 && <span>{tomorrowTasks.length} morgen</span>}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isCollapsed ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </motion.div>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 space-y-2 max-h-[320px] overflow-y-auto">
              {displayTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${getTaskStyles(task)}`}
                  onClick={() => onEventClick(task)}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={(e) => handleToggleComplete(task, e)}
                      className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
                    >
                      {getTaskIcon(task)}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {task.title}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {task.dueTime}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                        {task.description}
                      </p>
                      {task.assignedToName && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {task.assignedToName}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TodayTaskList;
