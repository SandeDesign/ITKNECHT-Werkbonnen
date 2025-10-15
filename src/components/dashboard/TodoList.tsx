import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Plus, Trash2, Clock, MapPin, FileText, CheckCircle2, Circle, Calendar, Filter, X, ChevronLeft, ChevronRight, Edit2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SupabaseNotificationService } from '../../services/SupabaseNotificationService';
import { collection as firestoreCollection, query as firestoreQuery, where as firestoreWhere, getDocs as firestoreGetDocs } from 'firebase/firestore';
import TaskFeedbackModal from '../TaskFeedbackModal';
import TaskCompletionModal, { CompletionStatus } from '../TaskCompletionModal';

interface Todo {
  id: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  dueTime: string;
  completed: boolean;
  createdBy: string;
  createdAt: string;
  isRecurring?: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly' | 'on_completion';
  recurringInterval?: number;
  recurringEndDate?: string;
  parentTodoId?: string;
}

interface TodoListProps {
  showAll?: boolean;
  showAddForm?: boolean;
  filterByTechnician?: string;
  onShowAddFormChange?: (show: boolean) => void;
  enableAgendaView?: boolean;
}

const TodoList = ({ showAll = false, showAddForm: externalShowAddForm, onShowAddFormChange, filterByTechnician, enableAgendaView = true }: TodoListProps) => {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>(user?.id || '');
  const [internalShowAddForm, setInternalShowAddForm] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(enableAgendaView ? '' : '');
  const [viewMode, setViewMode] = useState<'agenda' | 'all'>(enableAgendaView ? 'agenda' : 'all');
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedTodoForFeedback, setSelectedTodoForFeedback] = useState<Todo | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedTodoForCompletion, setSelectedTodoForCompletion] = useState<Todo | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    description: '',
    assignedTo: '',
    dueDate: '',
    dueTime: '',
    isRecurring: false,
    recurringType: 'daily' as 'daily' | 'weekly' | 'monthly' | 'on_completion',
    recurringInterval: 1,
    recurringEndDate: ''
  });

  // Use external or internal state based on props
  const showAddForm = externalShowAddForm ?? internalShowAddForm;
  const setShowAddForm = onShowAddFormChange ?? setInternalShowAddForm;

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const userData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    
    // Fetch users if admin
    if (user?.role === 'admin') {
      fetchUsers();
    }
    
    // Set up real-time listener for todos
    try {
      const todosRef = collection(db, 'todos'); 
      let q;
      
      if (filterByTechnician) {
        q = query(
          todosRef,
          where('assignedTo', '==', filterByTechnician),
          orderBy('dueDate', 'asc'),
          orderBy('dueTime', 'asc')
        );
        } else if (selectedDate) {
        q = query(
          todosRef,
          where('dueDate', '==', selectedDate),
          orderBy('dueTime', 'asc')
        );
        } else if (showAll && user.role === 'admin') {
        // Show all todos when showAll is true and user is admin
        q = query(
          todosRef,
          orderBy('dueDate', 'asc'),
          orderBy('dueTime', 'asc')
        );
      } else if (user.role === 'admin') {
        if (selectedUser === 'all') {
          q = query(
            todosRef,
            orderBy('dueDate', 'asc'),
            orderBy('dueTime', 'asc')
          );
        } else if (selectedUser) {
          q = query(
            todosRef,
            where('assignedTo', '==', selectedUser),
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
      } else {
        q = query(
          todosRef,
          where('assignedTo', '==', user.id),
          orderBy('dueDate', 'asc'),
          orderBy('dueTime', 'asc')
        );
      }
      
      // Create real-time listener
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const todoData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Todo[];
        setTodos(todoData);
        console.log('TodoList: Fetched', todoData.length, 'todos');
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  }, [user, selectedUser, showAll, filterByTechnician, selectedDate]);

  // Update form data when editing a todo
  useEffect(() => {
    if (editingTodo) {
      setFormData({
        description: editingTodo.description,
        assignedTo: editingTodo.assignedTo,
        dueDate: editingTodo.dueDate,
        dueTime: editingTodo.dueTime,
        isRecurring: editingTodo.isRecurring || false,
        recurringType: editingTodo.recurringType || 'daily',
        recurringInterval: editingTodo.recurringInterval || 1,
        recurringEndDate: editingTodo.recurringEndDate || ''
      });
    } else {
      setFormData({
        description: '',
        assignedTo: '',
        dueDate: '',
        dueTime: '',
        isRecurring: false,
        recurringType: 'daily',
        recurringInterval: 1,
        recurringEndDate: ''
      });
    }
  }, [editingTodo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const timestamp = new Date().toISOString();

    try {
      const assignedTo = user.role === 'admin' ? formData.assignedTo : user.id;

      if (!assignedTo) {
        throw new Error('No valid assignee selected');
      }

      const todoData = {
        description: formData.description,
        assignedTo,
        dueDate: formData.dueDate,
        dueTime: formData.dueTime,
        completed: false,
        createdBy: user.id,
        createdAt: editingTodo ? editingTodo.createdAt : timestamp,
        ...(formData.isRecurring && {
          isRecurring: true,
          recurringType: formData.recurringType,
          recurringInterval: formData.recurringInterval,
          ...(formData.recurringEndDate && { recurringEndDate: formData.recurringEndDate })
        })
      };

      if (editingTodo) {
        // Update existing todo
        const todoRef = doc(db, 'todos', editingTodo.id);
        await updateDoc(todoRef, {
          ...todoData,
          updatedAt: timestamp
        });
      } else {
        // Create new todo
        const docRef = await addDoc(collection(db, 'todos'), todoData);

        // Create notification for assigned user if it's not self-assigned
        if (assignedTo !== user.id) {
          await SupabaseNotificationService.createNotification(
            assignedTo,
            'TASK_ASSIGNED',
            'Nieuwe taak toegewezen',
            `${user.name} heeft je een taak toegewezen: ${formData.description}`,
            {
              task_id: docRef.id,
              assigned_by: user.name,
              assigned_by_id: user.id,
              due_date: formData.dueDate,
              due_time: formData.dueTime
            },
            '/dashboard/taken'
          );
        }
      }

      setFormData({
        description: '',
        assignedTo: '',
        dueDate: '',
        dueTime: '',
        isRecurring: false,
        recurringType: 'daily',
        recurringInterval: 1,
        recurringEndDate: ''
      });
      setEditingTodo(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingTodo(null);
    setShowAddForm(false);
    setFormData({
      description: '',
      assignedTo: '',
      dueDate: '',
      dueTime: '',
      isRecurring: false,
      recurringType: 'daily',
      recurringInterval: 1,
      recurringEndDate: ''
    });
  };

  const handleFeedback = (todo: Todo) => {
    setSelectedTodoForFeedback(todo);
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = async (feedbackText: string) => {
    if (!selectedTodoForFeedback || !user) return;

    setIsFeedbackLoading(true);
    try {
      await addDoc(collection(db, 'taskFeedback'), {
        todoId: selectedTodoForFeedback.id,
        userId: user.id,
        userName: user.name,
        feedbackText,
        timestamp: new Date().toISOString()
      });

      setShowFeedbackModal(false);
      setSelectedTodoForFeedback(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  const createRecurringTask = async (completedTodo: Todo) => {
    if (!completedTodo.isRecurring || completedTodo.recurringType !== 'on_completion') {
      return;
    }

    try {
      const now = new Date();
      const newDueDate = now.toISOString().split('T')[0];
      const newDueTime = completedTodo.dueTime;

      const newTodoData = {
        description: `Herhaling: ${completedTodo.description}`,
        assignedTo: completedTodo.assignedTo,
        dueDate: newDueDate,
        dueTime: newDueTime,
        completed: false,
        createdBy: completedTodo.createdBy,
        createdAt: new Date().toISOString(),
        isRecurring: completedTodo.isRecurring,
        recurringType: completedTodo.recurringType,
        recurringInterval: completedTodo.recurringInterval,
        parentTodoId: completedTodo.id,
        ...(completedTodo.recurringEndDate && { recurringEndDate: completedTodo.recurringEndDate })
      };

      await addDoc(collection(db, 'todos'), newTodoData);
    } catch (error) {
      console.error('Error creating recurring task:', error);
    }
  };

  const toggleTodoStatus = async (todoId: string, completed: boolean) => {
    if (!completed) {
      const todo = todos.find(t => t.id === todoId);
      if (todo) {
        setSelectedTodoForCompletion(todo);
        setShowCompletionModal(true);
      }
    } else {
      try {
        const todoRef = doc(db, 'todos', todoId);
        await updateDoc(todoRef, { completed: false });
      } catch (error) {
        console.error('Error updating todo:', error);
      }
    }
  };

  const handleCompleteTask = async (status: CompletionStatus, notes?: string) => {
    if (!selectedTodoForCompletion || !user) return;

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

      const todoRef = doc(db, 'todos', selectedTodoForCompletion.id);
      await updateDoc(todoRef, completionData);

      if (user.role !== 'admin') {
        try {
          const usersRef = firestoreCollection(db, 'users');
          const adminQuery = firestoreQuery(usersRef, firestoreWhere('role', '==', 'admin'));
          const adminSnapshot = await firestoreGetDocs(adminQuery);
          const adminIds = adminSnapshot.docs.map(doc => doc.id);

          if (adminIds.length > 0) {
            const statusLabel =
              status === 'completed' ? 'succesvol voltooid' :
              status === 'completed_with_issues' ? 'voltooid met problemen' :
              'mislukt';

            const notificationBody = notes
              ? `${user.name} heeft een taak ${statusLabel}: ${selectedTodoForCompletion.description}\n\nNotities: ${notes}`
              : `${user.name} heeft een taak ${statusLabel}: ${selectedTodoForCompletion.description}`;

            await SupabaseNotificationService.sendNotificationToAdmins(
              adminIds,
              'TASK_COMPLETED',
              `Taak ${statusLabel}`,
              notificationBody,
              {
                task_id: selectedTodoForCompletion.id,
                completed_by: user.name,
                completed_by_id: user.id,
                task_description: selectedTodoForCompletion.description,
                completion_status: status,
                completion_notes: notes
              },
              '/dashboard/taken'
            );
            console.log(`✅ Notification sent to ${adminIds.length} admin(s)`);
          }
        } catch (error) {
          console.error('❌ Error sending completion notification:', error);
        }
      }

      if (selectedTodoForCompletion.isRecurring && selectedTodoForCompletion.recurringType === 'on_completion') {
        await createRecurringTask(selectedTodoForCompletion);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = async (todoId: string) => {
    if (!window.confirm('Weet je zeker dat je deze taak wilt verwijderen?')) {
      return;
    }
    
    try {
      const todoRef = doc(db, 'todos', todoId);
      await deleteDoc(todoRef);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  // Helper functions for date grouping
  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return dateString === todayDate;
  };

  const isTomorrow = (dateString: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = new Date(dateString);
    return date.toDateString() === tomorrow.toDateString();
  };

  const isThisWeek = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    
    return date >= startOfWeek && date <= endOfWeek && !isToday(dateString) && !isTomorrow(dateString);
  };

  const isNextWeek = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    const startOfNextWeek = new Date(today);
    startOfNextWeek.setDate(today.getDate() - today.getDay() + 8); // Next Monday
    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6); // Next Sunday
    
    return date >= startOfNextWeek && date <= endOfNextWeek;
  };

  const isOverdue = (dateString: string, timeString: string, completed: boolean) => {
    if (completed) return false;
    const now = new Date();
    const taskDateTime = new Date(`${dateString}T${timeString}`);
    return taskDateTime < now;
  };

  // Group todos by date categories
  const groupTodosByDate = (todos: Todo[]) => {
    const groups = {
      overdue: [] as Todo[],
      today: [] as Todo[],
      tomorrow: [] as Todo[],
      thisWeek: [] as Todo[],
      nextWeek: [] as Todo[],
      later: [] as Todo[]
    };

    todos.forEach(todo => {
      if (isOverdue(todo.dueDate, todo.dueTime, todo.completed)) {
        groups.overdue.push(todo);
      } else if (isToday(todo.dueDate)) {
        groups.today.push(todo);
      } else if (isTomorrow(todo.dueDate)) {
        groups.tomorrow.push(todo);
      } else if (isThisWeek(todo.dueDate)) {
        groups.thisWeek.push(todo);
      } else if (isNextWeek(todo.dueDate)) {
        groups.nextWeek.push(todo);
      } else {
        groups.later.push(todo);
      }
    });

    return groups;
  };

  // Filter todos based on selected date
  const getFilteredTodos = () => {
    if (selectedDate) {
      return todos.filter(todo => todo.dueDate === selectedDate); 
    }
    return todos;
  };

  const filteredTodos = getFilteredTodos();
  const groupedTodos = groupTodosByDate(filteredTodos);

  // Quick date navigation
  const getQuickDates = () => {
    const today = new Date();
    const dates = [];
    
    for (let i = -1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        label: i === -1 ? 'Gisteren' : 
               i === 0 ? 'Vandaag' : 
               i === 1 ? 'Morgen' : 
               date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
      });
    }
    
    return dates;
  };

  const quickDates = getQuickDates();

  const renderTodoGroup = (title: string, todos: Todo[], color: string, icon: React.ReactNode) => {
    if (todos.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className={`flex items-center space-x-2 mb-3 ${color}`}>
          {icon}
          <h3 className="font-medium text-sm uppercase tracking-wide">
            {title} ({todos.length})
          </h3>
        </div>
        <div className="space-y-2">
          {todos.map((todo) => (
            <motion.div
              key={todo.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                todo.completed
                  ? 'border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20'
                  : isOverdue(todo.dueDate, todo.dueTime, todo.completed)
                  ? 'border-error-600 dark:border-error-700 bg-error-500 dark:bg-error-600'
                  : 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20'
              }`}
            >
              <div className="flex items-center space-x-3 flex-1">
                <button
                  onClick={() => toggleTodoStatus(todo.id, todo.completed)}
                  className={`text-lg ${
                    todo.completed
                      ? 'text-success-600 dark:text-success-400'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {todo.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    todo.completed
                      ? 'text-gray-500 dark:text-gray-400 line-through'
                      : isOverdue(todo.dueDate, todo.dueTime, todo.completed)
                      ? 'text-white'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {todo.description}
                    {todo.isRecurring && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Herhalend
                      </span>
                    )}
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    <p className={`text-xs flex items-center ${
                      isOverdue(todo.dueDate, todo.dueTime, todo.completed)
                        ? 'text-white/80'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(todo.dueDate).toLocaleDateString('nl-NL', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </p>
                    <p className={`text-xs flex items-center ${
                      isOverdue(todo.dueDate, todo.dueTime, todo.completed)
                        ? 'text-white/80'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      <Clock className="h-3 w-3 mr-1" />
                      {todo.dueTime}
                    </p>
                    {user?.role === 'admin' && selectedUser === 'all' && (
                      <span className={`text-xs ${
                        isOverdue(todo.dueDate, todo.dueTime, todo.completed)
                          ? 'text-white/80'
                          : 'text-primary-600 dark:text-primary-400'
                      }`}>
                        • {users.find(u => u.id === todo.assignedTo)?.name || 'Unknown'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {/* Feedback button for all users */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFeedback(todo)}
                  icon={<MessageSquare className="h-4 w-4 text-blue-600" />}
                  title="Feedback geven"
                />
                {/* Edit button for admin */}
                {user?.role === 'admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(todo)}
                    icon={<Edit2 className="h-4 w-4 text-primary-600" />}
                    title="Bewerken"
                  />
                )}
                {/* Delete button for admin */}
                {user?.role === 'admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(todo.id)}
                    icon={<Trash2 className="h-4 w-4 text-error-600" />}
                    title="Verwijderen"
                  />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <Card>
      <CardContent>
        <div className="space-y-6">
          {/* Header with view toggle and date filter */}
          {enableAgendaView && (
            <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'agenda' ? 'primary' : 'outline'}
                  size="sm" 
                  onClick={() => setViewMode('agenda')}
                >
                  Agenda
                </Button>
                <Button
                  variant={viewMode === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('all')}
                >
                  Alle taken
                </Button>
              </div>
              
              {!showAll && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Nieuwe taak
                </Button>
              )}
            </div>

            {/* Date navigation */}
            {viewMode === 'agenda' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Input
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto"
                  />
                  {selectedDate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate('')}
                      icon={<X className="h-4 w-4" />}
                    >
                      Alle dagen
                    </Button>
                  )}
                </div>
                
                {/* Quick date buttons */}
                <div className="flex flex-wrap gap-2">
                  {quickDates.map((quickDate) => (
                    <Button 
                      key={quickDate.date}
                      variant={selectedDate === quickDate.date ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedDate(quickDate.date)}
                    >
                      {quickDate.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Simple header for non-agenda view */}
          {!enableAgendaView && !showAll && (
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddForm(true)}
                icon={<Plus className="h-4 w-4" />}
              >
                Nieuwe taak
              </Button>
            </div>
          )}

          {/* Add/Edit form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    {editingTodo ? 'Taak bewerken' : 'Nieuwe taak'}
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    icon={<X className="h-4 w-4" />}
                  />
                </div>

                <Input
                  label="Beschrijving"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user?.role === 'admin' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Toewijzen aan
                      </label>
                      <select
                        value={formData.assignedTo}
                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                        className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        required
                      >
                        <option value="">Selecteer gebruiker</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <Input
                    type="date"
                    label="Datum"
                    icon={<Calendar className="h-4 w-4" />}
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                  
                  <Input
                    type="time"
                    label="Tijd"
                    icon={<Clock className="h-4 w-4" />}
                    value={formData.dueTime}
                    onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                    required
                  />
                </div>

                {/* Recurring task options */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Herhalende taak
                    </label>
                  </div>

                  {formData.isRecurring && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Herhalingstype
                        </label>
                        <select
                          value={formData.recurringType}
                          onChange={(e) => setFormData({ ...formData, recurringType: e.target.value as any })}
                          className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="daily">Dagelijks</option>
                          <option value="weekly">Wekelijks</option>
                          <option value="monthly">Maandelijks</option>
                          <option value="on_completion">Bij voltooiing</option>
                        </select>
                      </div>

                      {formData.recurringType !== 'on_completion' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Interval
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={formData.recurringInterval}
                            onChange={(e) => setFormData({ ...formData, recurringInterval: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Einddatum (optioneel)
                        </label>
                        <input
                          type="date"
                          value={formData.recurringEndDate}
                          onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
                          className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button type="submit" isLoading={isLoading}>
                    {editingTodo ? 'Taak opslaan' : 'Taak toevoegen'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Annuleren
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Tasks display */}
          <div className="space-y-2">
            {filteredTodos.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {enableAgendaView && selectedDate ? (
                  <>
                    <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" /> 
                    <h3 className="text-lg font-medium mb-2">Geen taken voor deze datum</h3>
                    <p>Er zijn geen taken gepland voor {new Date(selectedDate).toLocaleDateString('nl-NL')}.</p>
                  </>
                ) : (
                  <>
                    <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <h3 className="text-base font-medium mb-2">Geen taken</h3>
                    <p>
                      {user?.role === 'admin' 
                        ? 'Klik op "Nieuwe taak" om een taak toe te voegen'
                        : 'Er zijn geen taken aan jou toegewezen'}
                    </p>
                  </>
                )}
              </div>
            ) : enableAgendaView && viewMode === 'agenda' && !selectedDate ? (
              // Grouped agenda view
              <div>
                {renderTodoGroup(
                  'Verlopen', 
                  groupedTodos.overdue, 
                  'text-error-600 dark:text-error-400',
                  <Clock className="h-4 w-4" />
                )}
                {renderTodoGroup(
                  'Vandaag', 
                  groupedTodos.today, 
                  'text-primary-600 dark:text-primary-400',
                  <Calendar className="h-4 w-4" />
                )}
                {renderTodoGroup(
                  'Morgen', 
                  groupedTodos.tomorrow, 
                  'text-blue-600 dark:text-blue-400',
                  <Calendar className="h-4 w-4" />
                )}
                {renderTodoGroup(
                  'Deze week', 
                  groupedTodos.thisWeek, 
                  'text-green-600 dark:text-green-400',
                  <Calendar className="h-4 w-4" />
                )}
                {renderTodoGroup(
                  'Volgende week', 
                  groupedTodos.nextWeek, 
                  'text-purple-600 dark:text-purple-400',
                  <Calendar className="h-4 w-4" />
                )}
                {renderTodoGroup(
                  'Later', 
                  groupedTodos.later, 
                  'text-gray-600 dark:text-gray-400',
                  <Calendar className="h-4 w-4" />
                )}
              </div>
            ) : (
              // Simple list view or filtered by date
              <div className="space-y-2">
                {filteredTodos.map((todo) => (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      todo.completed
                        ? 'border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20'
                        : isOverdue(todo.dueDate, todo.dueTime, todo.completed)
                        ? 'border-error-600 dark:border-error-700 bg-error-500 dark:bg-error-600'
                        : 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <button
                        onClick={() => toggleTodoStatus(todo.id, todo.completed)}
                        className={`text-lg ${
                          todo.completed
                            ? 'text-success-600 dark:text-success-400'
                            : 'text-gray-400 dark:text-gray-600'
                        }`}
                      >
                        {todo.completed ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          todo.completed
                            ? 'text-gray-500 dark:text-gray-400 line-through'
                            : isOverdue(todo.dueDate, todo.dueTime, todo.completed)
                            ? 'text-white'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {todo.description}
                          {todo.isRecurring && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Herhalend
                            </span>
                          )}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className={`text-xs flex items-center ${
                            isOverdue(todo.dueDate, todo.dueTime, todo.completed)
                              ? 'text-white/80'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(todo.dueDate).toLocaleDateString('nl-NL', { 
                              weekday: 'short', 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </p>
                          <p className={`text-xs flex items-center ${
                            isOverdue(todo.dueDate, todo.dueTime, todo.completed)
                              ? 'text-white/80'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {todo.dueTime}
                          </p>
                          {user?.role === 'admin' && selectedUser === 'all' && (
                            <span className={`text-xs ${
                              isOverdue(todo.dueDate, todo.dueTime, todo.completed)
                                ? 'text-white/80'
                                : 'text-primary-600 dark:text-primary-400'
                            }`}>
                              • {users.find(u => u.id === todo.assignedTo)?.name || 'Unknown'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {/* Feedback button for all users */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback(todo)}
                        icon={<MessageSquare className="h-4 w-4 text-blue-600" />}
                        title="Feedback geven"
                      />
                      {/* Edit button for admin */}
                      {user?.role === 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(todo)}
                          icon={<Edit2 className="h-4 w-4 text-primary-600" />}
                          title="Bewerken"
                        />
                      )}
                      {/* Delete button for admin */}
                      {user?.role === 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(todo.id)}
                          icon={<Trash2 className="h-4 w-4 text-error-600" />}
                          title="Verwijderen"
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Task Feedback Modal */}
        <TaskFeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedTodoForFeedback(null);
          }}
          onSubmit={handleFeedbackSubmit}
          isLoading={isFeedbackLoading}
          taskDescription={selectedTodoForFeedback?.description || ''}
        />

        {/* Task Completion Modal */}
        <TaskCompletionModal
          isOpen={showCompletionModal}
          onClose={() => {
            setShowCompletionModal(false);
            setSelectedTodoForCompletion(null);
          }}
          onComplete={handleCompleteTask}
          taskTitle={selectedTodoForCompletion?.description || ''}
          isLoading={isCompleting}
        />
      </CardContent>
    </Card>
  );
};

export default TodoList;