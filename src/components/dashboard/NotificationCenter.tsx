import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Settings, Check, CheckCheck, Filter, AlertCircle, CheckCircle, Package, MessageSquare, Megaphone } from 'lucide-react';
import { useSupabaseNotifications } from '../../contexts/SupabaseNotificationContext';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { NotificationType } from '../../lib/supabase';

const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAsClicked,
    markAllAsRead,
    deleteNotification,
    isLoading
  } = useSupabaseNotifications();

  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [filterType, setFilterType] = useState<NotificationType | 'ALL'>('ALL');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

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

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'TASK_COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'WORKORDER_STATUS':
        return <Package className="h-5 w-5 text-orange-500" />;
      case 'FEEDBACK_RECEIVED':
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case 'SYSTEM_ANNOUNCEMENT':
        return <Megaphone className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
      case 'TASK_COMPLETED':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
      case 'WORKORDER_STATUS':
        return 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20';
      case 'FEEDBACK_RECEIVED':
        return 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20';
      case 'SYSTEM_ANNOUNCEMENT':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800';
    }
  };

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    await markAsClicked(notification.id);
    setShowNotifications(false);

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Weet je zeker dat je alle notificaties wilt verwijderen?')) {
      return;
    }
    await markAllAsRead();
    setShowNotifications(false);
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterType !== 'ALL' && n.type !== filterType) return false;
    if (showOnlyUnread && n.read) return false;
    return true;
  });

  const getTypeLabel = (type: NotificationType | 'ALL') => {
    switch (type) {
      case 'ALL':
        return 'Alle';
      case 'TASK_ASSIGNED':
        return 'Nieuwe Taken';
      case 'TASK_COMPLETED':
        return 'Voltooide Taken';
      case 'WORKORDER_STATUS':
        return 'Werkbonnen';
      case 'FEEDBACK_RECEIVED':
        return 'Feedback';
      case 'SYSTEM_ANNOUNCEMENT':
        return 'Aankondigingen';
    }
  };

  return (
    <div className="relative" ref={notificationRef}>
      <button
        className="relative p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-red-600 text-white text-xs font-medium"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-12 right-0 w-96 max-h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Meldingen</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate('/dashboard/instellingen')}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Notificatie instellingen"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-2 flex-1">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as NotificationType | 'ALL')}
                    className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="ALL">Alle types</option>
                    <option value="TASK_ASSIGNED">Nieuwe Taken</option>
                    <option value="TASK_COMPLETED">Voltooide Taken</option>
                    <option value="WORKORDER_STATUS">Werkbonnen</option>
                    <option value="FEEDBACK_RECEIVED">Feedback</option>
                    <option value="SYSTEM_ANNOUNCEMENT">Aankondigingen</option>
                  </select>

                  <button
                    onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      showOnlyUnread
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Ongelezen
                  </button>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center whitespace-nowrap"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Alles gelezen
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-sm">Laden...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {showOnlyUnread
                      ? 'Geen ongelezen meldingen'
                      : filterType !== 'ALL'
                      ? `Geen ${getTypeLabel(filterType).toLowerCase()}`
                      : 'Geen meldingen'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-l-4 ${
                        !notification.read
                          ? 'bg-primary-50/50 dark:bg-primary-900/10 border-l-primary-600'
                          : 'border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notification.title}
                              </p>
                              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                {notification.body}
                              </p>
                              <div className="mt-2 flex items-center space-x-4">
                                <p className="text-xs text-gray-500">
                                  {new Date(notification.created_at).toLocaleDateString('nl-NL', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                  {getTypeLabel(notification.type)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="p-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                                  title="Markeer als gelezen"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="p-1 text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
                                title="Verwijder"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {filteredNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAll}
                  isFullWidth
                  className="text-xs"
                >
                  Alle notificaties verwijderen
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
