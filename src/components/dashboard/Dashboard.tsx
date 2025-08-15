import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  LayoutDashboard, 
  Settings, 
  Users,
  LogOut, 
  Menu, 
  X, 
  Moon, 
  Sun,
  Bell,
  ClipboardList,
  Plus,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardHome from '../../pages/DashboardHome';
import Profile from '../dashboard/Profile';
import SettingsPage from '../dashboard/Settings';
import Werkbonnen from '../../pages/Werkbonnen';
import Overview from '../dashboard/Overview';
import Colleagues from '../../pages/Colleagues';
import UserSettings from '../dashboard/UserSettings';
import AdminPanel from '../dashboard/Settings';
import NotificationCenter from './NotificationCenter';

interface Notification {
  id: number;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, notificationCount, markAsRead } = useNotifications();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const baseNavigation = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Werkbon aanmaken', href: '/dashboard/create', icon: Plus },
    { name: 'Werkbonnen', href: '/dashboard/werkbonnen', icon: ClipboardList },
    { name: 'Collega\'s', href: '/dashboard/colleagues', icon: Users }
  ];

  const adminNavigation = [
    { name: 'Admin Panel', href: '/dashboard/admin', icon: Settings }
  ];

  const navigation = user?.role === 'admin' 
    ? [...baseNavigation, ...adminNavigation]
    : baseNavigation;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-900 bg-opacity-50 transition-opacity lg:hidden" 
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out`}
      >
        {/* Sidebar content */}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="h-16 flex items-center justify-between">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button
                  className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                  onClick={toggleSidebar}
                  aria-label="Open menu"
                  aria-label="Toggle menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div className="ml-4 lg:ml-0">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                  </h1>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <NotificationCenter />
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/create" element={<Overview />} />
            <Route path="/colleagues" element={<Colleagues />} />
            <Route path="/werkbonnen" element={<Werkbonnen />} />
            <Route path="/settings" element={<UserSettings />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        {/* Mobile Bottom Action Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10">
          <div className="grid grid-cols-5 h-16">
            <Link to="/dashboard" className={`flex flex-col items-center justify-center space-y-1 transition-colors ${location.pathname === '/dashboard' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400'}`}>
              <Home className="h-5 w-5" />
              <span className="text-xs">Home</span>
            </Link>
            <Link to="/dashboard/create" className={`flex flex-col items-center justify-center space-y-1 transition-colors ${location.pathname === '/dashboard/create' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400'}`}>
              <Plus className="h-5 w-5" />
              <span className="text-xs">Werkbon</span>
            </Link>
            <Link to="/dashboard/werkbonnen" className={`flex flex-col items-center justify-center space-y-1 transition-colors ${location.pathname === '/dashboard/werkbonnen' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400'}`}>
              <ClipboardList className="h-5 w-5" />
              <span className="text-xs">Werkbonnen</span>
            </Link>
            <Link to="/dashboard/colleagues" className={`flex flex-col items-center justify-center space-y-1 transition-colors ${location.pathname === '/dashboard/colleagues' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400'}`}>
              <Users className="h-5 w-5" />
              <span className="text-xs">Collega's</span>
            </Link>
            <button onClick={toggleSidebar} className="flex flex-col items-center justify-center space-y-1 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors">
              <Menu className="h-5 w-5" />
              <span className="text-xs">Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;