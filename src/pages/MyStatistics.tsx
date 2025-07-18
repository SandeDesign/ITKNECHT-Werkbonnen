import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { StatisticsService } from '../services/StatisticsService';
import { 
  BarChart3, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  AlertCircle,
  FileText,
  MapPin
} from 'lucide-react';

interface WeeklyStats {
  weekNumber: number;
  totalHours: number;
}

interface PersonalStats {
  totalHoursWorked: number;
  totalWorkOrdersCompleted: number;
  totalKilometersDriven: number;
  totalRevenue: number;
  averageHoursPerOrder: number;
  efficiencyRate: number;
  currentWeekHours: number;
  weeklyStats: WeeklyStats[];
}

const MyStatistics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PersonalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('📊 MyStatistics: Fetching statistics for user:', user.id);
        
        // Get weekly stats
        const userWeeklyStats = await StatisticsService.getUserWeeklyStats(user.id);
        
        // Get all work orders for this user
        const allOrders = await StatisticsService.getWorkOrders({ userId: user.id });
        
        // Calculate comprehensive statistics
        const totalHours = allOrders.reduce((sum, order) => sum + (Number(order.totalHours) || 0), 0);
        const totalKilometers = allOrders.reduce((sum, order) => sum + (Number(order.kilometers) || 0), 0);
        const totalPlannedHours = allOrders.reduce((sum, order) => 
          sum + (order.entries?.reduce((entrySum, entry) => entrySum + (Number(entry.plannedHours) || 0), 0) || 0), 0
        );
        
        setStats({
          totalHoursWorked: totalHours,
          totalWorkOrdersCompleted: allOrders.length,
          totalKilometersDriven: totalKilometers,
          totalRevenue: totalHours * 41.31,
          averageHoursPerOrder: allOrders.length > 0 ? totalHours / allOrders.length : 0,
          efficiencyRate: totalPlannedHours > 0 ? (totalHours / totalPlannedHours) * 100 : 0,
          currentWeekHours: userWeeklyStats.currentWeekHours,
          weeklyStats: userWeeklyStats.weeklyStats
        });
        
        console.log('✅ MyStatistics: Statistics loaded successfully');
      } catch (error) {
        console.error('❌ MyStatistics: Error fetching statistics:', error);
        setError('Er is een fout opgetreden bij het laden van de statistieken');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const getHoursStatusColor = (hours: number) => {
    if (hours >= 36) return 'text-success-600 dark:text-success-400';
    if (hours >= 32) return 'text-warning-600 dark:text-warning-400';
    return 'text-error-600 dark:text-error-400';
  };

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
            <AlertCircle className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">Fout bij laden</h3>
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Geen statistieken beschikbaar</h3>
            <p>Er zijn nog geen werkbonnen geregistreerd.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200 dark:border-primary-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-primary-600" />
              <span>Mijn Statistieken Dashboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Hier vind je een compleet overzicht van je prestaties en werkuren.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary-600" />
              <span>Deze Week</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Voortgang</span>
                  <span className={`text-sm font-medium ${getHoursStatusColor(stats.currentWeekHours)}`}>
                    {stats.currentWeekHours.toFixed(1)} / 36 uur
                  </span>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      stats.currentWeekHours >= 36 ? 'bg-success-500' :
                      stats.currentWeekHours >= 32 ? 'bg-warning-500' :
                      'bg-error-500'
                    }`}
                    style={{ width: `${Math.min((stats.currentWeekHours / 36) * 100, 100)}%` }}
                  />
                </div>
                {stats.currentWeekHours < 36 && (
                  <p className="mt-1 text-sm text-gray-500">
                    Nog {(36 - stats.currentWeekHours).toFixed(1)} uur tot doel
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Laatste 4 weken
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {stats.weeklyStats.slice(0, 4).map((stat) => (
                    <div key={stat.weekNumber} className="space-y-2">
                      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg relative">
                        <div 
                          className={`absolute bottom-0 left-0 right-0 transition-all duration-500 rounded-b-lg ${
                            stat.totalHours >= 36 ? 'bg-success-500' :
                            stat.totalHours >= 32 ? 'bg-warning-500' :
                            'bg-error-500'
                          }`}
                          style={{ height: `${Math.min((stat.totalHours / 36) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Week {stat.weekNumber}</div>
                        <div className={`text-sm font-medium ${getHoursStatusColor(stat.totalHours)}`}>
                          {stat.totalHours.toFixed(1)}u
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              <span>Prestatie Overzicht</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-center">
                <Clock className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {stats.totalHoursWorked.toFixed(1)}u
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Totaal Gewerkt</div>
              </div>
              
              <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-lg text-center">
                <CheckCircle className="h-6 w-6 text-success-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-success-600 dark:text-success-400">
                  {stats.totalWorkOrdersCompleted}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Werkbonnen</div>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <Award className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.averageHoursPerOrder.toFixed(1)}u
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Gem. per Werkbon</div>
              </div>
              
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                <TrendingUp className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {stats.efficiencyRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Efficiëntie</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary-600" />
                <span>Wekelijkse Prestaties</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.weeklyStats.slice(0, 6).map((week) => (
                  <div key={week.weekNumber} className="flex items-center space-x-4">
                    <div className="w-12 text-center">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">W{week.weekNumber}</div>
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            week.totalHours >= 36 ? 'bg-success-500' :
                            week.totalHours >= 32 ? 'bg-warning-500' :
                            'bg-error-500'
                          }`}
                          style={{ width: `${Math.min((week.totalHours / 36) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <div className={`text-sm font-medium ${getHoursStatusColor(week.totalHours)}`}>
                        {week.totalHours.toFixed(1)}u
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Efficiency Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary-600" />
                <span>Efficiëntie Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Efficiëntie Rate</span>
                    <span className="text-sm font-medium">
                      {stats.efficiencyRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-600 rounded-full"
                      style={{ width: `${Math.min(stats.efficiencyRate, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Verhouding tussen gewerkte uren en geplande uren
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Gem. Uren per Werkbon</div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      {stats.averageHoursPerOrder.toFixed(1)}u
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Totaal Gewerkt</div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      {stats.totalHoursWorked.toFixed(1)}u
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* User Profile Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-primary-600" />
              <span>Persoonlijke Prestaties</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
              <div className="flex-shrink-0 mb-4 md:mb-0">
                <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 text-4xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-success-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Werkbonnen</span>
                  </div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {stats.totalWorkOrdersCompleted}
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className="h-4 w-4 text-primary-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Uren</span>
                  </div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {stats.totalHoursWorked.toFixed(1)}u
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Efficiëntie</span>
                  </div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {stats.efficiencyRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MyStatistics;