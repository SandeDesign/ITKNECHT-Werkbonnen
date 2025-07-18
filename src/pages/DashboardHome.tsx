import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { motion } from 'framer-motion';
import { StatisticsService } from '../services/StatisticsService';
import WeeklyWorkOrders from '../components/dashboard/WeeklyWorkOrders';
import TodoList from '../components/dashboard/TodoList';
import DashboardNews from '../components/dashboard/DashboardNews';
import CalendarView from '../components/calendar/CalendarView';
import { Star, ThumbsUp, Calendar as CalendarIcon, Clock, TrendingUp, MapPin, Award, Plus, Contact, FileText } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CalendarEvent } from '../types/calendar';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';
import MyStatistics from './MyStatistics';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Goedemorgen';
  if (hour < 18) return 'Goedemiddag';
  return 'Goedeavond';
};

const DashboardHome = () => {
  const { user } = useAuth();
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [currentDate] = useState(new Date());
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const q = query(
      collection(db, 'todos'),
      where('assignedTo', '==', user.id),
      where('dueDate', '>=', today),
      where('dueDate', '<', tomorrow),
      orderBy('dueDate', 'asc'),
      orderBy('dueTime', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => {
        const todo = doc.data();
        const status = todo.completed ? 'completed' : 'pending';
        
        return {
          id: doc.id,
          title: todo.title,
          description: todo.description,
          dueDate: todo.dueDate,
          dueTime: todo.dueTime,
          status,
          assignedTo: todo.assignedTo,
          priority: 'medium',
          createdBy: todo.createdBy,
          createdAt: todo.createdAt,
          completed: todo.completed
        };
      });

      setTodayEvents(events);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-4">
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-800/20 border-primary-200 dark:border-primary-800 overflow-hidden h-auto">
          <CardContent className="p-4 relative">
            <motion.div 
              className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="absolute inset-0 bg-primary-500 opacity-10 rounded-full"></div>
            </motion.div>
            
            <motion.div 
              className="flex items-center justify-center space-x-2 mb-2"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative">
                <Star className="w-12 h-12 text-primary-500 fill-current" />
                <motion.div
                  className="absolute -top-1 -right-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <ThumbsUp className="w-6 h-6 text-primary-600" />
                </motion.div>
              </div>
            </motion.div>
            
            <motion.h2 
              className="text-xl font-bold text-gray-900 dark:text-white text-center mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {getGreeting()}, {user?.name}! 👋
            </motion.h2>
            
            <motion.p 
              className="text-center text-gray-600 dark:text-gray-300 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mt-2"
      >
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Link to="/dashboard/create">
            <Button
              variant="primary"
              size="sm"
              className="sm:h-auto sm:py-2 w-full text-xs sm:text-sm"
              isFullWidth
              icon={<Plus className="h-5 w-5" />}
            >
              <span className="hidden sm:inline">Werkbon aanmaken</span>
              <span className="sm:hidden">Werkbon</span>
            </Button>
          </Link>
          <Link to="/dashboard/contacts">
            <Button
              variant="outline"
              size="sm"
              className="sm:h-auto sm:py-2 w-full text-xs sm:text-sm"
              isFullWidth
              icon={<Contact className="h-5 w-5" />}
            >
              <span>Contacten</span>
            </Button>
          </Link>
          <Link to="/dashboard/calendar">
            <Button
              variant="outline"
              size="sm"
              className="sm:h-auto sm:py-2 w-full text-xs sm:text-sm"
              isFullWidth
              icon={<CalendarIcon className="h-5 w-5" />}
            >
              <span className="hidden sm:inline">Mijn agenda</span>
              <span className="sm:hidden">Agenda</span>
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* First Row: Statistics and Work Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Statistics Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary-600" />
                <span>Mijn Statistieken</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Deze Week</span>
                    <span className={`text-sm font-medium ${user?.totalHoursWorked ? (user.totalHoursWorked >= 36 ? 'text-success-600 dark:text-success-400' : user.totalHoursWorked >= 32 ? 'text-warning-600 dark:text-warning-400' : 'text-error-600 dark:text-error-400') : 'text-gray-500'}`}>
                      {user?.totalHoursWorked?.toFixed(1) || '0'} / 36 uur
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        user?.totalHoursWorked ? (user.totalHoursWorked >= 36 ? 'bg-success-500' : user.totalHoursWorked >= 32 ? 'bg-warning-500' : 'bg-error-500') : 'bg-gray-400'
                      }`}
                      style={{ width: `${Math.min(((user?.totalHoursWorked || 0) / 36) * 100, 100)}%` }}
                    />
                  </div>
                  {(user?.totalHoursWorked || 0) < 36 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Nog {(36 - (user?.totalHoursWorked || 0)).toFixed(1)} uur tot doel
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {user?.totalHoursWorked?.toFixed(0) || '0'}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Uren Gewerkt</div>
                  </div>
                  
                  <div className="text-center p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-success-600 dark:text-success-400">
                      {user?.totalWorkOrdersCompleted || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Werkbonnen</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Kilometers gereden:</span>
                    <span className="font-medium">{user?.totalKilometersDriven?.toFixed(0) || '0'} km</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600 dark:text-gray-400">Laatste werkbon:</span>
                    <span className="font-medium">{user?.lastWorkOrderDate ? new Date(user.lastWorkOrderDate).toLocaleDateString('nl-NL') : 'Geen'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Work Orders */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <WeeklyWorkOrders />
        </motion.div>
      </div>

      {/* Second Row: Calendar and Todo List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-primary-600" />
                <span>Vandaag - {currentDate.toLocaleDateString('nl-NL', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="min-h-[300px]">
                <CalendarView
                  events={todayEvents}
                  currentDate={currentDate}
                  onNavigate={() => {}}
                  onToday={() => {}}
                  onEventClick={() => {}}
                  onDateClick={() => {}}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Tasks */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          data-tutorial="todo-section"
        >
          <TodoList enableAgendaView={false} />
        </motion.div>
      </div>

      {/* News and Updates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        data-tutorial="news-section"
      >
        <DashboardNews />
      </motion.div>
    </div>
  );
};

export default DashboardHome;