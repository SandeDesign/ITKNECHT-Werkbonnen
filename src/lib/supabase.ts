import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export interface AppNotification {
  id: string;
  user_id: string;
  type: 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'WORKORDER_STATUS' | 'FEEDBACK_RECEIVED' | 'SYSTEM_ANNOUNCEMENT';
  title: string;
  body: string;
  metadata: Record<string, any>;
  read: boolean;
  clicked: boolean;
  action_url: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  task_assigned_enabled: boolean;
  task_completed_enabled: boolean;
  workorder_status_enabled: boolean;
  feedback_enabled: boolean;
  system_announcements_enabled: boolean;
  push_notifications_enabled: boolean;
  notification_sound_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  updated_at: string;
}

export type NotificationType = AppNotification['type'];
