import { collection, query, where, orderBy, getDocs, Query, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  getStartOfWeek, 
  getEndOfWeek, 
  getStartOfMonth, 
  getEndOfMonth,
  getWeekNumber,
  getDayOfWeek
} from '../utils/dateHelpers';

const HOURLY_RATE = 41.31;

export interface WorkOrderData {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  totalHours: number;
  kilometers: number;
  entries: Array<{
    timeSpent: number;
    plannedHours: number;
    address: string;
    description: string;
  }>;
  status: string;
  weekNumber?: number;
  dayOfWeek?: string;
  vertrekTijd: string;
  thuiskomstTijd: string;
}

export interface StatsSummary {
  totalRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  quarterlyRevenue: number;
  totalHours: number;
  weeklyHours: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  activeUsers: number;
  averageHourlyRate: number;
}

export interface TopPerformer {
  id: string;
  name: string;
  hours: number;
  orders: number;
  revenue: number;
  efficiency: number;
}

export interface RecentActivity {
  id: string;
  type: 'workorder';
  description: string;
  timestamp: string;
  user: string;
}

export interface PersonalStats {
  totalHoursWorked: number;
  totalWorkOrdersCompleted: number;
  totalKilometersDriven: number;
  lastWorkOrderDate?: string;
  averageHourlyRate: number;
  weeklyStats: Array<{ weekNumber: number; totalHours: number }>;
  currentWeekHours: number;
  averageWeeklyHours: number;
}

