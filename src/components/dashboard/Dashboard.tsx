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
  Home,
  BookOpen,
  Calendar,
  Phone
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
        <div className="flex flex-col h-full">
          {/* Logo & Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IT</span>
              </div>
              <span className="text-gray-900 dark:text-white font-semibold">IT Knecht</span>
            </div>
            <button
              onClick={closeSidebar}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 dark:text-white font-medium truncate">
                  {user?.displayName || 'Gebruiker'}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm truncate">
                  {user?.email}
                </p>
                {user?.role === 'admin' && (
                  <span className="inline-block bg-purple-600 text-white text-xs px-2 py-1 rounded mt-1">
                    Admin
                  </span>
                )}
              </div>
            </div>

            {/* Settings & Logout */}
            <div className="space-y-2">
              <Link
                to="/dashboard/settings"
                onClick={closeSidebar}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm">Instellingen</span>
              </Link>
              <button
                onClick={() => { handleLogout(); closeSidebar(); }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Uitloggen</span>
              </button>
            </div>
          </div>
        </div>
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
            <Link to="/dashboard/resources" className={`flex flex-col items-center justify-center space-y-1 transition-colors ${location.pathname === '/dashboard/resources' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400'}`}>
              <BookOpen className="h-5 w-5" />
              <span className="text-xs">Bronnen</span>
            </Link>
            <Link to="/dashboard/create" className={`flex flex-col items-center justify-center space-y-1 transition-colors ${location.pathname === '/dashboard/create' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400'}`}>
              <Plus className="h-5 w-5" />
              <span className="text-xs">Werkbon+</span>
            </Link>
            <Link to="/dashboard/agenda" className={`flex flex-col items-center justify-center space-y-1 transition-colors ${location.pathname === '/dashboard/agenda' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400'}`}>
              <Calendar className="h-5 w-5" />
              <span className="text-xs">Agenda</span>
            </Link>
            <Link to="/dashboard/contacts" className={`flex flex-col items-center justify-center space-y-1 transition-colors ${location.pathname === '/dashboard/contacts' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400'}`}>
              <Phone className="h-5 w-5" />
              <span className="text-xs">Contacten</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;