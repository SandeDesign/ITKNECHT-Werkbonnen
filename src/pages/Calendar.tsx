import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, Download } from 'lucide-react';
import CalendarView from '../components/calendar/CalendarView';
import CalendarFilters from '../components/calendar/CalendarFilters';
import MobileCalendarNavigation from '../components/calendar/MobileCalendarNavigation';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { CalendarEvent, CalendarFilters as CalendarFiltersType } from '../types/calendar';

const Calendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [filters, setFilters] = useState<CalendarFiltersType>({
    status: '',
    assignee: '',
    priority: ''
  });

  console.log('Calendar: Component mounted, user:', user?.id);

  // Fetch users for filter dropdown
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
      console.log('Calendar: Fetched', usersList.length, 'users');
    } catch (error) {
      console.error('Calendar: Error fetching users:', error);
    }
  }, [user?.role]);

  // Convert todo to calendar event
  const todoToCalendarEvent = useCallback((todo: any, userName?: string): CalendarEvent => {
    const now = new Date();
    const dueDateTime = new Date(`${todo.dueDate}T${todo.dueTime}`);
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
      dueTime: todo.dueTime,
      status,
      assignedTo: todo.assignedTo,
      assignedToName: userName,
      priority: 'medium', // Default priority since todos don't have priority
      createdBy: todo.createdBy,
      createdAt: todo.createdAt,
      completed: todo.completed
    };
  }, []);

  // Fetch todos and convert to calendar events
  const fetchEvents = useCallback(() => {
    if (!user?.id) return;
    
    try {
      setError(null);
      console.log('Calendar: Fetching events for user:', user.id, 'role:', user.role);
      
      const todosRef = collection(db, 'todos');
      let q;
      
      if (user.role === 'admin') {
        // Admins can see all todos
        q = query(todosRef, orderBy('dueDate', 'asc'), orderBy('dueTime', 'asc'));
      } else if (filters.assignee) {
        // If a specific assignee is selected
        q = query(
          todosRef,
          where('assignedTo', '==', filters.assignee),
          orderBy('dueDate', 'asc'),
          orderBy('dueTime', 'asc')
        );
      } else {
        // Regular users only see their own todos
        q = query(
          todosRef,
          where('assignedTo', '==', user.id),
          orderBy('dueDate', 'asc'),
          orderBy('dueTime', 'asc')
        );
      }

      // Set up real-time listener
      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('Calendar: Received', snapshot.docs.length, 'todos from Firestore');
        
        const todoData = snapshot.docs.map(doc => ({
          id: doc.id, 
          ...doc.data(),
          description: doc.data().description || doc.data().title // Handle both title and description fields
        }));

        // Convert todos to calendar events
        const calendarEvents = todoData.map(todo => {
          const userName = users.find(u => u.id === todo.assignedTo)?.name;
          return todoToCalendarEvent(todo, userName);
        });

        console.log('Calendar: Converted to', calendarEvents.length, 'calendar events');
        setEvents(calendarEvents);
        setIsLoading(false);
      }, (error) => {
        console.error('Calendar: Error in real-time listener:', error);
        setError('Failed to load calendar events');
        setIsLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Calendar: Error setting up events listener:', error);
      setError('Failed to load calendar events');
      setIsLoading(false);
      return () => {}; // Return no-op function on error
    }
  }, [user, users, todoToCalendarEvent]);

  // Re-fetch events when filters change
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

  // Filter events based on current filters
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

    console.log('Calendar: Filtered', events.length, 'events to', filtered.length, 'with filters:', filters);
    return filtered;
  }, [events, filters]);

  // Initialize data
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); 

  const handleFilterChange = (newFilters: CalendarFiltersType) => {
    setFilters(newFilters);
    console.log('Calendar: Filters changed to:', newFilters);
  };

  const clearFilters = () => {
    setFilters({ status: '', assignee: '', priority: '' });
    console.log('Calendar: Filters cleared');
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    console.log('Calendar: Event clicked:', event.id);
  };

  const handleDateClick = (date: string) => {
    console.log('Calendar: Date clicked:', date);
    // Could open quick task creation modal here
    // Set the selected date in the filter
    const newDate = new Date(date);
    setCurrentDate(newDate);
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    // Only day navigation since we only support day view
    if (direction === 'next') {
      newDate.setDate(currentDate.getDate() + 1);
    } else {
      newDate.setDate(currentDate.getDate() - 1);
    }
    setCurrentDate(newDate);
    console.log('Calendar: Navigated to:', newDate.toISOString());
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    console.log('Calendar: Navigated to today');
  };

  const exportToICS = () => {
    // Basic ICS export functionality
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
    
    console.log('Calendar: Exported', filteredEvents.length, 'events to ICS');
  };

  const hasActiveFilters = filters.status || filters.assignee || filters.priority;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-error-600 dark:text-error-500">
            <CalendarIcon className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">Fout bij laden</h3>
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile Navigation */}
      <MobileCalendarNavigation
        currentDate={currentDate}
        onNavigate={handleNavigation}
        onToday={() => {
          setCurrentDate(new Date());
          console.log('Calendar: Reset to today');
        }}
        onShowFilters={() => setShowFilters(!showFilters)}
        onAddTask={() => setShowAddForm(true)}
        hasActiveFilters={hasActiveFilters}
        showFilters={showFilters}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        users={users}
      />

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <CalendarView
          events={filteredEvents}
          currentDate={currentDate}
          onNavigate={handleNavigation}
          onToday={goToToday}
          onEventClick={handleEventClick}
          onDateClick={handleDateClick}
        />
      </motion.div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full"
          >
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{selectedEvent.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEvent(null)}
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Beschrijving:</span>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedEvent.description}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Datum & Tijd:</span>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(selectedEvent.dueDate).toLocaleDateString('nl-NL')} om {selectedEvent.dueTime}
                    </p>
                  </div>
                  {selectedEvent.assignedToName && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Toegewezen aan:</span>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedEvent.assignedToName}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      selectedEvent.status === 'overdue' ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400' :
                      selectedEvent.status === 'due_today' ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400' :
                      selectedEvent.status === 'completed' ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400' :
                      'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    }`}>
                      {selectedEvent.status === 'overdue' ? 'Verlopen' :
                       selectedEvent.status === 'due_today' ? 'Vandaag' :
                       selectedEvent.status === 'completed' ? 'Voltooid' : 'Binnenkort'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Calendar;