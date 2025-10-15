import { supabase, AppNotification, NotificationPreferences, NotificationType } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface FCMDevice {
  id: string;
  user_id: string;
  fcm_token: string;
  device_type: 'ios' | 'android' | 'web';
  device_name: string | null;
  is_active: boolean;
  last_used: string;
  created_at: string;
  updated_at: string;
}

export class SupabaseNotificationService {
  private static channel: RealtimeChannel | null = null;

  static async getNotifications(userId: string, limit: number = 50): Promise<AppNotification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  static async markAsClicked(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ clicked: true, read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as clicked:', error);
      return false;
    }
  }

  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all as read:', error);
      return false;
    }
  }

  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    metadata: Record<string, any> = {},
    actionUrl: string | null = null
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_notification_with_preferences', {
        p_user_id: userId,
        p_type: type,
        p_title: title,
        p_body: body,
        p_metadata: metadata,
        p_action_url: actionUrl
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  static async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        await supabase.rpc('create_default_notification_preferences', {
          p_user_id: userId
        });

        const { data: newData, error: newError } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (newError) throw newError;
        return newData;
      }

      return data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }
  }

  static async updatePreferences(
    userId: string,
    preferences: Partial<Omit<NotificationPreferences, 'user_id' | 'updated_at'>>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  static subscribeToNotifications(
    userId: string,
    onNewNotification: (notification: AppNotification) => void,
    onError?: (error: Error) => void
  ): () => void {
    if (this.channel) {
      this.channel.unsubscribe();
    }

    this.channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new) {
            onNewNotification(payload.new as AppNotification);

            const prefs = this.getPreferencesSync();
            if (prefs?.notification_sound_enabled) {
              this.playNotificationSound();
            }

            if (prefs?.push_notifications_enabled && 'Notification' in window && Notification.permission === 'granted') {
              this.showBrowserNotification(payload.new as Notification);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to notifications');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error');
          if (onError) {
            onError(new Error('Realtime channel error'));
          }
        }
      });

    return () => {
      if (this.channel) {
        this.channel.unsubscribe();
        this.channel = null;
      }
    };
  }

  private static preferencesCache: NotificationPreferences | null = null;

  private static getPreferencesSync(): NotificationPreferences | null {
    return this.preferencesCache;
  }

  static async cachePreferences(userId: string): Promise<void> {
    this.preferencesCache = await this.getPreferences(userId);
  }

  private static playNotificationSound(): void {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwPUKXh8LhjHAU2jdXzzn0vBSF1xe/glEILElyx6OyrWBUIRJre8cBwJAUug8/y24o4CBxqvfDlnU4MEE+j4PC5Yx0FNIrU8tCBMAYfc8Tv45hEDBBYrujxr1sVCEOY3fHGdygFMYfQ8t2LOQY=');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  private static showBrowserNotification(notification: AppNotification): void {
    try {
      const n = new Notification(notification.title, {
        body: notification.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: notification.id,
        requireInteraction: false,
        silent: false
      });

      n.onclick = () => {
        window.focus();
        if (notification.action_url) {
          window.location.href = notification.action_url;
        }
        this.markAsClicked(notification.id);
        n.close();
      };

      setTimeout(() => n.close(), 10000);
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  static async requestBrowserPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  static getBrowserPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as 'granted' | 'denied' | 'default';
  }

  static async sendNotificationToAdmins(
    adminUserIds: string[],
    type: NotificationType,
    title: string,
    body: string,
    metadata: Record<string, any> = {},
    actionUrl: string | null = null
  ): Promise<number> {
    let successCount = 0;

    for (const adminId of adminUserIds) {
      const notificationId = await this.createNotification(
        adminId,
        type,
        title,
        body,
        metadata,
        actionUrl
      );

      if (notificationId) {
        successCount++;
      }
    }

    return successCount;
  }

  static async cleanupOldNotifications(userId: string): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('read', true)
        .lt('created_at', thirtyDaysAgo.toISOString());

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('read', false)
        .lt('created_at', ninetyDaysAgo.toISOString());
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }

  static async registerFCMDevice(
    userId: string,
    fcmToken: string,
    deviceType: 'ios' | 'android' | 'web',
    deviceName?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('upsert_fcm_device', {
        p_user_id: userId,
        p_fcm_token: fcmToken,
        p_device_type: deviceType,
        p_device_name: deviceName || null
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error registering FCM device:', error);
      return null;
    }
  }

  static async getActiveFCMTokens(userId: string): Promise<Array<{ fcm_token: string; device_type: string; device_name: string }>> {
    try {
      const { data, error } = await supabase.rpc('get_active_fcm_tokens', {
        p_user_id: userId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting active FCM tokens:', error);
      return [];
    }
  }

  static async updateDeviceLastUsed(fcmToken: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('update_fcm_device_last_used', {
        p_fcm_token: fcmToken
      });

      if (error) throw error;
      return data === true;
    } catch (error) {
      console.error('Error updating device last used:', error);
      return false;
    }
  }

  static async deactivateFCMDevice(fcmToken: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('deactivate_fcm_device', {
        p_fcm_token: fcmToken
      });

      if (error) throw error;
      return data === true;
    } catch (error) {
      console.error('Error deactivating FCM device:', error);
      return false;
    }
  }

  static async getUserDevices(userId: string): Promise<FCMDevice[]> {
    try {
      const { data, error } = await supabase
        .from('fcm_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_used', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user devices:', error);
      return [];
    }
  }

  static async sendFCMPushNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    metadata: Record<string, any> = {},
    actionUrl: string | null = null
  ): Promise<boolean> {
    try {
      const notificationId = await this.createNotification(
        userId,
        type,
        title,
        body,
        metadata,
        actionUrl
      );

      if (!notificationId) {
        console.error('Failed to create notification in database');
        return false;
      }

      const prefs = await this.getPreferences(userId);
      if (!prefs?.fcm_enabled) {
        console.log('FCM push notifications disabled for user:', userId);
        return false;
      }

      const tokens = await this.getActiveFCMTokens(userId);
      if (tokens.length === 0) {
        console.log('No active FCM tokens found for user:', userId);
        return false;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase credentials not found');
        return false;
      }

      const results = await Promise.allSettled(
        tokens.map(async ({ fcm_token }) => {
          const response = await fetch(`${supabaseUrl}/functions/v1/send-fcm-notification`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fcmToken: fcm_token,
              notification: {
                title,
                body
              },
              data: {
                notification_id: notificationId,
                action_url: actionUrl || '/dashboard',
                type,
                ...metadata
              }
            })
          });

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`FCM send failed: ${error}`);
          }

          return response.json();
        })
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      console.log(`FCM push sent to ${successCount}/${tokens.length} devices`);

      return successCount > 0;
    } catch (error) {
      console.error('Error sending FCM push notification:', error);
      return false;
    }
  }

  static async sendNotificationToAdminsWithPush(
    adminUserIds: string[],
    type: NotificationType,
    title: string,
    body: string,
    metadata: Record<string, any> = {},
    actionUrl: string | null = null
  ): Promise<number> {
    let successCount = 0;

    for (const adminId of adminUserIds) {
      const success = await this.sendFCMPushNotification(
        adminId,
        type,
        title,
        body,
        metadata,
        actionUrl
      );

      if (success) {
        successCount++;
      }
    }

    return successCount;
  }
}
