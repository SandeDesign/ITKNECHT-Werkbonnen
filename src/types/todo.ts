export interface Todo {
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

export interface RecurringOptions {
  isRecurring: boolean;
  recurringType: 'daily' | 'weekly' | 'monthly' | 'on_completion';
  recurringInterval: number;
  recurringEndDate?: string;
}

export interface TaskFeedback {
  id: string;
  todoId: string;
  userId: string;
  userName: string;
  feedbackText: string;
  timestamp: string;
}