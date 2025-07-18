import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Filter, Plus, X } from 'lucide-react';
import Button from '../ui/Button';
import { CalendarFilters as CalendarFiltersType } from '../../types/calendar';

interface MobileCalendarNavigationProps {
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
  onToday: () => void;
  onShowFilters: () => void;
  onAddTask: () => void;
  hasActiveFilters?: boolean;
  showFilters: boolean;
  filters: CalendarFiltersType;
  onFilterChange: (filters: CalendarFiltersType) => void;
  onClearFilters: () => void;
  users: Array<{ id: string; name: string }>;
}

const MobileCalendarNavigation = ({
  currentDate,
  onNavigate,
  onToday,
  onShowFilters,
  onAddTask,
  hasActiveFilters = false,
  showFilters,
  filters,
  onFilterChange,
  onClearFilters,
  users
}: MobileCalendarNavigationProps) => {
  const formatDate = () => {
    return currentDate.toLocaleDateString('nl-NL', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const statusOptions = [
    { value: 'overdue', label: 'Verlopen' },
    { value: 'due_today', label: 'Vandaag' },
    { value: 'upcoming', label: 'Binnenkort' },
    { value: 'completed', label: 'Voltooid' }
  ];

  const priorityOptions = [
    { value: 'high', label: 'Hoog' },
    { value: 'medium', label: 'Gemiddeld' },
    { value: 'low', label: 'Laag' }
  ];

  return (
    <div className="lg:hidden">
      {/* Main navigation bar */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mb-2">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm" 
            onClick={() => onNavigate('prev')}
            icon={<ChevronLeft className="h-4 w-4" />}
            className="min-w-[40px] w-10 p-0"
          />
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              Vandaag - {formatDate()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Dagweergave
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="min-w-[40px] w-10 p-0"
            onClick={() => onNavigate('next')}
            icon={<ChevronRight className="h-4 w-4" />}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onShowFilters}
            icon={<Filter className={`h-4 w-4 ${hasActiveFilters ? 'text-primary-600' : ''}`} />}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={onAddTask}
            icon={<Plus className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Filter Panel - only on mobile */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowFilters}
                icon={<X className="h-4 w-4" />}
              />
            </div>

            <div className="space-y-3">
              {/* Status filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Alle statussen</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee filter */}
              {users.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Toegewezen aan
                  </label>
                  <select
                    value={filters.assignee}
                    onChange={(e) => onFilterChange({ ...filters, assignee: e.target.value })}
                    className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">Alle gebruikers</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Priority filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prioriteit
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Alle prioriteiten</option>
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {hasActiveFilters ? 'Filters actief' : 'Geen filters actief'}
              </div>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                  icon={<X className="h-4 w-4" />}
                >
                  Wissen
                </Button>
              )}
            </div>
            
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onToday}
                icon={<Calendar className="h-4 w-4" />}
                isFullWidth
              >
                Vandaag
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MobileCalendarNavigation;