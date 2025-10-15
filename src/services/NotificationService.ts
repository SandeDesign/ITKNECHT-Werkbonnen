import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, updateDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getApp } from 'firebase/app';

// Vapid key voor web push notificaties
const VAPID_KEY = 'BOH3HEQ6IkFOtCBBNUho-jI_hjor20RTJY2uIPHzuP7m6KSs5lvDy8mvuioszt4CgSpVxjaW-cGvfsjzTkl0zW4';

// Check if running in StackBlitz WebContainer
const isWebContainer = typeof window !== 'undefined' && window.location.hostname.includes('webcontainer');

// Detecteer of de app geinstalleerd is als PWA
const isPWAInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check voor standalone mode (iOS Safari)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Check voor iOS Safari specifiek
  const isIOSStandalone = (window.navigator as any).standalone === true;

  // Check voor Android Chrome
  const isAndroidStandalone = document.referrer.includes('android-app://');

  return isStandalone || isIOSStandalone || isAndroidStandalone;
};

// Detecteer device type
const getDeviceType = (): 'ios' | 'android' | 'web' => {
  if (typeof window === 'undefined') return 'web';

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  } else if (/android/.test(userAgent)) {
    return 'android';
  }

  return 'web';
};

// Detecteer device naam
const getDeviceName = (): string => {
  if (typeof window === 'undefined') return 'Unknown Device';

  const userAgent = window.navigator.userAgent;

  // iOS devices
  if (/iPhone/.test(userAgent)) return 'iPhone';
  if (/iPad/.test(userAgent)) return 'iPad';
  if (/iPod/.test(userAgent)) return 'iPod';

  // Android devices
  if (/Android/.test(userAgent)) {
    const match = userAgent.match(/Android.*?;\s*([^;)]+)/);
    if (match && match[1]) {
      return match[1].trim();
    }
    return 'Android Device';
  }

  // Desktop browsers
  if (/Chrome/.test(userAgent)) return 'Chrome Browser';
  if (/Firefox/.test(userAgent)) return 'Firefox Browser';
  if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) return 'Safari Browser';
  if (/Edge/.test(userAgent)) return 'Edge Browser';

  return 'Web Browser';
};

export class NotificationService {
  private static readonly FCM_TOKEN_KEY = 'itknecht_fcm_token';
  private static readonly DEVICE_ID_KEY = 'itknecht_device_id';

  static async requestPermission(userId: string): Promise<boolean> {
    try {
      console.log('Requesting notification permission...');

      // In WebContainer, we'll simulate permission without actual FCM
      if (isWebContainer) {
        console.log('Running in WebContainer - simulating notification permission');
        
        // Update user document directly to avoid recursion
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          notificationsEnabled: true,
          updatedAt: new Date().toISOString()
        });
        
        // Store a simulated token in localStorage
        localStorage.setItem(this.FCM_TOKEN_KEY, 'simulated-fcm-token-for-webcontainer');
        return true;
      }
      
