import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, XCircle, MessageSquare } from 'lucide-react';
import Button from './ui/Button';

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (status: CompletionStatus, notes?: string) => Promise<void>;
  taskTitle: string;
  isLoading?: boolean;
}

export type CompletionStatus = 'completed' | 'completed_with_issues' | 'failed';

const TaskCompletionModal = ({
  isOpen,
  onClose,
  onComplete,
  taskTitle,
  isLoading = false
}: TaskCompletionModalProps) => {
  const [selectedStatus, setSelectedStatus] = useState<CompletionStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [showNotesField, setShowNotesField] = useState(false);

  const statusOptions = [
    {
      value: 'completed' as CompletionStatus,
      label: 'Succesvol voltooid',
      description: 'De taak is zonder problemen afgerond',
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      hoverColor: 'hover:bg-green-100 dark:hover:bg-green-900/30'
    },
    {
      value: 'completed_with_issues' as CompletionStatus,
      label: 'Voltooid met problemen',
      description: 'De taak is voltooid maar er waren complicaties',
      icon: <AlertTriangle className="h-6 w-6" />,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      hoverColor: 'hover:bg-amber-100 dark:hover:bg-amber-900/30'
    },
    {
      value: 'failed' as CompletionStatus,
      label: 'Mislukt',
      description: 'De taak kon niet worden voltooid',
      icon: <XCircle className="h-6 w-6" />,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      hoverColor: 'hover:bg-red-100 dark:hover:bg-red-900/30'
    }
  ];

  const handleSubmit = async () => {
    if (!selectedStatus) return;

    try {
      await onComplete(selectedStatus, notes.trim() || undefined);
      handleClose();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleClose = () => {
    setSelectedStatus(null);
    setNotes('');
    setShowNotesField(false);
    onClose();
  };

  const handleStatusSelect = (status: CompletionStatus) => {
    setSelectedStatus(status);
    if (status === 'completed_with_issues' || status === 'failed') {
      setShowNotesField(true);
    } else {
      setShowNotesField(false);
      setNotes('');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Taak afronden
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                disabled={isLoading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Taak:</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {taskTitle}
              </p>
            </div>

            <div className="mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                Selecteer de status:
              </p>
              <div className="space-y-2 sm:space-y-3">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusSelect(option.value)}
                    disabled={isLoading}
                    className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all text-left touch-manipulation ${
                      selectedStatus === option.value
                        ? `${option.borderColor} ${option.bgColor}`
                        : `border-gray-200 dark:border-gray-700 ${option.hoverColor}`
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className={`${option.color} flex-shrink-0`}>
                        {option.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm sm:text-base font-medium ${option.color}`}>
                          {option.label}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                          {option.description}
                        </p>
                      </div>
                      {selectedStatus === option.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`rounded-full p-1 ${option.bgColor}`}
                        >
                          <CheckCircle className={`h-5 w-5 ${option.color}`} />
                        </motion.div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {showNotesField && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 sm:mb-6"
                >
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 inline mr-1" />
                    Notities {selectedStatus === 'failed' ? '(verplicht)' : '(optioneel)'}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      selectedStatus === 'completed_with_issues'
                        ? 'Beschrijf welke problemen zich voordeden...'
                        : 'Beschrijf waarom de taak niet kon worden voltooid...'
                    }
                    rows={4}
                    disabled={isLoading}
                    className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none disabled:opacity-50 touch-manipulation"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                isFullWidth
                disabled={isLoading}
                size="md"
              >
                Annuleren
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                isFullWidth
                isLoading={isLoading}
                disabled={!selectedStatus || (selectedStatus === 'failed' && !notes.trim())}
                size="md"
              >
                Bevestigen
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaskCompletionModal;
