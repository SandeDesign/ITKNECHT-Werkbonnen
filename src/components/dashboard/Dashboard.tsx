// src/components/layout/TopBar.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  RefreshCw,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

interface TopBarProps {
  className?: string;
}

const TopBar: React.FC<TopBarProps> = ({ className = "" }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { notificationCount, notifications } = useNotifications();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Page titles mapping
  const pageTitles: Record<string, { title: string; subtitle?: string }> = {
    '/dashboard': { title: 'Dashboard', subtitle: 'Welkom terug!' },
    '/dashboard/create': { title: 'Nieuwe Werkbon', subtitle: 'Maak een nieuwe werkbon aan' },
    '/dashboard/werkbonnen': { title: 'Mijn Werkbonnen', subtitle: 'Overzicht van je werkbonnen' },
    '/dashboard/calendar': { title: 'Planning', subtitle: 'Je agenda en afspraken' },
    '/dashboard/tasks': { title: 'Mijn Taken', subtitle: 'Openstaande taken' },
    '/dashboard/colleagues': { title: 'Collega\'s', subtitle: 'Team overzicht' },
    '/dashboard/contacts': { title: 'Contacten', subtitle: 'Klanten en leveranciers' },
    '/dashboard/resources': { title: 'Bronnen & Tools', subtitle: 'Documentatie en hulpmiddelen' },
    '/dashboard/feedback': { title: 'Ideeën Bus', subtitle: 'Deel je suggesties' },
    '/dashboard/my-statistics': { title: 'Mijn Statistieken', subtitle: 'Je prestaties in cijfers' },
    '/dashboard/settings': { title: 'Instellingen', subtitle: 'App voorkeuren' },
    '/dashboard/admin': { title: 'Admin Panel', subtitle: 'Systeembeheer' }
  };

  const currentPage = pageTitles[location.pathname] || { title: 'IT Knecht', subtitle: 'Werkbon Systeem' };

  // Effect voor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Effect voor tijd
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Effect voor fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('nl-NL', { 
      weekday: 'short',
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <div className={`hidden lg:flex items-center justify-between h-16 px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 ${className}`}>
      
      {/* Left Section - Page Info */}
      <div className="flex items-center space-x-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentPage.title}
          </h1>
          {currentPage.subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 -mt-0.5">
              {currentPage.subtitle}
            </p>
          )}
        </div>
        
        {/* Breadcrumb indicator */}
        <div className="hidden xl:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <span>IT Knecht</span>
          <span>/</span>
          <span className="text-purple-600 dark:text-purple-400 font-medium">
            {currentPage.title}
          </span>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek werkbonnen, contacten, taken..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
          />
          
          {/* Search results preview */}
          {searchQuery && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-50 max-h-80 overflow-y-auto">
              <div className="p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Zoeken naar "{searchQuery}"...
                </p>
                {/* Here you would implement actual search results */}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Section - Actions & Info */}
      <div className="flex items-center space-x-4">
        
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
              <Wifi className="h-4 w-4" />
              <span className="text-xs font-medium hidden xl:inline">Online</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
              <WifiOff className="h-4 w-4" />
              <span className="text-xs font-medium hidden xl:inline">Offline</span>
            </div>
          )}
        </div>

        {/* System Actions */}
        <div className="flex items-center space-x-1">
          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
            title="Vernieuwen"
          >
            <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
          </button>
          
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            title={darkMode ? 'Lichte modus' : 'Donkere modus'}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          
          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            title={isFullscreen ? 'Verlaat volledig scherm' : 'Volledig scherm'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200 hover:scale-105"
            title="Notificaties"
          >
            <Bell className="h-5 w-5" />
            
            {/* Notification Badge */}
            {notificationCount > 0 && (
              <div className="absolute -top-1 -right-1 z-10">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xs font-bold text-white">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                </div>
                <div className="absolute inset-0 w-5 h-5 bg-red-500/30 rounded-full animate-ping" />
              </div>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              {/* Backdrop */}
              <div
                onClick={() => setShowNotifications(false)}
                className="fixed inset-0 z-30"
              />
              
              {/* Notifications Panel */}
              <div className="absolute top-full mt-2 right-0 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-40 max-h-96 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-purple-600/5 to-blue-600/5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notificaties</h3>
                    <div className="flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400 font-medium">
                      <Zap className="h-3 w-3" />
                      <span>{notificationCount} nieuw</span>
                    </div>
                  </div>
                </div>
                
                {/* Notifications List */}
                <div className="max-h-64 overflow-y-auto">
                  {notifications && notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification, index) => (
                      <div
                        key={index}
                        className="p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                              {notification.title || 'Nieuwe notificatie'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {notification.timestamp ? new Date(notification.timestamp).toLocaleTimeString('nl-NL') : 'Nu'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Geen nieuwe notificaties</p>
                    </div>
                  )}
                </div>
                
                {/* Footer */}
                {notifications && notifications.length > 5 && (
                  <div className="p-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                    <button className="w-full text-sm text-purple-600 dark:text-purple-400 font-medium hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
                      Bekijk alle notificaties ({notifications.length})
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Time & Date */}
        <div className="hidden xl:flex flex-col text-right">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatTime(currentTime)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(currentTime)}
          </div>
        </div>

        {/* Quick User Info */}
        <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
          <div className="hidden xl:flex flex-col text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.displayName || 'Gebruiker'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {user?.role || 'Medewerker'}
            </div>
          </div>
          
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
            {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;