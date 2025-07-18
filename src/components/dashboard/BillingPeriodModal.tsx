import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Calendar } from 'lucide-react';

const getCurrentWeekNumber = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
};

interface BillingPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startWeek: number, endWeek: number) => void;
  isLoading?: boolean;
}

const BillingPeriodModal = ({ isOpen, onClose, onConfirm, isLoading }: BillingPeriodModalProps) => {
  const currentWeek = getCurrentWeekNumber();
  const [startWeek, setStartWeek] = useState<number>(currentWeek - 4);
  const [endWeek, setEndWeek] = useState<number>(currentWeek);
  
  useEffect(() => {
    setStartWeek(currentWeek - 4);
    setEndWeek(currentWeek);
  }, [isOpen]);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startWeek || !endWeek) {
      setError('Beide weken zijn verplicht');
      return;
    }

    if (startWeek > endWeek) {
      setError('Startweek moet voor eindweek liggen');
      return;
    }

    onConfirm(startWeek, endWeek);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Selecteer Facturatie Periode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-error-600 text-sm bg-error-50 p-2 rounded">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Week
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={startWeek}
                    onChange={(e) => setStartWeek(parseInt(e.target.value))}
                    min="1"
                    max="53"
                    className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    required
                  />
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Eind Week
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={endWeek}
                    onChange={(e) => setEndWeek(parseInt(e.target.value))}
                    min="1"
                    max="53"
                    className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    required
                  />
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Annuleren
            </Button>
            <Button 
              type="submit"
              isLoading={isLoading}
            >
              Bevestigen
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default BillingPeriodModal;