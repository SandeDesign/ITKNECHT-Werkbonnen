import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { motion } from 'framer-motion';
import { 
  ClipboardList,
  BarChart3,
  Users,
  CheckSquare,
  Calendar,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatisticsService, StatsSummary, TopPerformer, RecentActivity } from '../../services/StatisticsService';
import Input from '../../components/ui/Input';

const AdminDashboard = () => {
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setError(null);
        console.log('🏛️ AdminDashboard: Fetching admin statistics...');

        const [overallStats, performers, activity] = await Promise.all([
          StatisticsService.getOverallStats(),
          StatisticsService.getMonthlyTopPerformers(selectedMonth, 3),
          StatisticsService.getRecentActivity(3)
        ]);

        setStats(overallStats);
        setTopPerformers(performers);
        setRecentActivity(activity);
        
        console.log('✅ AdminDashboard: All stats loaded successfully');

      } catch (error) {
        console.error('❌ AdminDashboard: Error fetching dashboard stats:', error);
        setError('Fout bij laden van dashboard statistieken');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [selectedMonth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-error-600 dark:text-error-500">
            <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">Fout bij laden</h3>
            <p>{error || 'Kon statistieken niet laden'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const quickActions = [
    {
      title: 'Werkbonnen',
      href: '/dashboard/admin/werkbonnen',
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      description: `${stats.pendingOrders} wachten`
    },
    {
      title: 'Statistieken',
      href: '/dashboard/admin/statistieken',
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      description: 'Bekijk rapporten'
    },
    {
      title: 'Werknemers',
      href: '/dashboard/admin/gebruikers',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      description: `${stats.activeUsers} actief`
    },
    {
      title: 'Taken',
      href: '/dashboard/admin/tasks',
      icon: CheckSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      description: 'Beheer taken'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions - 4 tegels, mobile vriendelijk */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {quickActions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={action.href}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`p-3 rounded-lg ${action.bgColor}`}>
                      <action.icon className={`h-6 w-6 lg:h-8 lg:w-8 ${action.color}`} />
                    </div>
                    <div>
                      <h3 className="text-sm lg:text-base font-bold text-gray-900 dark:text-white">
                        {action.title}
                      </h3>
                      <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary-600" />
                  <span>Top Presteerders</span>
                </CardTitle>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-40"
                />
              </div>
            </CardHeader>
            <CardContent>
              {topPerformers.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  Geen data beschikbaar voor {new Date(selectedMonth + '-01').toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
                </p>
              ) : (
                <div className="space-y-4">
                  {topPerformers.map((performer, index) => (
                    <div key={performer.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' :
                          index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {performer.name || 'Onbekend'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          €{(performer.revenue || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(performer.hours || 0).toFixed(1)} uur gewerkt
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link 
                  to="/dashboard/admin/statistieken?tab=performance"
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Bekijk alle prestaties →
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary-600" />
                <span>Recente Activiteit</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  Geen recente activiteit
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                        <FileText className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          door {activity.user}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(activity.timestamp).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link 
                  to="/dashboard/admin/werkbonnen"
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Bekijk alle werkbonnen →
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;