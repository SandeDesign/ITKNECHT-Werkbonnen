import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Users, 
  BarChart3,
  Calendar,
  Target,
  Award,
  Filter,
  X
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { 
  getStartOfWeek, 
  getEndOfWeek, 
  getStartOfMonth, 
  getEndOfMonth,
  getStartOfQuarter,
  getEndOfQuarter,
  validateDateRange,
  getWeekNumber
} from '../../utils/dateHelpers';

interface WeeklyStats {
  weekNumber: number;
  totalHours: number;
  totalOrders: number;
  revenue: number;
  technicians: Array<{
    id: string;
    name: string;
    hours: number;
    orders: number;
    revenue: number;
  }>;
}

interface StatisticsFilters {
  weekNumber: string;
  technician: string;
  startDate: string;
  endDate: string;
}

interface FinancialStats {
  totalRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  quarterlyRevenue: number;
  averageOrderValue: number;
  revenueGrowth: number;
}

interface PerformanceStats {
  totalHours: number;
  averageHoursPerOrder: number;
  efficiencyRate: number;
  completionRate: number;
  topPerformers: Array<{
    id: string;
    name: string;
    hours: number;
    orders: number;
    revenue: number;
    efficiency: number;
  }>;
}

interface AnalyticsStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  averageProcessingTime: number;
  ordersByStatus: Record<string, number>;
  ordersByWeek: Array<{ week: number; count: number; hours: number }>;
}

interface TimeTrackingStats {
  totalWorkedHours: number;
  totalPlannedHours: number;
  averageHourlyRate: number;
  overtimeHours: number;
  underutilizedHours: number;
  timeByDay: Array<{ day: string; hours: number }>;
}

