import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Clock, Car } from 'lucide-react';
import { getDayOfWeek, getWeekNumber } from '../../utils/dateHelpers';

interface TravelDetailsModalProps {
  onSubmit: (details: {
    vertrekTijd: string;
    thuiskomstTijd: string;
    totalHours: number;
    kilometers: number;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
  workOrderDate: string;
  existingDetails?: {
    vertrekTijd?: string;
    thuiskomstTijd?: string;
    kilometers?: number;
  };
}

const TravelDetailsModal = ({ 
  onSubmit, 
  onCancel, 
  isLoading, 
  workOrderDate,
  existingDetails 
}: TravelDetailsModalProps) => {
  const [vertrekTijd, setVertrekTijd] = useState(existingDetails?.vertrekTijd || '');
  const [thuiskomstTijd, setThuiskomstTijd] = useState(existingDetails?.thuiskomstTijd || '');
  const [kilometers, setKilometers] = useState(existingDetails?.kilometers?.toString() || '');
  const [totalHours, setTotalHours] = useState(0);
  const [error, setError] = useState('');

  // Calculate day of week and week number from the work order date
  const dayOfWeek = workOrderDate ? getDayOfWeek(workOrderDate) : '';
  const weekNumber = workOrderDate ? getWeekNumber(workOrderDate) : 0;

  useEffect(() => {
    if (vertrekTijd && thuiskomstTijd) {
      const start = new Date(`2000-01-01T${vertrekTijd}`);
      const end = new Date(`2000-01-01T${thuiskomstTijd}`);
      let diff = Number((end.getTime() - start.getTime()) / (1000 * 60 * 60));
      // Handle case where end time is on the next day
      if (diff < 0) {
        diff += 24;
      }
      setTotalHours(diff);
    } else {
      setTotalHours(0);
    }
  }, [vertrekTijd, thuiskomstTijd]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vertrekTijd || !thuiskomstTijd || !kilometers) {
      setError('Alle velden zijn verplicht');
      return;
    }

    const kmNumber = parseFloat(kilometers);
    if (isNaN(kmNumber) || kmNumber <= 0) {
      setError('Voer een geldig aantal kilometers in');
      return;
    }

    onSubmit({
      vertrekTijd,
      thuiskomstTijd,
      totalHours,
      kilometers: kmNumber,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Reis Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-error-600 text-sm bg-error-50 p-2 rounded">
                {error}
              </div>
            )}
            
            {/* Display work order date info */}
            {workOrderDate && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Werkbon Datum: {new Date(workOrderDate).toLocaleDateString('nl-NL')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {dayOfWeek} • Week {weekNumber}
                </div>
              </div>
            )}
            
            <Input
              label="Vertrektijd"
              type="time"
              icon={<Clock size={18} />}
              value={vertrekTijd}
              onChange={(e) => setVertrekTijd(e.target.value)}
              required
            />

            <Input
              label="Thuiskomsttijd"
              type="time"
              icon={<Clock size={18} />}
              value={thuiskomstTijd}
              onChange={(e) => setThuiskomstTijd(e.target.value)}
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Totaal gewerkte uren
              </label>
              <div className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 border rounded-lg border-gray-300 dark:border-gray-700">
                {totalHours.toFixed(2)} uur
              </div>
            </div>

            <Input
              label="Gereden kilometers"
              type="number"
              icon={<Car size={18} />}
              value={kilometers}
              onChange={(e) => setKilometers(e.target.value)}
              min="0"
              step="0.1"
              required
            />
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Annuleren
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Bevestigen
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default TravelDetailsModal;