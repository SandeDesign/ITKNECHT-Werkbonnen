import { motion } from 'framer-motion';
import { X, Filter } from 'lucide-react';
import Button from '../ui/Button';
import { CalendarFilters as CalendarFiltersType } from '../../types/calendar';

interface CalendarFiltersProps {
  filters: CalendarFiltersType;
  onFilterChange: (filters: CalendarFiltersType) => void;
  onClearFilters: () => void;
  users?: Array<{ id: string; name: string }>;
  isVisible: boolean;
  onToggle: () => void;
}

const CalendarFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  users = [],
  isVisible,
  onToggle
}: CalendarFiltersProps) => {
  const hasActiveFilters = filters.status || filters.assignee || filters.priority;

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
    <div>
      {/* Filter toggle button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        icon={<Filter className={`h-4 w-4 ${hasActiveFilters ? 'text-primary-600' : ''}`} />}
      >
        Filters {hasActiveFilters && `(${Object.values(filters).filter(Boolean).length})`}
      </Button>

      {/* Filter panel */}
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="absolute top-full left-0 right-0 z-50 mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                icon={<X className="h-4 w-4" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CalendarFilters;