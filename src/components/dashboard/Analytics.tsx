import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { motion } from 'framer-motion';
import { BarChart, MapPin, Clock, TrendingUp } from 'lucide-react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useState, useEffect } from 'react';

const Analytics = () => {
  const [stats, setStats] = useState({
    totalAddresses: 0,
    totalHoursWorked: 0,
    totalHoursPlanned: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get all users first to count technicians
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const technicianCount = usersSnapshot.docs.length;

        const workOrdersRef = collection(db, 'workOrders');
        const snapshot = await getDocs(workOrdersRef);
        
        let totalAddresses = 0;
        let totalHoursWorked = 0;
        let totalHoursPlanned = 0;

        snapshot.docs.forEach((doc) => {
          const workOrder = doc.data();
          
          // Count addresses
          totalAddresses += workOrder.entries?.length || 0;
          
          // Sum worked hours
          const hoursWorked = Number(workOrder.totalHours) || 0;
          totalHoursWorked += hoursWorked;
          
          // Sum planned hours
          workOrder.entries?.forEach((entry: any) => {
            totalHoursPlanned += Number(entry.plannedHours) || 0;
          });
        });

        setStats({
          totalAddresses,
          totalHoursWorked,
          totalHoursPlanned
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    };

    fetchStats();
  }, []);

  const performanceData = [
    { 
      title: 'Totaal Adressen', 
      value: stats.totalAddresses.toString(), 
      icon: MapPin,
      color: 'text-primary-500',
      bgColor: 'bg-primary-100 dark:bg-primary-900/30' 
    },
    { 
      title: 'Gewerkte Uren', 
      value: `${stats.totalHoursWorked.toFixed(1)}u`, 
      icon: Clock,
      color: 'text-primary-500',
      bgColor: 'bg-primary-100 dark:bg-primary-900/30'
    },
    { 
      title: 'Geplande Uren', 
      value: `${stats.totalHoursPlanned.toFixed(1)}u`,
      icon: TrendingUp,
      color: 'text-primary-500',
      bgColor: 'bg-primary-100 dark:bg-primary-900/30'
    }
  ];

  const trafficSources = [
    { name: 'Direct', value: 35, color: 'bg-blue-500' },
    { name: 'Search', value: 28, color: 'bg-green-500' },
    { name: 'Social', value: 22, color: 'bg-purple-500' },
    { name: 'Referral', value: 15, color: 'bg-orange-500' }
  ];

  const topPages = [
    { page: '/home', views: 12487, change: 8.2 },
    { page: '/products', views: 9632, change: -2.4 },
    { page: '/blog', views: 7845, change: 14.6 },
    { page: '/pricing', views: 5721, change: 3.8 },
    { page: '/about', views: 4589, change: -1.2 }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr"
      >
        {performanceData.map((stat, index) => (
          <motion.div key={index} variants={item}>
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</h3>
                    <div className="mt-1 flex items-baseline">
                      <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                      <p className={`ml-2 text-sm ${stat.trend === 'up' ? 'text-success-600 dark:text-success-500' : 'text-error-600 dark:text-error-500'}`}>
                        {stat.change}
                      </p>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Analytics;