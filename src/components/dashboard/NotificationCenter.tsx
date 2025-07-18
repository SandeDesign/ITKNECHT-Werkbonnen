import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Settings, Check } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import Button from '../ui/Button';

const NotificationCenter = () => {
  const { 
    notifications, 
    notificationCount, 
    markAsRead,
    markAllAsRead,
    notificationsEnabled,
    requestPermission,
    toggleNotifications
  } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Sluit notificaties bij klikken buiten het paneel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (id: number) => {
    markAsRead(id);
  };
  
  const handleDeleteAll = () => {
    markAllAsRead();
    setShowNotifications(false);
  };

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      try {
        await toggleNotifications(false);
      } catch (error) {
        console.error('Error disabling notifications:', error);
      }
    } else {
      try {
        await requestPermission();
      } catch (error) {
        console.error('Error enabling notifications:', error);
      }
    }
  };

  return (
    <div className="relative" ref={notificationRef}>
      <button 
        className="relative p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell className="h-6 w-6" />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-primary-600 text-white text-xs font-medium">
            {notificationCount}
          </span>
        )}
      </button>
      
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-12 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Meldingen</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleToggleNotifications}
                    className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {notificationsEnabled ? 'Uitschakelen' : 'Inschakelen'}
                  </button>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {!notificationsEnabled && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
                  <div className="flex items-start">
                    <Settings className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Pushmeldingen zijn uitgeschakeld
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Schakel pushmeldingen in om op de hoogte te blijven, zelfs als de app gesloten is.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        className="mt-2"
                        onClick={() => requestPermission()}
                      >
                        Inschakelen
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Geen meldingen
                </div>
              ) : (
                <>
                  <div className="p-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {notificationCount} ongelezen
                    </span>
                    <button
                      onClick={handleDeleteAll}
                      className="text-xs text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300 flex items-center"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Alles verwijderen
                    </button>
                  </div>
                  
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id)}
                      className={`p-4 border-b border-gray-200 dark:border-gray-700 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                        !notification.read ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title} 
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification.id);
                              }}
                              className="ml-2 text-error-600 hover:text-error-700 dark:text-error-400"
                            >
                              <X className="h-3 w-3 inline" />
                            </button>
                          </h4>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(notification.timestamp).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 bg-primary-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;