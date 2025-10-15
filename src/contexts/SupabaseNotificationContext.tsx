import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { SupabaseNotificationService } from '../services/SupabaseNotificationService';
import { AppNotification, NotificationPreferences } from '../lib/supabase';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAsClicked: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  updatePreferences: (prefs: Partial<Omit<NotificationPreferences, 'user_id' | 'updated_at'>>) => Promise<boolean>;
  requestBrowserPermission: () => Promise<boolean>;
  browserPermissionStatus: 'granted' | 'denied' | 'default' | 'unsupported';
  refreshNotifications: () => Promise<void>;
}

const SupabaseNotificationContext = createContext<NotificationContextType | null>(null);

export const SupabaseNotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [browserPermissionStatus, setBrowserPermissionStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>(
    SupabaseNotificationService.getBrowserPermissionStatus()
  );

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      const [notifs, count, prefs] = await Promise.all([
        SupabaseNotificationService.getNotifications(user.id),
        SupabaseNotificationService.getUnreadCount(user.id),
        SupabaseNotificationService.getPreferences(user.id)
      ]);

      setNotifications(notifs);
      setUnreadCount(count);
      setPreferences(prefs);

      await SupabaseNotificationService.cachePreferences(user.id);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshNotifications = async () => {
    if (!user?.id) return;
    await loadNotifications();
  };

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
      setIsLoading(false);
      return;
    }

    loadNotifications();

    const unsubscribe = SupabaseNotificationService.subscribeToNotifications(
      user.id,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      },
      (error) => {
        console.error('Notification subscription error:', error);
      }
    );

    const cleanupInterval = setInterval(() => {
      if (user?.id) {
        SupabaseNotificationService.cleanupOldNotifications(user.id);
      }
    }, 24 * 60 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(cleanupInterval);
    };
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    const success = await SupabaseNotificationService.markAsRead(id);
    if (success) {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAsClicked = async (id: string) => {
    const success = await SupabaseNotificationService.markAsClicked(id);
    if (success) {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, clicked: true, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    const success = await SupabaseNotificationService.markAllAsRead(user.id);
    if (success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (id: string) => {
    const success = await SupabaseNotificationService.deleteNotification(id);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const updatePreferences = async (prefs: Partial<Omit<NotificationPreferences, 'user_id' | 'updated_at'>>) => {
    if (!user?.id) return false;

    const success = await SupabaseNotificationService.updatePreferences(user.id, prefs);
    if (success) {
      await loadNotifications();
    }
    return success;
  };

  const requestBrowserPermission = async () => {
    const granted = await SupabaseNotificationService.requestBrowserPermission();
    setBrowserPermissionStatus(SupabaseNotificationService.getBrowserPermissionStatus());

    if (granted && user?.id) {
      await updatePreferences({ push_notifications_enabled: true });
    }

    return granted;
  };

  return (
    <SupabaseNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        isLoading,
        markAsRead,
        markAsClicked,
        markAllAsRead,
        deleteNotification,
        updatePreferences,
        requestBrowserPermission,
        browserPermissionStatus,
        refreshNotifications
      }}
    >
      {children}
    </SupabaseNotificationContext.Provider>
  );
};

export const useSupabaseNotifications = () => {
  const context = useContext(SupabaseNotificationContext);
  if (!context) {
    throw new Error('useSupabaseNotifications must be used within a SupabaseNotificationProvider');
  }
  return context;
};