      // Vraag toestemming voor notificaties
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }
      
      console.log('Notification permission granted');
      
      // Register FCM token and store it
      const token = await this.registerFCMToken(userId);
      if (token) {
        // Store token in localStorage for persistence
        localStorage.setItem(this.FCM_TOKEN_KEY, token);
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
  
  static async registerFCMToken(userId: string): Promise<string | null> {
    try {
      // In WebContainer, skip actual FCM token registration
      if (isWebContainer) {
        console.log('WebContainer environment - skipping FCM token registration');
        return 'simulated-fcm-token-for-webcontainer';
      }

      const app = getApp();
      const messaging = getMessaging(app);

      // FCM token ophalen
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });

      if (!token) {
        console.log('No FCM token available');
        return null;
      }

      console.log('FCM token received:', token);

      // Store token in Firestore
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        // Update existing user
        await updateDoc(userRef, {
          fcmTokens: {
            [token]: true
          },
          notificationsEnabled: true,
          updatedAt: new Date().toISOString(),
          fcmToken: token,
          fcmTokenUpdated: new Date().toISOString(),
          isPWA: isPWAInstalled(),
          deviceType: getDeviceType()
        });
      }

      // Registreer device in Supabase via SupabaseNotificationService
      try {
        const deviceType = getDeviceType();
        const deviceName = getDeviceName();

        // Dynamisch importeren om circular dependency te voorkomen
        const { SupabaseNotificationService } = await import('./SupabaseNotificationService');
        const deviceId = await SupabaseNotificationService.registerFCMDevice(
          userId,
          token,
          deviceType,
          deviceName
        );

        if (deviceId) {
          localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
          console.log('Device registered in Supabase:', deviceId);
        }
      } catch (supabaseError) {
        console.error('Error registering device in Supabase:', supabaseError);
      }

      return token;
    } catch (error) {
      console.error('Error registering FCM token:', error);
      return null;
    }
  }
  
  static async unregisterFCMToken(userId: string, token: string): Promise<boolean> {
    try {
      // Remove from localStorage
      localStorage.removeItem(this.FCM_TOKEN_KEY);
      const deviceId = localStorage.getItem(this.DEVICE_ID_KEY);

      const userRef = doc(db, 'users', userId);

      await updateDoc(userRef, {
        [`fcmTokens.${token}`]: false,
        notificationsEnabled: false,
        updatedAt: new Date().toISOString(),
        fcmToken: null
      });

      // Deactiveer device in Supabase
      if (deviceId || token) {
        try {
          const { SupabaseNotificationService } = await import('./SupabaseNotificationService');
          await SupabaseNotificationService.deactivateFCMDevice(token);
          localStorage.removeItem(this.DEVICE_ID_KEY);
        } catch (supabaseError) {
          console.error('Error deactivating device in Supabase:', supabaseError);
        }
      }

      return true;
    } catch (error) {
      console.error('Error unregistering FCM token:', error);
      return false;
    }
  }
  
  static setupMessageListener(callback: (payload: any) => void): () => void {
    try {
      // In WebContainer, return a no-op function
      if (isWebContainer) {
        console.log('WebContainer environment - skipping FCM message listener');
        return () => {};
      }
      
      const app = getApp();
      const messaging = getMessaging(app);
      
      // Luister naar berichten in de voorgrond
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message received in foreground:', payload);
        callback(payload);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up message listener:', error);
      return () => {};
    }
  }
  
  static async getUserNotificationSettings(userId: string): Promise<{
    enabled: boolean;
    tokens: string[];
  }> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return { enabled: false, tokens: [] };
      }
      
      const userData = userDoc.data();
      
      // Check for stored token in localStorage
      const storedToken = localStorage.getItem(this.FCM_TOKEN_KEY);
      
      const fcmTokens = userData.fcmTokens || {};
      const activeTokens = Object.entries(fcmTokens)
        .filter(([_, active]) => active)
        .map(([token]) => token);
      
      // If we have a stored token but it's not in Firestore, update Firestore
      if (storedToken && !activeTokens.includes(storedToken) && userData.notificationsEnabled !== false) {
        this.registerFCMToken(userId);
      }
      
      // If we have active tokens in Firestore but none in localStorage, store the first one
      if (!storedToken && activeTokens.length > 0) {
        localStorage.setItem(this.FCM_TOKEN_KEY, activeTokens[0]);
      }
      
      return {
        enabled: userData.notificationsEnabled || false,
        tokens: activeTokens
      };
    } catch (error) {
      console.error('Error getting user notification settings:', error);
      return { enabled: false, tokens: [] };
    }
  }
  
  static async updateNotificationSettings(userId: string, enabled: boolean): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (enabled) {
        // If enabling, check if permission is already granted
        if (Notification.permission === 'granted') {
          // If permission is already granted, just register the token
          const token = await this.registerFCMToken(userId);
          if (token) localStorage.setItem(this.FCM_TOKEN_KEY, token);
          return true;
        } else {
          // If permission is not granted, request it
          return await this.requestPermission(userId);
        }
      } else {
        // If disabling, update settings and remove token
        const storedToken = localStorage.getItem(this.FCM_TOKEN_KEY);
        if (storedToken) {
          // Unregister the token
          if (userDoc.exists()) {
            await updateDoc(userRef, {
              [`fcmTokens.${storedToken}`]: false,
              notificationsEnabled: false,
              updatedAt: new Date().toISOString(),
              fcmToken: null
            });
          }
        } else {
          // If no stored token, just update settings
          await updateDoc(userRef, {
            notificationsEnabled: false,
            updatedAt: new Date().toISOString(),
            fcmToken: null
          });
        }
        
        // Remove from localStorage
        localStorage.removeItem(this.FCM_TOKEN_KEY);
        return true;
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return false;
    }
  }
  
  // Check if notifications are currently enabled
  static isNotificationsEnabled(): boolean {
    return !!localStorage.getItem(this.FCM_TOKEN_KEY) || Notification.permission === 'granted';
  }

  // Check if app is installed as PWA
  static isPWA(): boolean {
    return isPWAInstalled();
  }

  // Get device information
  static getDeviceInfo(): { type: string; name: string; isPWA: boolean } {
    return {
      type: getDeviceType(),
      name: getDeviceName(),
      isPWA: isPWAInstalled()
    };
  }
  
  // Initialize notifications on app start
  static async initializeNotifications(userId: string): Promise<boolean> {
    try {
      console.log('🔔 Initializing notifications for user:', userId);
      console.log('🔔 Device info:', this.getDeviceInfo());

      // Check if we have a stored token
      const storedToken = localStorage.getItem(this.FCM_TOKEN_KEY);

      if (storedToken) {
        console.log('🔔 Found stored FCM token, validating...');

        // Validate token with Firestore
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const fcmTokens = userData.fcmTokens || {};

          // If token is not in Firestore or is marked as inactive, register it again
          if (!fcmTokens[storedToken] || fcmTokens[storedToken] !== true) {
            console.log('🔔 Stored token is invalid or inactive, registering new token');
            return await this.requestPermission(userId);
          }

          console.log('🔔 Stored token is valid, notifications are enabled');

          // Update device last_used in Supabase
          try {
            const { SupabaseNotificationService } = await import('./SupabaseNotificationService');
            await SupabaseNotificationService.updateDeviceLastUsed(storedToken);
          } catch (error) {
            console.error('Error updating device last used:', error);
          }

          // Make sure notificationsEnabled is set to true in Firestore
          if (!userData.notificationsEnabled) {
            await updateDoc(userRef, {
              notificationsEnabled: true,
              updatedAt: new Date().toISOString()
            });
          }

          return true;
        }
      }

      // If no stored token or user doesn't exist, check if notifications are enabled in Firestore
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // If notifications were previously enabled or we have permission, request again
        if (userData.notificationsEnabled || Notification.permission === 'granted') {
          console.log('🔔 Notifications enabled in Firestore but no valid token, requesting permission');
          return await this.requestPermission(userId);
        }
      }

      return false;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }
  
  // Show a custom in-app notification
  private static showCustomNotification(title: string, body: string, url?: string) {
    // Create notification element
    const notificationEl = document.createElement('div');
    notificationEl.className = 'fixed top-4 right-4 bg-primary-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm animate-fade-in';
    
    notificationEl.innerHTML = `
      <div class="flex items-start">
        <div class="flex-1">
          <h4 class="font-medium">${title}</h4>
          <p class="text-sm mt-1">${body}</p>
        </div>
        <button class="ml-4 text-white hover:text-gray-200">&times;</button>
      </div>
    `;
    
    // Add click handler
    notificationEl.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).tagName === 'BUTTON') {
        notificationEl.remove();
      } else if (url) {
        window.location.href = url;
      }
    });
    
    // Add to DOM
    document.body.appendChild(notificationEl);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notificationEl.parentNode) {
        notificationEl.remove();
      }
    }, 5000);
  }
  
  // Check if notifications are supported in this browser
  static isNotificationSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }
  
  // Auto-enable notifications if permission is already granted
  static async autoEnableNotifications(userId: string): Promise<boolean> {
    if (Notification.permission === 'granted') {
      console.log('🔔 Notification permission already granted, auto-enabling');
      
      // Check if we already have a token
      const storedToken = localStorage.getItem(this.FCM_TOKEN_KEY);
      if (storedToken) {
        // If we have a token, validate it
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const fcmTokens = userData.fcmTokens || {};
          
          // If token is valid, just update notificationsEnabled
          if (fcmTokens[storedToken] === true) {
            if (!userData.notificationsEnabled) {
              await updateDoc(userRef, {
                notificationsEnabled: true,
                updatedAt: new Date().toISOString()
              });
            }
            return true;
          }
        }
      }
      
      // If no token or invalid token, register a new one
      const token = await this.registerFCMToken(userId);
      if (token) {
        localStorage.setItem(this.FCM_TOKEN_KEY, token);
        return true;
      }
    }
    return false;
  }
  
  // Get the stored FCM token
  static getStoredToken(): string | null {
    return localStorage.getItem(this.FCM_TOKEN_KEY);
  }
  
  // Update user notification settings directly
  static async updateUserNotificationSettings(userId: string, enabled: boolean): Promise<boolean> {
    try {
      // Use the updateNotificationSettings method to avoid duplication
      return await this.updateNotificationSettings(userId, enabled);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return false;
    }
  }
  
  // Simulate sending a notification (for testing in WebContainer)
  static async simulateNotification(userId: string, title: string, body: string): Promise<boolean> {
    try {
      // Add to notifications collection in Firestore
      await addDoc(collection(db, 'notifications'), {
        userId,
        title,
        body,
        timestamp: new Date().toISOString(),
        read: false
      });

      // Create a browser notification if permission is granted
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/icon-192.png'
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error simulating notification:', error);
      return false;
    }
  }
}