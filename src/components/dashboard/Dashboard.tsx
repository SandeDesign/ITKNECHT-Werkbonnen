// src/components/layout/MobileBottomBar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Plus, 
  ClipboardList, 
  Calendar as CalendarIcon,
  MoreHorizontal,
  Users,
  Contact,
  FileText,
  MessageSquare,
  Settings,
  X,
  BarChart3,
  CheckSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

interface MobileBottomBarProps {
  className?: string;
}

const MobileBottomBar: React.FC<MobileBottomBarProps> = ({ className = "" }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { notificationCount } = useNotifications();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Primaire acties (altijd zichtbaar)
  const primaryActions = [
    { 
      icon: Home, 
      label: 'Home', 
      path: '/dashboard'
    },
    { 
      icon: Plus, 
      label: 'Werkbon+', 
      path: '/dashboard/create',
      highlight: true // Speciale styling voor belangrijkste actie
    },
    { 
      icon: ClipboardList, 
      label: 'Taken', 
      path: '/dashboard/werkbonnen'
    },
    { 
      icon: CalendarIcon, 
      label: 'Agenda', 
      path: '/dashboard/calendar'
    }
  ];

  // Secundaire acties (in more menu)
  const secondaryActions = [
    { 
      icon: Users, 
      label: 'Collega\'s', 
      path: '/dashboard/colleagues'
    },
    { 
      icon: Contact, 
      label: 'Contacten', 
      path: '/dashboard/contacts'
    },
    { 
      icon: FileText, 
      label: 'Bronnen', 
      path: '/dashboard/resources'
    },
    { 
      icon: MessageSquare, 
      label: 'Ideeën bus', 
      path: '/dashboard/feedback'
    },
    { 
      icon: BarChart3, 
      label: 'Mijn Statistieken', 
      path: '/dashboard/my-statistics'
    },
    { 
      icon: CheckSquare, 
      label: 'Mijn Taken', 
      path: '/dashboard/tasks'
    },
    { 
      icon: Settings, 
      label: 'Instellingen', 
      path: '/dashboard/settings'
    }
  ];

  // Voeg admin panel toe voor admin users
  if (user?.role === 'admin') {
    secondaryActions.push({
      icon: Settings,
      label: 'Admin Panel',
      path: '/dashboard/admin'
    });
  }

  const isActiveLink = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleMoreMenuToggle = () => {
    setShowMoreMenu(!showMoreMenu);
  };

  const handleMenuItemClick = () => {
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* More Menu Overlay */}
      {showMoreMenu && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowMoreMenu(false)}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            style={{ bottom: '80px' }}
          />
          
          {/* Menu */}
          <div className="lg:hidden fixed bottom-20 left-4 right-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Meer opties
              </h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Sluit menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Secondary Actions */}
            <div className="py-2 max-h-80 overflow-y-auto">
              {secondaryActions.map(action => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.path}
                    to={action.path}
                    onClick={handleMenuItemClick}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg mx-2"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Main Bottom Bar */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 ${className}`}>
        {/* Safe area padding voor iOS */}
        <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="grid grid-cols-5 h-16 px-2">
            {/* Primaire acties */}
            {primaryActions.map(action => {
              const Icon = action.icon;
              const isActive = isActiveLink(action.path);
              
              return (
                <div key={action.path} className="flex items-center justify-center">
                  <Link 
                    to={action.path}
                    className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 relative w-full h-full ${
                      isActive 
                        ? 'text-purple-600 dark:text-purple-400' 
                        : 'text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400'
                    } ${action.highlight ? 'transform hover:scale-105' : ''}`}
                  >
                    {/* Highlight background voor belangrijkste actie */}
                    {action.highlight && (
                      <div className={`absolute -top-1 -left-1 w-12 h-12 rounded-full transition-all duration-200 ${
                        isActive 
                          ? 'bg-purple-100 dark:bg-purple-900/30' 
                          : 'bg-transparent hover:bg-purple-50 dark:hover:bg-purple-900/20'
                      }`} />
                    )}
                    
                    {/* Icon container */}
                    <div className={`relative p-2 rounded-xl transition-all duration-200 ${
                      action.highlight 
                        ? (isActive 
                            ? 'bg-purple-600 text-white shadow-lg' 
                            : 'bg-purple-500 text-white shadow-md hover:shadow-lg hover:bg-purple-600'
                          )
                        : ''
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    {/* Label */}
                    <span className={`text-xs font-medium transition-all duration-200 ${
                      action.highlight && isActive ? 'text-purple-600 dark:text-purple-400' : ''
                    }`}>
                      {action.label}
                    </span>
                    
                    {/* Active indicator voor normale acties */}
                    {isActive && !action.highlight && (
                      <div className="absolute -bottom-2 w-1 h-1 bg-purple-600 dark:bg-purple-400 rounded-full transition-all duration-200" />
                    )}
                  </Link>
                </div>
              );
            })}
            
            {/* More button */}
            <div className="flex items-center justify-center">
              <button
                onClick={handleMoreMenuToggle}
                className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 relative w-full h-full ${
                  showMoreMenu 
                    ? 'text-purple-600 dark:text-purple-400' 
                    : 'text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400'
                }`}
                aria-label="Meer opties"
              >
                {/* Notificatie badge */}
                {notificationCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  </div>
                )}
                
                <div className="p-2">
                  <MoreHorizontal className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">Meer</span>
                
                {/* Active indicator voor more menu */}
                {showMoreMenu && (
                  <div className="absolute -bottom-2 w-1 h-1 bg-purple-600 dark:bg-purple-400 rounded-full transition-all duration-200" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileBottomBar;