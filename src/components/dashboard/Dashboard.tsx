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
  CheckSquare,
  ChevronUp,
  Sparkles
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

  // Primaire acties (altijd zichtbaar) - BEHOUD ORIGINELE PATHS
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

  // Secundaire acties (in more menu) - BEHOUD ORIGINELE PATHS
  const secondaryActions = [
    { 
      icon: Users, 
      label: 'Collega\'s', 
      path: '/dashboard/colleagues',
      description: 'Bekijk je teamgenoten'
    },
    { 
      icon: Contact, 
      label: 'Contacten', 
      path: '/dashboard/contacts',
      description: 'Klant contactgegevens'
    },
    { 
      icon: FileText, 
      label: 'Bronnen', 
      path: '/dashboard/resources',
      description: 'Documentatie en tools'
    },
    { 
      icon: MessageSquare, 
      label: 'Ideeën bus', 
      path: '/dashboard/feedback',
      description: 'Deel je suggesties'
    },
    { 
      icon: BarChart3, 
      label: 'Mijn Statistieken', 
      path: '/dashboard/my-statistics',
      description: 'Je prestaties in cijfers'
    },
    { 
      icon: CheckSquare, 
      label: 'Mijn Taken', 
      path: '/dashboard/tasks',
      description: 'Overzicht van je taken'
    },
    { 
      icon: Settings, 
      label: 'Instellingen', 
      path: '/dashboard/settings',
      description: 'App voorkeuren'
    }
  ];

  // Voeg admin panel toe voor admin users - BEHOUD ORIGINELE LOGICA
  if (user?.role === 'admin') {
    secondaryActions.push({
      icon: Settings,
      label: 'Admin Panel',
      path: '/dashboard/admin',
      description: 'Systeembeheer'
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
      {/* ULTRA MODERN MORE MENU OVERLAY */}
      {showMoreMenu && (
        <>
          {/* Modern Backdrop met blur effect */}
          <div
            onClick={() => setShowMoreMenu(false)}
            className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-all duration-300"
            style={{ bottom: '88px' }}
          />
          
          {/* SLIDING MENU - ULTRA MODERN DESIGN */}
          <div className={`lg:hidden fixed bottom-24 left-2 right-2 transform transition-all duration-300 ease-out ${
            showMoreMenu 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-full opacity-0 scale-95 pointer-events-none'
          } z-50`}>
            
            {/* GLASSMORPHISM CONTAINER */}
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              
              {/* ELEGANT HEADER */}
              <div className="relative bg-gradient-to-r from-purple-600/5 via-blue-600/5 to-purple-600/5 dark:from-purple-400/10 dark:via-blue-400/10 dark:to-purple-400/10">
                <div className="flex items-center justify-between p-6 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Menu
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 -mt-0.5">
                        Alle functies binnen handbereik
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowMoreMenu(false)}
                    className="p-2.5 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 shadow-sm hover:shadow-md backdrop-blur-sm hover:scale-105"
                    aria-label="Sluit menu"
                  >
                    <ChevronUp className="h-5 w-5" />
                  </button>
                </div>
                
                {/* DECORATIVE GRADIENT LINE */}
                <div className="h-px bg-gradient-to-r from-transparent via-purple-300 dark:via-purple-700 to-transparent mx-6" />
              </div>
            
              {/* MENU ITEMS GRID - ULTRA MODERN */}
              <div className="p-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                <div className="grid grid-cols-1 gap-3">
                  {secondaryActions.map((action, index) => {
                    const Icon = action.icon;
                    const isActive = isActiveLink(action.path);
                    
                    return (
                      <Link
                        key={action.path}
                        to={action.path}
                        onClick={handleMenuItemClick}
                        className={`group relative flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                          isActive 
                            ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 shadow-lg shadow-purple-500/10 border border-purple-200/50 dark:border-purple-800/50' 
                            : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/50 dark:hover:from-gray-800/50 dark:hover:to-blue-900/20 text-gray-700 dark:text-gray-300'
                        }`}
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animation: showMoreMenu ? 'slideInUp 0.4s ease-out forwards' : 'none'
                        }}
                      >
                        {/* ICON CONTAINER - ULTRA MODERN */}
                        <div className={`relative p-3 rounded-xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 shadow-lg shadow-purple-500/20' 
                            : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 group-hover:text-purple-600 dark:group-hover:text-purple-400 shadow-md'
                        }`}>
                          <Icon className="h-5 w-5" />
                          
                          {/* ACTIVE PULSE INDICATOR */}
                          {isActive && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full">
                              <div className="absolute inset-0 bg-purple-600 dark:bg-purple-400 rounded-full animate-ping opacity-75" />
                            </div>
                          )}
                        </div>
                        
                        {/* CONTENT SECTION */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{action.label}</div>
                          {action.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                              {action.description}
                            </div>
                          )}
                        </div>
                        
                        {/* ACTIVE INDICATOR */}
                        {isActive && (
                          <div className="flex items-center justify-center w-6 h-6 bg-purple-600 dark:bg-purple-400 rounded-full shadow-lg">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                        
                        {/* MODERN HOVER GRADIENT OVERLAY */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/0 via-blue-600/0 to-purple-600/0 group-hover:from-purple-600/5 group-hover:via-blue-600/5 group-hover:to-purple-600/5 transition-all duration-300" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ULTRA MODERN MAIN BOTTOM BAR */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-30 ${className}`}>
        
        {/* GLASSMORPHISM CONTAINER */}
        <div className="relative">
          {/* FROSTED GLASS BACKGROUND */}
          <div className="absolute inset-0 bg-white/85 dark:bg-gray-900/85 backdrop-blur-2xl border-t border-gray-200/50 dark:border-gray-700/50 shadow-2xl" />
          
          {/* GRADIENT ACCENT LINE */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-purple-600/50 via-blue-600/50 to-purple-600/50" />
          
          {/* CONTENT */}
          <div className="relative" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex items-center justify-around h-20 px-4">
              
              {/* PRIMAIRE ACTIES - ULTRA MODERN STYLING */}
              {primaryActions.map((action, index) => {
                const Icon = action.icon;
                const isActive = isActiveLink(action.path);
                
                return (
                  <div key={action.path} className="relative">
                    <Link 
                      to={action.path}
                      className={`group relative flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
                        action.highlight ? 'p-2' : 'p-3'
                      }`}
                    >
                      {/* SUPER SPECIAL HIGHLIGHT VOOR CREATE BUTTON */}
                      {action.highlight ? (
                        <div className="relative">
                          {/* OUTER GLOW RING */}
                          <div className={`absolute -inset-3 rounded-2xl transition-all duration-300 ${
                            isActive 
                              ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 blur-lg' 
                              : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 group-hover:from-purple-600/30 group-hover:to-blue-600/30 blur-md group-hover:blur-lg'
                          }`} />
                          
                          {/* MAIN GRADIENT BACKGROUND */}
                          <div className={`absolute -inset-2 rounded-2xl transition-all duration-300 ${
                            isActive 
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-2xl shadow-purple-500/40' 
                              : 'bg-gradient-to-r from-purple-500 to-blue-500 group-hover:from-purple-600 group-hover:to-blue-600 shadow-xl group-hover:shadow-2xl shadow-purple-500/30'
                          }`} />
                          
                          {/* ICON CONTAINER */}
                          <div className="relative bg-white dark:bg-gray-900 p-3.5 rounded-xl shadow-lg">
                            <Icon className={`h-6 w-6 transition-all duration-200 ${
                              isActive 
                                ? 'text-purple-600 dark:text-purple-400 scale-110' 
                                : 'text-purple-500 group-hover:text-purple-600 dark:text-purple-400 group-hover:scale-110'
                            }`} />
                            
                            {/* SPARKLE EFFECT */}
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-300" />
                          </div>
                          
                          {/* FLOATING LABEL */}
                          <div className={`absolute -bottom-7 left-1/2 transform -translate-x-1/2 text-xs font-bold transition-all duration-200 ${
                            isActive 
                              ? 'text-purple-600 dark:text-purple-400 scale-105' 
                              : 'text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                          }`}>
                            {action.label}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-1.5">
                          {/* REGULAR MODERN ICON */}
                          <div className={`relative p-3 rounded-xl transition-all duration-200 ${
                            isActive 
                              ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 shadow-lg shadow-purple-500/20 scale-105' 
                              : 'text-gray-500 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 group-hover:text-purple-600 dark:text-gray-400 dark:group-hover:text-purple-400 group-hover:shadow-md'
                          }`}>
                            <Icon className="h-5 w-5" />
                            
                            {/* ACTIVE PULSE INDICATOR */}
                            {isActive && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full">
                                <div className="absolute inset-0 bg-purple-600 dark:bg-purple-400 rounded-full animate-ping opacity-75" />
                              </div>
                            )}
                          </div>
                          
                          {/* LABEL */}
                          <span className={`text-xs font-medium transition-all duration-200 ${
                            isActive 
                              ? 'text-purple-600 dark:text-purple-400 font-semibold' 
                              : 'text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                          }`}>
                            {action.label}
                          </span>
                        </div>
                      )}
                    </Link>
                  </div>
                );
              })}
              
              {/* ULTRA MODERN MORE BUTTON */}
              <div className="relative">
                <button
                  onClick={handleMoreMenuToggle}
                  className="group relative flex flex-col items-center justify-center p-3 transition-all duration-300 hover:scale-110 active:scale-95"
                  aria-label="Meer opties"
                >
                  {/* NOTIFICATION BADGE - BEHOUD ORIGINELE FUNCTIONALITEIT */}
                  {notificationCount > 0 && (
                    <div className="absolute -top-1 -right-1 z-10">
                      <div className="relative">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-xs font-bold text-white">
                            {notificationCount > 99 ? '99+' : notificationCount}
                          </span>
                        </div>
                        {/* PULSING NOTIFICATION RING */}
                        <div className="absolute inset-0 w-6 h-6 bg-red-500/40 rounded-full animate-ping" />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center space-y-1.5">
                    {/* MORE ICON */}
                    <div className={`p-3 rounded-xl transition-all duration-200 ${
                      showMoreMenu 
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 shadow-lg shadow-purple-500/20 scale-105 rotate-90' 
                        : 'text-gray-500 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 group-hover:text-purple-600 dark:text-gray-400 dark:group-hover:text-purple-400 group-hover:shadow-md'
                    }`}>
                      <MoreHorizontal className="h-5 w-5" />
                      
                      {/* ACTIVE INDICATOR */}
                      {showMoreMenu && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full">
                          <div className="absolute inset-0 bg-purple-600 dark:bg-purple-400 rounded-full animate-ping opacity-75" />
                        </div>
                      )}
                    </div>
                    
                    {/* LABEL */}
                    <span className={`text-xs font-medium transition-all duration-200 ${
                      showMoreMenu 
                        ? 'text-purple-600 dark:text-purple-400 font-semibold' 
                        : 'text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                    }`}>
                      Meer
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS ANIMATIONS */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 0.5rem;
        }
        
        .dark .scrollbar-thumb-gray-600::-webkit-scrollbar-thumb {
          background-color: #4b5563;
        }
        
        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </>
  );
};

export default MobileBottomBar;