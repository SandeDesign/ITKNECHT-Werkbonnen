import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign,
  Calendar,
  Users,
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

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Deze Week',
      value: `€${stats.weeklyRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      title: 'Deze Maand',
      value: `€${stats.monthlyRevenue.toFixed(2)}`,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      title: 'Totale Omzet',
      value: `€${stats.totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      title: 'Werknemers',
      value: stats.activeUsers.toString(),
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    }
  ];

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
            <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">Fout bij laden</h3>
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {stat.title}
                    </h3>
                    <div className="flex items-baseline space-x-2">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
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
                  <TrendingUp className="h-5 w-5 text-primary-600" />
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

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Snelle Acties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link 
                to="/dashboard/admin/werkbonnen?status=pending"
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-6 w-6 text-warning-600 group-hover:text-warning-700" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Goedkeuring Nodig
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stats.pendingOrders} werkbonnen wachten
                    </p>
                  </div>
                </div>
              </Link>

              <Link 
                to="/dashboard/admin/statistieken?tab=financial"
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-6 w-6 text-green-600 group-hover:text-green-700" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Financieel Rapport
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Bekijk omzet en kosten
                    </p>
                  </div>
                </div>
              </Link>

              <Link 
                to="/dashboard/admin/gebruikers"
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Users className="h-6 w-6 text-blue-600 group-hover:text-blue-700" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Werknemers Beheren
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stats.activeUsers} actieve werknemers
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;