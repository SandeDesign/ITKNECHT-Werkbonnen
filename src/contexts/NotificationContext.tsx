import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { NotificationService } from '../services/NotificationService';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface NotificationContextType {
  notificationsEnabled: boolean;
  notificationCount: number;
  notifications: Notification[];
  requestPermission: () => Promise<boolean>;
  toggleNotifications: (enabled: boolean) => Promise<boolean>;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Notification) => void;
}

interface Notification {
  id: number;
  title: string;
  message: string; 
  timestamp: string;
  read: boolean;
  url?: string;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// Check if running in StackBlitz WebContainer
const isWebContainer = typeof window !== 'undefined' && window.location.hostname.includes('webcontainer');

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('notifications');
    try {
      const parsedNotifications = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsedNotifications) ? parsedNotifications : [];
    } catch (error) {
      console.error('Error parsing notifications from localStorage:', error);
      return [];
    }
  });

  // Initialize notifications when user logs in
  useEffect(() => {
    if (!user?.id) return;

    // Check if notifications should be enabled
    const checkNotificationStatus = async () => {
      try {
        // ONLY check stored settings - do NOT trigger autoEnableNotifications
        // AuthContext will handle the initialization
        const settings = await NotificationService.getUserNotificationSettings(user.id);
        setNotificationsEnabled(settings.enabled);

        // Setup message listener for foreground notifications
        NotificationService.setupMessageListener();
      } catch (error) {
        console.error('Error checking notification status:', error);
      }
    };

    checkNotificationStatus();
    
    // In WebContainer, listen for notifications from Firestore instead of FCM
    if (isWebContainer && user?.id) {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', user.id),
        orderBy('timestamp', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            addNotification({
              id: Date.now(),
              title: data.title,
              message: data.body || data.message,
              timestamp: data.timestamp,
              read: false,
              url: data.url
            });
          }
        });
      });
      return unsubscribe;
    }
  }, [user]);

  // Sla notificaties op in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications to localStorage:', error);
    }
  }, [notifications]);

  const requestPermission = async (): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      // Request permission using the service
      const granted = await NotificationService.requestPermission(user.id);
      setNotificationsEnabled(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const toggleNotifications = async (enabled: boolean): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      // Update notification settings using the service
      const success = await NotificationService.updateNotificationSettings(user.id, enabled);
      
      if (success) {
        setNotificationsEnabled(enabled);
      }
      
      return success;
    } catch (error) {
      console.error('Error toggling notifications:', error);
      return false;
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  };

  const markAllAsRead = () => {
    setNotifications([]);
    try {
      localStorage.removeItem('notifications');
    } catch (error) {
      console.error('Error removing notifications from localStorage:', error);
    }
  };

  const addNotification = (notification: Notification) => {
    // Ensure notification has a unique ID
    const notificationWithId = {
      ...notification,
      id: notification.id || Date.now()
    };
    setNotifications(prev => [notificationWithId, ...prev]);
  };

  const notificationCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notificationsEnabled,
      notificationCount,
      notifications,
      requestPermission,
      toggleNotifications,
      markAsRead,
      markAllAsRead,
      addNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};