export class StatisticsService {
  /**
   * CRITICAL: Get work orders using EXACT same logic as WorkOrderManagement.tsx
   * This is the ONLY source of truth for work order data
   */
  static async getWorkOrders(filters?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<WorkOrderData[]> {
    try {
      console.log('🔧 StatisticsService: Using EXACT WorkOrderManagement query logic');
      
      const workOrdersRef = collection(db, 'workOrders');
      let q: Query<DocumentData>;
      
      // EXACT same base query as WorkOrderManagement.tsx
      if (filters?.userId) {
        q = query(
          workOrdersRef,
          where('userId', '==', filters.userId),
          orderBy('timestamp', 'desc')
        );
      } else {
        q = query(workOrdersRef, orderBy('timestamp', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      let orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WorkOrderData[];

      console.log('🔧 StatisticsService: Raw Firestore data:', orders.length, 'orders');

      // EXACT same client-side filtering as WorkOrderManagement.tsx
      if (filters?.startDate) {
        const startCount = orders.length;
        orders = orders.filter(order => order.timestamp >= filters.startDate!);
        console.log('🔧 StatisticsService: After startDate filter:', startCount, '->', orders.length);
      }
      
      if (filters?.endDate) {
        const endCount = orders.length;
        orders = orders.filter(order => order.timestamp <= filters.endDate! + 'T23:59:59.999Z');
        console.log('🔧 StatisticsService: After endDate filter:', endCount, '->', orders.length);
      }
      
      if (filters?.status) {
        const statusCount = orders.length;
        orders = orders.filter(order => order.status === filters.status);
        console.log('🔧 StatisticsService: After status filter:', statusCount, '->', orders.length);
      }

      // CRITICAL: Log exact data for verification
      const totalHours = orders.reduce((sum, order) => sum + (Number(order.totalHours) || 0), 0);
      const totalRevenue = totalHours * HOURLY_RATE;
      
      console.log('✅ StatisticsService: FINAL VERIFIED DATA:', {
        orderCount: orders.length,
        totalHours: totalHours.toFixed(2),
        totalRevenue: totalRevenue.toFixed(2),
        filters
      });

      return orders;
    } catch (error) {
      console.error('❌ StatisticsService: Error fetching work orders:', error);
      throw error;
    }
  }

  /**
   * CRITICAL: Calculate statistics using EXACT same aggregation as working components
   */
  static async getOverallStats(): Promise<StatsSummary> {
    try {
      console.log('🔧 StatisticsService: Calculating stats with EXACT WorkOrderManagement logic');
      
      // Get ALL work orders first (same as WorkOrderManagement.tsx)
      const allOrders = await this.getWorkOrders();
      
      // Get current week orders using EXACT same date logic
      const weekStart = getStartOfWeek();
      const weekEnd = getEndOfWeek();
      const weekOrders = await this.getWorkOrders({
        startDate: weekStart,
        endDate: weekEnd.split('T')[0] // Remove time part for endDate filter
      });
      
      // Get current month orders
      const monthStart = getStartOfMonth();
      const monthEnd = getEndOfMonth();
      const monthOrders = await this.getWorkOrders({
        startDate: monthStart,
        endDate: monthEnd.split('T')[0]
      });

      // Get users count
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const activeUsers = usersSnapshot.docs.length;

      // EXACT same calculations as working components
      const totalHours = allOrders.reduce((sum, order) => sum + (Number(order.totalHours) || 0), 0);
      const totalRevenue = totalHours * HOURLY_RATE;
      
      const weeklyHours = weekOrders.reduce((sum, order) => sum + (Number(order.totalHours) || 0), 0);
      const weeklyRevenue = weeklyHours * HOURLY_RATE;
      
      const monthlyHours = monthOrders.reduce((sum, order) => sum + (Number(order.totalHours) || 0), 0);
      const monthlyRevenue = monthlyHours * HOURLY_RATE;

      // Status counts
      const completedOrders = allOrders.filter(order => 
        order.status === 'sent' || order.status === 'processed'
      ).length;
      
      const pendingOrders = allOrders.filter(order => 
        order.status === 'pending' || order.status === 'ready_to_send'
      ).length;

      const stats = {
        totalRevenue,
        weeklyRevenue,
        monthlyRevenue,
        quarterlyRevenue: monthlyRevenue * 3, // Simple approximation
        totalHours,
        weeklyHours,
        totalOrders: allOrders.length,
        completedOrders,
        pendingOrders,
        activeUsers,
        averageHourlyRate: HOURLY_RATE
      };

      console.log('✅ StatisticsService: VERIFIED FINAL STATS:', {
        totalOrders: stats.totalOrders,
        totalHours: stats.totalHours.toFixed(2),
        totalRevenue: stats.totalRevenue.toFixed(2),
        weeklyHours: stats.weeklyHours.toFixed(2),
        weeklyRevenue: stats.weeklyRevenue.toFixed(2),
        monthlyRevenue: stats.monthlyRevenue.toFixed(2)
      });

      return stats;
    } catch (error) {
      console.error('❌ StatisticsService: Error calculating overall stats:', error);
      throw error;
    }
  }

  /**
   * Get weekly work orders using EXACT same logic as WeeklyWorkOrders.tsx
   */
  static async getWeeklyWorkOrders(userId: string): Promise<WorkOrderData[]> {
    try {
      console.log('🔧 StatisticsService: Getting weekly orders with EXACT WeeklyWorkOrders logic');
      
      // EXACT same date calculation as WeeklyWorkOrders.tsx
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      monday.setHours(0, 0, 0, 0);

      const friday = new Date(monday);
      friday.setDate(friday.getDate() + 4);
      friday.setHours(23, 59, 59, 999);

      const orders = await this.getWorkOrders({
        userId,
        startDate: monday.toISOString(),
        endDate: friday.toISOString().split('T')[0]
      });

      console.log('✅ StatisticsService: Weekly orders for user', userId, ':', orders.length);
      return orders;
    } catch (error) {
      console.error('❌ StatisticsService: Error fetching weekly work orders:', error);
      throw error;
    }
  }

  /**
   * Get top performers using EXACT same logic
   */
  static async getTopPerformers(limit: number = 10): Promise<TopPerformer[]> {
    try {
      console.log('🔧 StatisticsService: Calculating top performers with EXACT logic');
      
      const allOrders = await this.getWorkOrders();
      const userStats: Record<string, {
        name: string;
        hours: number;
        orders: number;
        revenue: number;
        plannedHours: number;
      }> = {};

      // EXACT same aggregation logic
      allOrders.forEach(order => {
        const hours = Number(order.totalHours) || 0;
        const revenue = hours * HOURLY_RATE;
        const plannedHours = order.entries?.reduce((sum, entry) => 
          sum + (Number(entry.plannedHours) || 0), 0) || 0;

        if (order.userId && order.userName) {
          if (!userStats[order.userId]) {
            userStats[order.userId] = {
              name: order.userName,
              hours: 0,
              orders: 0,
              revenue: 0,
              plannedHours: 0
            };
          }
          
          userStats[order.userId].hours += hours;
          userStats[order.userId].orders++;
          userStats[order.userId].revenue += revenue;
          userStats[order.userId].plannedHours += plannedHours;
        }
      });

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
        .slice(0, limit);

      console.log('✅ StatisticsService: Top performers:', topPerformers.map(p => 
        `${p.name}: ${p.hours.toFixed(1)}u, €${p.revenue.toFixed(2)}`
      ));

      return topPerformers;
    } catch (error) {
      console.error('❌ StatisticsService: Error calculating top performers:', error);
      throw error;
    }
  }

  /**
   * Get top performers for specific month
   */
  static async getMonthlyTopPerformers(month: string, limit: number = 10): Promise<TopPerformer[]> {
    try {
      console.log('🔧 StatisticsService: Getting monthly top performers for:', month);
      
      const [year, monthNum] = month.split('-').map(Number);
      const monthStart = new Date(year, monthNum - 1, 1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(year, monthNum, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      const monthOrders = await this.getWorkOrders({
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString().split('T')[0]
      });
      
      const userStats: Record<string, {
        name: string;
        hours: number;
        orders: number;
        revenue: number;
        plannedHours: number;
      }> = {};

      monthOrders.forEach(order => {
        const hours = Number(order.totalHours) || 0;
        const revenue = hours * HOURLY_RATE;
        const plannedHours = order.entries?.reduce((sum, entry) => 
          sum + (Number(entry.plannedHours) || 0), 0) || 0;

        if (order.userId && order.userName) {
          if (!userStats[order.userId]) {
            userStats[order.userId] = {
              name: order.userName,
              hours: 0,
              orders: 0,
              revenue: 0,
              plannedHours: 0
            };
          }
          
          userStats[order.userId].hours += hours;
          userStats[order.userId].orders++;
          userStats[order.userId].revenue += revenue;
          userStats[order.userId].plannedHours += plannedHours;
        }
      });

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
        .slice(0, limit);

      console.log('✅ StatisticsService: Monthly top performers:', topPerformers.length);
      return topPerformers;
    } catch (error) {
      console.error('❌ StatisticsService: Error getting monthly top performers:', error);
      throw error;
    }
  }

  /**
   * Get recent activity
   */
  static async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const recentOrders = await this.getWorkOrders();
      
      const recentActivity = recentOrders
        .slice(0, limit)
        .map(order => ({
          id: order.id,
          type: 'workorder' as const,
          description: `Werkbon ${order.status === 'sent' ? 'verzonden' : order.status === 'pending' ? 'ingediend' : 'aangemaakt'} - ${order.entries?.length || 0} locatie${order.entries?.length !== 1 ? 's' : ''}`,
          timestamp: order.timestamp,
          user: order.userName || 'Onbekend'
        }));

      return recentActivity;
    } catch (error) {
      console.error('❌ StatisticsService: Error fetching recent activity:', error);
      throw error;
    }
  }

  /**
   * Get user weekly statistics using EXACT same logic
   */
  static async getUserWeeklyStats(userId: string): Promise<{
    currentWeekHours: number;
    weeklyStats: Array<{ weekNumber: number; totalHours: number }>;
    averageWeeklyHours: number;
  }> {
    try {
      console.log('🔧 StatisticsService: Getting user weekly stats with EXACT logic for:', userId);
      
      // Get last 4 weeks of data
      const today = new Date();
      const fourWeeksAgo = new Date(today);
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const orders = await this.getWorkOrders({
        userId,
        startDate: fourWeeksAgo.toISOString()
      });

      // Get current week boundaries using EXACT same logic
      const weekStart = getStartOfWeek();
      const weekEnd = getEndOfWeek();

      const weeklyData: Record<number, number> = {};
      let currentWeekHours = 0;

      orders.forEach(order => {
        const weekNum = getWeekNumber(order.timestamp);
        const hours = Number(order.totalHours) || 0;
        
        weeklyData[weekNum] = (weeklyData[weekNum] || 0) + hours;
        
        // Current week calculation using EXACT same boundary check
        if (order.timestamp >= weekStart && order.timestamp <= weekEnd) {
          currentWeekHours += hours;
        }
      });

      const weeklyStats = Object.entries(weeklyData)
        .map(([weekNumber, hours]) => ({
          weekNumber: parseInt(weekNumber),
          totalHours: hours
        }))
        .sort((a, b) => b.weekNumber - a.weekNumber);

      const currentWeekNumber = getWeekNumber(today.toISOString());
      const previousWeeks = weeklyStats.filter(stat => stat.weekNumber !== currentWeekNumber);
      const averageWeeklyHours = previousWeeks.length > 0 
        ? previousWeeks.reduce((sum, stat) => sum + stat.totalHours, 0) / previousWeeks.length 
        : 0;

      console.log('✅ StatisticsService: User weekly stats:', {
        userId,
        currentWeekHours: currentWeekHours.toFixed(2),
        weeklyStatsCount: weeklyStats.length,
        averageWeeklyHours: averageWeeklyHours.toFixed(2)
      });

      return {
        currentWeekHours,
        weeklyStats,
        averageWeeklyHours
      };
    } catch (error) {
      console.error('❌ StatisticsService: Error calculating user weekly stats:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive user statistics
   */
  static async getUserOverallStats(userId: string): Promise<PersonalStats> {
    try {
      console.log('🔧 StatisticsService: Getting comprehensive user stats for:', userId);
      
      // Get all work orders for this user
      const allOrders = await this.getWorkOrders({ userId });
      
      // Get weekly stats
      const weeklyStats = await this.getUserWeeklyStats(userId);
      
      // Calculate comprehensive statistics
      const totalHours = allOrders.reduce((sum, order) => sum + (Number(order.totalHours) || 0), 0);
      const totalKilometers = allOrders.reduce((sum, order) => sum + (Number(order.kilometers) || 0), 0);
      
      // Find the most recent work order date
      let lastWorkOrderDate: string | undefined;
      if (allOrders.length > 0) {
        lastWorkOrderDate = allOrders[0].timestamp;
      }
      
      const stats: PersonalStats = {
        totalHoursWorked: totalHours,
        totalWorkOrdersCompleted: allOrders.length,
        totalKilometersDriven: totalKilometers,
        lastWorkOrderDate,
        averageHourlyRate: HOURLY_RATE,
        weeklyStats: weeklyStats.weeklyStats,
        currentWeekHours: weeklyStats.currentWeekHours,
        averageWeeklyHours: weeklyStats.averageWeeklyHours
      };
      
      console.log('✅ StatisticsService: User overall stats:', {
        userId,
        totalHours: stats.totalHoursWorked.toFixed(2),
        totalOrders: stats.totalWorkOrdersCompleted,
        totalKilometers: stats.totalKilometersDriven.toFixed(2)
      });
      
      return stats;
    } catch (error) {
      console.error('❌ StatisticsService: Error calculating user overall stats:', error);
      throw error;
    }
  }
}