const StatisticsPanel = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'financial';
  
  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    totalRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    quarterlyRevenue: 0,
    averageOrderValue: 0,
    revenueGrowth: 0
  });

  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    totalHours: 0,
    averageHoursPerOrder: 0,
    efficiencyRate: 0,
    completionRate: 0,
    topPerformers: []
  });

  const [analyticsStats, setAnalyticsStats] = useState<AnalyticsStats>({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    averageProcessingTime: 0,
    ordersByStatus: {},
    ordersByWeek: []
  });

  const [timeStats, setTimeStats] = useState<TimeTrackingStats>({
    totalWorkedHours: 0,
    totalPlannedHours: 0,
    averageHourlyRate: 41.31,
    overtimeHours: 0,
    underutilizedHours: 0,
    timeByDay: []
  });

  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<StatisticsFilters>({
    weekNumber: '',
    technician: '',
    startDate: '',
    endDate: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const HOURLY_RATE = 41.31;

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setError(null);
        console.log('🔧 StatisticsPanel: Fetching CORRECTED statistics from Firestore...');

        // Fetch users first
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setUsers(usersData);

        // FIXED: Use precise date boundaries instead of approximate calculations
        const weekStart = getStartOfWeek();
        const weekEnd = getEndOfWeek();
        const monthStart = getStartOfMonth();
        const monthEnd = getEndOfMonth();
        const quarterStart = getStartOfQuarter();
        const quarterEnd = getEndOfQuarter();

        // Debug: Validate our date ranges
        validateDateRange('Current Week', weekStart, weekEnd);
        validateDateRange('Current Month', monthStart, monthEnd);
        validateDateRange('Current Quarter', quarterStart, quarterEnd);

        // Fetch work orders
        const workOrdersRef = collection(db, 'workOrders');
        const workOrdersSnapshot = await getDocs(workOrdersRef);
        
        console.log('📊 StatisticsPanel: Processing', workOrdersSnapshot.docs.length, 'work orders');

        // Initialize tracking variables
        let totalRevenue = 0;
        let weeklyRevenue = 0;
        let monthlyRevenue = 0;
        let quarterlyRevenue = 0;
        let totalHours = 0;
        let totalPlannedHours = 0;
        let completedOrders = 0;
        let pendingOrders = 0;
        
        const userStats: Record<string, {
          name: string;
          hours: number;
          orders: number;
          revenue: number;
          plannedHours: number;
        }> = {};
        
        const ordersByStatus: Record<string, number> = {};
        const ordersByWeek: Record<number, { count: number; hours: number }> = {};
        const weeklyStatsData: Record<number, WeeklyStats> = {};
        const timeByDay: Record<string, number> = {};

        // Apply filters to work orders
        let filteredWorkOrders = workOrdersSnapshot.docs;
        
        if (filters.weekNumber) {
          filteredWorkOrders = filteredWorkOrders.filter(doc => {
            const weekNum = getWeekNumber(doc.data().timestamp);
            return weekNum.toString() === filters.weekNumber;
          });
        }
        
        if (filters.technician) {
          filteredWorkOrders = filteredWorkOrders.filter(doc => 
            doc.data().userId === filters.technician
          );
        }
        
        if (filters.startDate) {
          filteredWorkOrders = filteredWorkOrders.filter(doc => 
            doc.data().timestamp >= filters.startDate
          );
        }
        
        if (filters.endDate) {
          filteredWorkOrders = filteredWorkOrders.filter(doc => 
            doc.data().timestamp <= filters.endDate + 'T23:59:59.999Z'
          );
        }

        // Process each work order
        filteredWorkOrders.forEach(doc => {
          const workOrder = doc.data();
          const orderTimestamp = workOrder.timestamp;
          const hours = Number(workOrder.totalHours) || 0;
          const revenue = hours * HOURLY_RATE;
          const plannedHours = workOrder.entries?.reduce((sum: number, entry: any) => 
            sum + (Number(entry.plannedHours) || 0), 0) || 0;
          const weekNum = getWeekNumber(orderTimestamp);

          // FIXED: Use precise ISO string comparisons instead of Date objects
          const isInCurrentWeek = orderTimestamp >= weekStart && orderTimestamp <= weekEnd;
          const isInCurrentMonth = orderTimestamp >= monthStart && orderTimestamp <= monthEnd;
          const isInCurrentQuarter = orderTimestamp >= quarterStart && orderTimestamp <= quarterEnd;

          // Revenue calculations
          totalRevenue += revenue;
          totalHours += hours;
          totalPlannedHours += plannedHours;

          // FIXED: Time-based filtering using precise boundaries
          if (isInCurrentWeek) {
            weeklyRevenue += revenue;
            console.log('📊 Week revenue match:', {
              timestamp: orderTimestamp,
              revenue: revenue.toFixed(2),
              weekStart,
              weekEnd
            });
          }
          
          if (isInCurrentMonth) {
            monthlyRevenue += revenue;
            console.log('📊 Month revenue match:', {
              timestamp: orderTimestamp,
              revenue: revenue.toFixed(2),
              monthStart,
              monthEnd
            });
          }
          
          if (isInCurrentQuarter) {
            quarterlyRevenue += revenue;
            console.log('📊 Quarter revenue match:', {
              timestamp: orderTimestamp,
              revenue: revenue.toFixed(2),
              quarterStart,
              quarterEnd
            });
          }

          // Status tracking
          const status = workOrder.status || 'draft';
          ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
          
          if (status === 'sent' || status === 'processed') {
            completedOrders++;
          } else if (status === 'pending' || status === 'ready_to_send') {
            pendingOrders++;
          }

          // Week tracking
          const orderDate = new Date(orderTimestamp);
          const weekNumber = Math.ceil((orderDate.getTime() - new Date(orderDate.getFullYear(), 0, 1).getTime()) / (24 * 60 * 60 * 1000) / 7);
          if (!ordersByWeek[weekNumber]) {
            ordersByWeek[weekNumber] = { count: 0, hours: 0 };
          }
          ordersByWeek[weekNumber].count++;
          ordersByWeek[weekNumber].hours += hours;

          // Weekly statistics with technician breakdown
          if (!weeklyStatsData[weekNum]) {
            weeklyStatsData[weekNum] = {
              weekNumber: weekNum,
              totalHours: 0,
              totalOrders: 0,
              revenue: 0,
              technicians: []
            };
          }
          
          weeklyStatsData[weekNum].totalHours += hours;
          weeklyStatsData[weekNum].totalOrders++;
          weeklyStatsData[weekNum].revenue += revenue;
          
          // Add technician data to weekly stats
          let techInWeek = weeklyStatsData[weekNum].technicians.find(t => t.id === workOrder.userId);
          if (!techInWeek) {
            techInWeek = {
              id: workOrder.userId,
              name: workOrder.userName || 'Onbekend',
              hours: 0,
              orders: 0,
              revenue: 0
            };
            weeklyStatsData[weekNum].technicians.push(techInWeek);
          }
          
          techInWeek.hours += hours;
          techInWeek.orders++;
          techInWeek.revenue += revenue;

          // Day tracking
          const dayName = orderDate.toLocaleDateString('nl-NL', { weekday: 'long' });
          timeByDay[dayName] = (timeByDay[dayName] || 0) + hours;

          // User statistics
          if (workOrder.userId && workOrder.userName) {
            if (!userStats[workOrder.userId]) {
              userStats[workOrder.userId] = {
                name: workOrder.userName,
                hours: 0,
                orders: 0,
                revenue: 0,
                plannedHours: 0
              };
            }
            userStats[workOrder.userId].hours += hours;
            userStats[workOrder.userId].orders++;
            userStats[workOrder.userId].revenue += revenue;
            userStats[workOrder.userId].plannedHours += plannedHours;
          }
        });

        // Calculate derived statistics
        const totalOrders = filteredWorkOrders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const averageHoursPerOrder = totalOrders > 0 ? totalHours / totalOrders : 0;
        const efficiencyRate = totalPlannedHours > 0 ? (totalHours / totalPlannedHours) * 100 : 0;
        const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
        const overtimeHours = Math.max(0, totalHours - totalPlannedHours);
        const underutilizedHours = Math.max(0, totalPlannedHours - totalHours);

        // Top performers
        const topPerformers = Object.entries(userStats)
          .map(([id, stats]) => ({
            id,
            name: stats.name,
            hours: stats.hours,
            orders: stats.orders,
            revenue: stats.revenue,
            efficiency: stats.plannedHours > 0 ? (stats.hours / stats.plannedHours) * 100 : 0
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);

        // Convert objects to arrays
        const weeklyData = Object.entries(ordersByWeek)
          .map(([week, data]) => ({ week: parseInt(week), ...data }))
          .sort((a, b) => b.week - a.week)
          .slice(0, 12);

        const dailyData = Object.entries(timeByDay)
          .map(([day, hours]) => ({ day, hours }));

        // Convert weekly stats to array and sort
        const weeklyStatsArray = Object.values(weeklyStatsData)
          .sort((a, b) => b.weekNumber - a.weekNumber)
          .slice(0, 12); // Last 12 weeks
        
        setWeeklyStats(weeklyStatsArray);

        // CRITICAL: Log final statistics for verification
        console.log('✅ StatisticsPanel: CORRECTED Statistics Summary:', {
          totalRevenue: totalRevenue.toFixed(2),
          weeklyRevenue: weeklyRevenue.toFixed(2),
          monthlyRevenue: monthlyRevenue.toFixed(2),
          quarterlyRevenue: quarterlyRevenue.toFixed(2),
          totalHours: totalHours.toFixed(1),
          weekPeriod: `${new Date(weekStart).toLocaleDateString('nl-NL')} - ${new Date(weekEnd).toLocaleDateString('nl-NL')}`,
          monthPeriod: `${new Date(monthStart).toLocaleDateString('nl-NL')} - ${new Date(monthEnd).toLocaleDateString('nl-NL')}`,
          quarterPeriod: `${new Date(quarterStart).toLocaleDateString('nl-NL')} - ${new Date(quarterEnd).toLocaleDateString('nl-NL')}`,
          topPerformersCount: topPerformers.length
        });

        // Update state
        setFinancialStats({
          totalRevenue,
          weeklyRevenue,
          monthlyRevenue,
          quarterlyRevenue,
          averageOrderValue,
          revenueGrowth: monthlyRevenue > 0 ? ((weeklyRevenue * 4 - monthlyRevenue) / monthlyRevenue) * 100 : 0
        });

        setPerformanceStats({
          totalHours,
          averageHoursPerOrder,
          efficiencyRate,
          completionRate,
          topPerformers
        });

        setAnalyticsStats({
          totalOrders,
          completedOrders,
          pendingOrders,
          averageProcessingTime: 0, // Would need timestamps to calculate
          ordersByStatus,
          ordersByWeek: weeklyData
        });

        setTimeStats({
          totalWorkedHours: totalHours,
          totalPlannedHours,
          averageHourlyRate: HOURLY_RATE,
          overtimeHours,
          underutilizedHours,
          timeByDay: dailyData
        });

        console.log('✅ StatisticsPanel: CORRECTED statistics calculated successfully');

      } catch (error) {
        console.error('❌ StatisticsPanel: Error fetching statistics:', error);
        setError('Fout bij laden van statistieken');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, [filters]);

  const handleFilterChange = (key: keyof StatisticsFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      weekNumber: '',
      technician: '',
      startDate: '',
      endDate: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  // Generate week numbers for current year
  const generateWeekNumbers = () => {
    const weeks = [];
    for (let i = 1; i <= 53; i++) {
      weeks.push(i);
    }
    return weeks;
  };

  const weekNumbers = generateWeekNumbers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-error-600 dark:text-error-500">
            <BarChart3 className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">Fout bij laden</h3>
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderFinancialTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Deze Week</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  €{financialStats.weeklyRevenue.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">ex BTW</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Deze Maand</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  €{financialStats.monthlyRevenue.toFixed(2)}
                </p>
                <p className="text-sm text-success-600">
                  +{financialStats.revenueGrowth.toFixed(1)}% vs vorige maand
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Dit Kwartaal</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  €{financialStats.quarterlyRevenue.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">3 maanden</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Totale Omzet</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  €{financialStats.totalRevenue.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">alle tijd</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Totaal Uren</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {performanceStats.totalHours.toFixed(1)}u
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gem. Uren/Werkbon</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {performanceStats.averageHoursPerOrder.toFixed(1)}u
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Efficiëntie</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {performanceStats.efficiencyRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Voltooiingsgraad</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {performanceStats.completionRate.toFixed(1)}%
                </p>
              </div>
              <Award className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Presteerders - ACCURATE DATA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceStats.topPerformers.map((performer, index) => (
              <div key={performer.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{performer.name}</h3>
                    <p className="text-sm text-gray-500">
                      {performer.orders} werkbonnen • {performer.hours.toFixed(1)} uur
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">
                    €{performer.revenue.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {performer.efficiency.toFixed(1)}% efficiëntie
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Totaal Werkbonnen</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsStats.totalOrders}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Voltooid</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsStats.completedOrders}
                </p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">In Behandeling</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsStats.pendingOrders}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Deze Week</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analyticsStats.ordersByWeek[0]?.count || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Verdeling</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analyticsStats.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="capitalize text-gray-700 dark:text-gray-300">
                    {status === 'draft' ? 'Concept' :
                     status === 'ready_to_send' ? 'Gecontroleerd' :
                     status === 'pending' ? 'In behandeling' :
                     status === 'sent' ? 'Verzonden' :
                     status === 'processed' ? 'Verwerkt' : status}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{count}</span>
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ 
                          width: `${analyticsStats.totalOrders > 0 ? (count / analyticsStats.totalOrders) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Werkbonnen per Week (Laatste 12 weken)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsStats.ordersByWeek.map((week) => (
                <div key={week.week} className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Week {week.week}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">{week.hours.toFixed(1)}u</span>
                    <span className="font-medium">{week.count} werkbonnen</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTimeTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gewerkte Uren</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {timeStats.totalWorkedHours.toFixed(1)}u
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Geplande Uren</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {timeStats.totalPlannedHours.toFixed(1)}u
                </p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Overuren</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {timeStats.overtimeHours.toFixed(1)}u
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Uurtarief</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  €{timeStats.averageHourlyRate.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uren per Dag van de Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeStats.timeByDay.map((day) => (
              <div key={day.day} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">{day.day}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-primary-600 h-3 rounded-full"
                      style={{ 
                        width: `${timeStats.totalWorkedHours > 0 ? (day.hours / timeStats.totalWorkedHours) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white w-16 text-right">
                    {day.hours.toFixed(1)}u
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tijd Efficiëntie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Efficiëntie Rate</span>
                <span className="font-bold text-primary-600">
                  {timeStats.totalPlannedHours > 0 ? 
                    ((timeStats.totalWorkedHours / timeStats.totalPlannedHours) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Onderbenutting</span>
                <span className="font-bold text-warning-600">
                  {timeStats.underutilizedHours.toFixed(1)}u
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Overwerk</span>
                <span className="font-bold text-error-600">
                  {timeStats.overtimeHours.toFixed(1)}u
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productiviteit Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Gem. Uren per Dag</span>
                <span className="font-bold">
                  {timeStats.timeByDay.length > 0 ? 
                    (timeStats.totalWorkedHours / timeStats.timeByDay.length).toFixed(1) : 0}u
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Totale Omzet</span>
                <span className="font-bold text-success-600">
                  €{(timeStats.totalWorkedHours * timeStats.averageHourlyRate).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Statistieken Filters</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              icon={<Filter className="h-4 w-4" />}
            >
              Filters {hasActiveFilters && `(${Object.values(filters).filter(Boolean).length})`}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Weeknummer
                </label>
                <select
                  value={filters.weekNumber}
                  onChange={(e) => handleFilterChange('weekNumber', e.target.value)}
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Alle weken</option>
                  {weekNumbers.map(week => (
                    <option key={week} value={week.toString()}>
                      Week {week}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Monteur
                </label>
                <select
                  value={filters.technician}
                  onChange={(e) => handleFilterChange('technician', e.target.value)}
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Alle monteurs</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <Input
                type="date"
                label="Start Datum"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
              
              <Input
                type="date"
                label="Eind Datum"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            
            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  icon={<X className="h-4 w-4" />}
                >
                  Filters wissen
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'financial' && renderFinancialTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {renderAnalyticsTab()}
            
            {/* Weekly Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Weekcijfers {hasActiveFilters && '(Gefilterd)'}</CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyStats.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Geen data</h3>
                    <p>Geen werkbonnen gevonden voor de geselecteerde filters.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {weeklyStats.map((week) => (
                      <div key={week.weekNumber} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">Week {week.weekNumber}</h3>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary-600">
                              €{week.revenue.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {week.totalHours.toFixed(1)}u • {week.totalOrders} werkbonnen
                            </div>
                          </div>
                        </div>
                        
                        {week.technicians.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                              Per Monteur:
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {week.technicians.map((tech) => (
                                <div key={tech.id} className="p-3 bg-white dark:bg-gray-700 rounded-lg">
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {tech.name}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-300">
                                    {tech.hours.toFixed(1)}u • {tech.orders} werkbonnen
                                  </div>
                                  <div className="text-sm font-medium text-success-600">
                                    €{tech.revenue.toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        {activeTab === 'time' && renderTimeTab()}
      </motion.div>
    </div>
  );
};

export default StatisticsPanel;