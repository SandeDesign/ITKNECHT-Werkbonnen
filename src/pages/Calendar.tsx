import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Download, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { CalendarEvent, CalendarFilters as CalendarFiltersType } from '../types/calendar';
import TodayTaskList from '../components/calendar/TodayTaskList';
import DayTimelineView from '../components/calendar/DayTimelineView';
import WeekGridView from '../components/calendar/WeekGridView';
import MonthCalendarView from '../components/calendar/MonthCalendarView';
import CompactFilters from '../components/calendar/CompactFilters';
import { useCalendarPreferences, CalendarViewType } from '../hooks/useCalendarPreferences';
import TaskCompletionModal, { CompletionStatus } from '../components/TaskCompletionModal';
import { SupabaseNotificationService } from '../services/SupabaseNotificationService';

const Calendar = () => {
  const { user } = useAuth();
  const { preferences, savePreferences, isLoading: prefsLoading } = useCalendarPreferences();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewType>('day');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [filters, setFilters] = useState<CalendarFiltersType>({
    status: '',
    assignee: '',
    priority: ''
  });

  useEffect(() => {
    if (!prefsLoading && preferences.defaultView) {
      setViewMode(preferences.defaultView);
    }
  }, [prefsLoading, preferences.defaultView]);

  const fetchUsers = useCallback(async () => {
    if (user?.role !== 'admin') return;

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [user?.role]);

  const todoToCalendarEvent = useCallback((todo: any, userName?: string): CalendarEvent => {
    const now = new Date();
    const dueDateTime = new Date(`${todo.dueDate}T${todo.dueTime || '00:00'}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(todo.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    let status: CalendarEvent['status'] = 'upcoming';

    if (todo.completed) {
      status = 'completed';
    } else if (dueDateTime < now) {
      status = 'overdue';
    } else if (dueDate.getTime() === today.getTime()) {
      status = 'due_today';
    }

    return {
      id: todo.id,
      title: todo.description,
      description: todo.description,
      dueDate: todo.dueDate,
      dueTime: todo.dueTime || '00:00',
      status,
      assignedTo: todo.assignedTo,
      assignedToName: userName,
      priority: 'medium',
      createdBy: todo.createdBy,
      createdAt: todo.createdAt,
      completed: todo.completed
    };
  }, []);

  const fetchEvents = useCallback(() => {
    if (!user?.id) return;

    try {
      setError(null);

      const todosRef = collection(db, 'todos');
      let q;

      if (user.role === 'admin') {
        q = query(todosRef, orderBy('dueDate', 'asc'), orderBy('dueTime', 'asc'));
      } else if (filters.assignee) {
        q = query(
          todosRef,
          where('assignedTo', '==', filters.assignee),
          orderBy('dueDate', 'asc'),
          orderBy('dueTime', 'asc')
        );
      } else {
        q = query(
          todosRef,
          where('assignedTo', '==', user.id),
          orderBy('dueDate', 'asc'),
          orderBy('dueTime', 'asc')
        );
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const todoData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          description: doc.data().description || doc.data().title
        }));

        const calendarEvents = todoData.map(todo => {
          const userName = users.find(u => u.id === todo.assignedTo)?.name;
          return todoToCalendarEvent(todo, userName);
        });

        setEvents(calendarEvents);
        setIsLoading(false);
      }, (error) => {
        console.error('Error in real-time listener:', error);
        setError('Failed to load calendar events');
        setIsLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up events listener:', error);
      setError('Failed to load calendar events');
      setIsLoading(false);
      return () => {};
    }
  }, [user, users, todoToCalendarEvent, filters.assignee]);

  useEffect(() => {
    if (user?.id) {
      const unsubscribe = fetchEvents();
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [fetchEvents, filters]);

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    if (filters.status) {
      filtered = filtered.filter(event => event.status === filters.status);
    }

    if (filters.assignee) {
      filtered = filtered.filter(event => event.assignedTo === filters.assignee);
    }

    if (filters.priority) {
      filtered = filtered.filter(event => event.priority === filters.priority);
    }

    return filtered;
  }, [events, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); 

  const handleFilterChange = (newFilters: CalendarFiltersType) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({ status: '', assignee: '', priority: '' });
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleCompleteTask = async (status: CompletionStatus, notes?: string) => {
    if (!selectedEvent || !user) return;

    setIsCompleting(true);
    try {
      const completionData: any = {
        completed: true,
        completionStatus: status,
        completedAt: new Date().toISOString(),
        completedBy: user.id
      };

      if (notes) {
        completionData.completionNotes = notes;
      }

      const todoRef = doc(db, 'todos', selectedEvent.id);
      await updateDoc(todoRef, completionData);

      if (user.role !== 'admin') {
        try {
          const usersRef = collection(db, 'users');
          const adminQuery = query(usersRef, where('role', '==', 'admin'));
          const adminSnapshot = await getDocs(adminQuery);
          const adminIds = adminSnapshot.docs.map(doc => doc.id);

          if (adminIds.length > 0) {
            const statusLabel =
              status === 'completed' ? 'succesvol voltooid' :
              status === 'completed_with_issues' ? 'voltooid met problemen' :
              'mislukt';

            const notificationBody = notes
              ? `${user.name} heeft een taak ${statusLabel}: ${selectedEvent.title}\n\nNotities: ${notes}`
              : `${user.name} heeft een taak ${statusLabel}: ${selectedEvent.title}`;

            await SupabaseNotificationService.sendNotificationToAdminsWithPush(
              adminIds,
              'TASK_COMPLETED',
              `Taak ${statusLabel}`,
              notificationBody,
              {
                task_id: selectedEvent.id,
                completed_by: user.name,
                completed_by_id: user.id,
                task_description: selectedEvent.title,
                completion_status: status,
                completion_notes: notes
              },
              '/dashboard/taken'
            );
          }
        } catch (error) {
          console.error('Error sending completion notification:', error);
        }
      }

      setShowCompletionModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    } finally {
      setIsCompleting(false);
    }
  };

  const canCompleteTask = (event: CalendarEvent): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return event.assignedTo === user.id;
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }

    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleViewChange = (view: CalendarViewType) => {
    setViewMode(view);
    savePreferences({ defaultView: view });
  };

  const handleDateClick = (date: Date) => {
    setCurrentDate(date);
    if (viewMode !== 'day') {
      setViewMode('day');
      savePreferences({ defaultView: 'day' });
    }
  };

  const exportToICS = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//IT Knecht//Calendar//NL',
      ...filteredEvents.map(event => [
        'BEGIN:VEVENT',
        `UID:${event.id}@itknecht.nl`,
        `DTSTART:${event.dueDate.replace(/-/g, '')}T${event.dueTime.replace(':', '')}00`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description}`,
        `STATUS:${event.completed ? 'COMPLETED' : 'CONFIRMED'}`,
        'END:VEVENT'
      ]).flat(),
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'itknecht-calendar.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading || prefsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600 dark:text-red-500">
            <CalendarIcon className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">Fout bij laden</h3>
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <TodayTaskList events={filteredEvents} onEventClick={handleEventClick} />
      </motion.div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => handleViewChange('day')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'day'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Dag
              </button>
              <button
                onClick={() => handleViewChange('week')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => handleViewChange('month')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Maand
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              Vandaag
            </Button>

            <CompactFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              users={users}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={exportToICS}
              icon={<Download className="h-4 w-4" />}
            >
              Exporteren
            </Button>
          </div>
        </div>
      </div>

      <motion.div
        key={viewMode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {viewMode === 'day' && (
          <DayTimelineView
            events={filteredEvents}
            date={currentDate}
            onEventClick={handleEventClick}
          />
        )}

        {viewMode === 'week' && (
          <WeekGridView
            events={filteredEvents}
            currentDate={currentDate}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
            onWeekChange={handleNavigate}
          />
        )}

        {viewMode === 'month' && (
          <MonthCalendarView
            events={filteredEvents}
            currentDate={currentDate}
            onEventClick={handleEventClick}
            onMonthChange={handleNavigate}
            onDateClick={handleDateClick}
          />
        )}
      </motion.div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedEvent.title}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEvent(null)}
                  >
                    ×
                  </Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Beschrijving:</span>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {selectedEvent.description}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Datum & Tijd:</span>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      {new Date(selectedEvent.dueDate).toLocaleDateString('nl-NL')} om{' '}
                      {selectedEvent.dueTime}
                    </p>
                  </div>
                  {selectedEvent.assignedToName && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Toegewezen aan:</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {selectedEvent.assignedToName}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <span
                      className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        selectedEvent.status === 'overdue'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : selectedEvent.status === 'due_today'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : selectedEvent.status === 'completed'
                          ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}
                    >
                      {selectedEvent.status === 'overdue'
                        ? 'Verlopen'
                        : selectedEvent.status === 'due_today'
                        ? 'Vandaag'
                        : selectedEvent.status === 'completed'
                        ? 'Voltooid'
                        : 'Binnenkort'}
                    </span>
                  </div>

                  {!selectedEvent.completed && canCompleteTask(selectedEvent) && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="primary"
                        isFullWidth
                        onClick={() => setShowCompletionModal(true)}
                        icon={<CheckCircle2 className="h-5 w-5" />}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                      >
                        Taak Afronden
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      <TaskCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onComplete={handleCompleteTask}
        taskTitle={selectedEvent?.title || ''}
        isLoading={isCompleting}
      />
    </div>
  );
};

export default Calendar;