export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  status: 'overdue' | 'due_today' | 'upcoming' | 'completed';
  assignedTo: string;
  assignedToName?: string;
  priority?: 'low' | 'medium' | 'high';
  createdBy: string;
  createdAt: string;
  completed: boolean;
  isRecurring?: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly' | 'on_completion';
  recurringInterval?: number;
  recurringEndDate?: string;
  parentTodoId?: string;
}

export interface CalendarViewMode {
  mode: 'month' | 'week' | 'day';
}

export interface CalendarFilters {
  status: string;
  assignee: string;
  priority: string;
}