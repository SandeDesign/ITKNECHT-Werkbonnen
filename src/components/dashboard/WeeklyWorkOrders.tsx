import { useState, useEffect, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, MapPin, CheckCircle, Plus, ChevronDown, Calendar, Edit2 } from 'lucide-react';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import TravelDetailsModal from '../workorder/TravelDetailsModal';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { StatisticsService, WorkOrderData } from '../../services/StatisticsService';
import { getWeekNumber } from '../../utils/dateHelpers';

const WeeklyWorkOrders = () => {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTravelModalForChecking, setShowTravelModalForChecking] = useState(false);
  const [selectedWorkOrderForChecking, setSelectedWorkOrderForChecking] = useState<WorkOrderData | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(getCurrentWeekNumber());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Get current week number
  function getCurrentWeekNumber() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  }

  const fetchWeeklyWorkOrders = useCallback(async () => {
    if (!user?.id) return;
    
    console.log(`📅 WeeklyWorkOrders: Fetching for user: ${user.id}, week: ${selectedWeek}, year: ${selectedYear}`);
    setIsLoading(true);

    try {
      // Get all work orders for the user
      const allOrders = await StatisticsService.getWorkOrders({ userId: user.id });
      
      // Filter by selected week and year
      const filteredOrders = allOrders.filter(order => {
        const orderDate = new Date(order.timestamp);
        const orderYear = orderDate.getFullYear();
        const orderWeek = getWeekNumber(order.timestamp);
        
        return orderYear === selectedYear && orderWeek === selectedWeek;
      });
      
      console.log(`✅ WeeklyWorkOrders: Loaded ${filteredOrders.length} orders for week ${selectedWeek}`);
      setWorkOrders(filteredOrders);
    } catch (error) {
      console.error('Error fetching weekly work orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedWeek, selectedYear]);

  useEffect(() => {
    fetchWeeklyWorkOrders();
  }, [fetchWeeklyWorkOrders]);

  const handleTravelDetailsSubmit = async (details: any) => {
    if (!selectedWorkOrderForChecking) return;
    
    try {
      const workOrderRef = doc(db, 'workOrders', selectedWorkOrderForChecking.id);
      await updateDoc(workOrderRef, {
        ...details,
        status: 'pending',
        updatedAt: new Date().toISOString()
      });
      
      await fetchWeeklyWorkOrders();
      setShowTravelModalForChecking(false);
      setSelectedWorkOrderForChecking(null);
    } catch (error) {
      console.error('Error updating work order:', error);
    }
  };

  // Generate week options for the current year
  const generateWeekNumbers = () => {
    const options = [];
    for (let i = 1; i <= 53; i++) {
      options.push(i);
    }
    return options;
  };

  // Generate year options (current year and previous year)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  };

  // Reset to current week
  const goToCurrentWeek = () => {
    setSelectedWeek(getCurrentWeekNumber());
    setSelectedYear(new Date().getFullYear());
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deze Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Werkbonnen</CardTitle>
          <div className="flex items-center space-x-2 flex-wrap">
            <div className="flex items-center space-x-2 mr-2">
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-24"
              >
                {generateWeekNumbers().map(week => (
                  <option key={week} value={week}>Week {week}</option>
                ))}
              </select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentWeek}
                className="hidden sm:flex"
              >
                Huidige week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentWeek}
                className="sm:hidden w-10 p-0 min-w-[40px]"
                icon={<Calendar className="h-4 w-4" />}
              />
            </div>
            
            <Link to="/dashboard/create">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                className="hidden sm:flex"
              >
                Nieuwe Bon
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
                className="sm:hidden w-10 p-0 min-w-[40px]"
              />
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {workOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Geen werkbonnen voor week {selectedWeek}, {selectedYear}</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {workOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-b border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {order.dayOfWeek} - {new Date(order.timestamp).toLocaleDateString('nl-NL', {day: 'numeric', month: 'numeric'})}
                    </span>
                  </div>
                  {(order.status === 'draft' || !order.status) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedWorkOrderForChecking(order);
                        setShowTravelModalForChecking(true);
                      }} 
                      icon={<Clock className="h-4 w-4" />} 
                      className="hidden sm:flex"
                    >
                      Werkbon indienen
                    </Button>
                  )}
                  {(order.status === 'draft' || !order.status) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedWorkOrderForChecking(order);
                        setShowTravelModalForChecking(true);
                      }}
                      icon={<Clock className="h-4 w-4" />}
                      className="sm:hidden w-10 p-0 min-w-[40px]"
                    />
                  )}
                  {order.status === 'pending' && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                      In behandeling
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {order.entries.length} adres{order.entries.length !== 1 ? 'sen' : ''} • {order.totalHours} uur
                  </p>
                  {(order.status === 'draft' || !order.status) && (
                    <div>
                      <Link to={`/dashboard/werkbonnen/edit/${order.id}`}>
                        <Button
                          variant="outline"
                          size="sm" 
                          icon={<Edit2 className="h-4 w-4" />}
                          className="hidden sm:flex"
                        >
                          Bewerken
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Edit2 className="h-4 w-4" />}
                          className="sm:hidden w-10 p-0 min-w-[40px]"
                        />
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
        {showTravelModalForChecking && selectedWorkOrderForChecking && (
          <TravelDetailsModal
            onSubmit={handleTravelDetailsSubmit}
            onCancel={() => {
              setShowTravelModalForChecking(false);
              setSelectedWorkOrderForChecking(null);
            }}
            workOrderDate={selectedWorkOrderForChecking.timestamp}
            existingDetails={{
              vertrekTijd: selectedWorkOrderForChecking.vertrekTijd,
              thuiskomstTijd: selectedWorkOrderForChecking.thuiskomstTijd,
              kilometers: selectedWorkOrderForChecking.kilometers,
              weekNumber: selectedWorkOrderForChecking.weekNumber,
              dayOfWeek: selectedWorkOrderForChecking.dayOfWeek
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyWorkOrders;