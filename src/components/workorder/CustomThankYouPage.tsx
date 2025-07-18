import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Home, CheckCircle, ThumbsUp, Star, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface WorkStats {
  totalDays: number;
  totalHours: number;
  weeklyStats: {
    [key: number]: {
      days: number;
      hours: number;
    }
  };
}

interface CustomThankYouPageProps {
  selectedCount: number;
  workOrderIds: string[];
}

const CustomThankYouPage = ({ selectedCount, workOrderIds }: CustomThankYouPageProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<WorkStats | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavigating(true);
      navigate('/dashboard/werkbonnen', { replace: true });
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleNavigateBack = () => {
    setIsNavigating(true);
    navigate('/dashboard/werkbonnen', { replace: true });
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        const workOrdersRef = collection(db, 'workOrders');
        const q = query(workOrdersRef, where('userId', '==', user.id));
        const snapshot = await getDocs(q);
        
        const weeklyStats: { [key: number]: { days: number; hours: number } } = {};
        let totalHours = 0;

        snapshot.docs.forEach(doc => {
          const workOrder = doc.data();
          const weekNumber = workOrder.weekNumber || 0;
          
          if (!weeklyStats[weekNumber]) {
            weeklyStats[weekNumber] = { days: 0, hours: 0 };
          }
          
          weeklyStats[weekNumber].days += 1;
          weeklyStats[weekNumber].hours += workOrder.totalHours || 0;
          totalHours += workOrder.totalHours || 0;
        });

        setStats({
          totalDays: snapshot.docs.length,
          totalHours,
          weeklyStats
        });
      } catch (error) {
        console.error('Error fetching work stats:', error);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16">
          <div className="absolute inset-0 bg-primary-500 opacity-10 rounded-full"></div>
        </div>
        <CardHeader>
          <CardTitle className="text-center">
            <motion.div 
              className="flex items-center justify-center space-x-2 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <div className="relative">
                <CheckCircle className="w-16 h-16 text-success-500" />
                <motion.div
                  className="absolute -top-1 -right-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Star className="w-6 h-6 text-primary-500 fill-current" />
                </motion.div>
              </div>
              <ThumbsUp className="w-12 h-12 text-primary-500" />
            </motion.div>
            <motion.h2 
              className="text-2xl font-bold text-gray-900 dark:text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Werkbonnen succesvol verzonden!
            </motion.h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center space-y-6"
          >
            <p className="text-xl font-medium text-gray-800 dark:text-gray-200">
              Bedankt {user?.name}! 🎉
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Je hebt {selectedCount} werkbon{selectedCount !== 1 ? 'nen' : ''} succesvol verzonden.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Werkbonnummers: {workOrderIds.join(', ')}
            </p>

            {stats && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center justify-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Werkuren Overzicht per Week
                </h3>
                <div className="space-y-4">
                  {Object.entries(stats.weeklyStats).map(([week, data]) => (
                    <div 
                      key={week}
                      className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
                    >
                      <div className="font-medium">Week {week}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {data.days} dag{data.days !== 1 ? 'en' : ''} • {data.hours.toFixed(1)} uur
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <div className="font-semibold">Totaal Gewerkt</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.totalDays} dag{stats.totalDays !== 1 ? 'en' : ''} • {stats.totalHours.toFixed(1)} uur
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8">
              <Button
                onClick={handleNavigateBack}
                className="w-full sm:w-auto"
                icon={<Home className="w-4 h-4" />}
                size="lg"
                disabled={isNavigating}
              >
                Terug naar werkbonnen
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Je wordt automatisch doorgestuurd over 10 seconden...
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CustomThankYouPage;