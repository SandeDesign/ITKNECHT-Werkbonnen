import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import Button from './ui/Button';
import { MessageSquare, X } from 'lucide-react';

interface TaskFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedbackText: string) => Promise<void>;
  isLoading?: boolean;
  taskDescription: string;
}

const TaskFeedbackModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false,
  taskDescription 
}: TaskFeedbackModalProps) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedbackText.trim()) {
      setError('Feedback is verplicht');
      return;
    }

    try {
      await onSubmit(feedbackText);
      setFeedbackText('');
      setError('');
      onClose();
    } catch (error) {
      setError('Er is een fout opgetreden bij het verzenden van feedback');
    }
  };

  const handleClose = () => {
    setFeedbackText('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-primary-600" />
                <span>Feedback geven over taak</span>
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                icon={<X className="h-4 w-4" />}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-error-600 text-sm bg-error-50 p-2 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taak
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                {taskDescription}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Jouw feedback *
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Beschrijf waarom de taak niet voltooid kon worden of geef andere feedback..."
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Annuleren
            </Button>
            <Button 
              type="submit"
              isLoading={isLoading}
              icon={<MessageSquare className="h-4 w-4" />}
            >
              Feedback verzenden
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default TaskFeedbackModal;