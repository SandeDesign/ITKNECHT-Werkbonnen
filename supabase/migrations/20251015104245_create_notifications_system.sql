/*
  # Notificatie Systeem Database Structuur

  ## Overzicht
  Dit creëert een volledig notificatiesysteem voor de IT Knecht applicatie.
  Het systeem ondersteunt verschillende notificatie types met granulaire gebruikersvoorkeuren.

  ## Nieuwe Tables

  ### 1. notifications
  Slaat alle notificaties op voor gebruikers
  - `id` (uuid, primary key) - Unieke notificatie identifier
  - `user_id` (text) - Firebase user ID van de ontvanger
  - `type` (text) - Type notificatie (TASK_ASSIGNED, TASK_COMPLETED, etc.)
  - `title` (text) - Notificatie titel
  - `body` (text) - Notificatie inhoud
  - `metadata` (jsonb) - Extra data zoals task_id, workorder_id, user_name, etc.
  - `read` (boolean) - Of de notificatie is gelezen
  - `clicked` (boolean) - Of de notificatie is aangeklikt
  - `action_url` (text) - URL voor navigatie bij klik
  - `created_at` (timestamptz) - Wanneer notificatie is aangemaakt

  ### 2. notification_preferences
  Gebruikersvoorkeuren voor notificaties per type
  - `user_id` (text, primary key) - Firebase user ID
  - `task_assigned_enabled` (boolean) - Notificaties voor nieuwe toegewezen taken
  - `task_completed_enabled` (boolean) - Notificaties voor voltooide taken (admins)
  - `workorder_status_enabled` (boolean) - Notificaties voor werkbon statuswijzigingen
  - `feedback_enabled` (boolean) - Notificaties voor nieuwe feedback
  - `system_announcements_enabled` (boolean) - Systeem aankondigingen
  - `push_notifications_enabled` (boolean) - Browser push notificaties aan/uit
  - `notification_sound_enabled` (boolean) - Geluid bij notificaties
  - `quiet_hours_start` (time) - Start quiet hours (geen notificaties)
  - `quiet_hours_end` (time) - Eind quiet hours
  - `updated_at` (timestamptz) - Laatst bijgewerkt

  ## Security
  - RLS enabled op beide tables
  - Users kunnen alleen hun eigen notificaties zien en beheren
  - Users kunnen alleen hun eigen voorkeuren zien en wijzigen

  ## Indexes
  - Index op user_id en created_at voor snelle queries
  - Index op user_id en read voor filtering
  - Index op type voor statistieken

  ## Functions
  - Functie om automatisch default voorkeuren aan te maken bij eerste gebruik
  - Functie om oude gelezen notificaties op te schonen
*/

-- Maak de notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('TASK_ASSIGNED', 'TASK_COMPLETED', 'WORKORDER_STATUS', 'FEEDBACK_RECEIVED', 'SYSTEM_ANNOUNCEMENT')),
  title text NOT NULL,
  body text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  clicked boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

-- Maak de notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id text PRIMARY KEY,
  task_assigned_enabled boolean DEFAULT true,
  task_completed_enabled boolean DEFAULT true,
  workorder_status_enabled boolean DEFAULT true,
  feedback_enabled boolean DEFAULT true,
  system_announcements_enabled boolean DEFAULT true,
  push_notifications_enabled boolean DEFAULT false,
  notification_sound_enabled boolean DEFAULT true,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies voor notifications table
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- RLS Policies voor notification_preferences table
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own preferences"
  ON notification_preferences FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Maak indexes voor betere performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON notifications(user_id, read);

CREATE INDEX IF NOT EXISTS idx_notifications_type 
  ON notifications(type);

-- Functie om default voorkeuren aan te maken voor nieuwe users
CREATE OR REPLACE FUNCTION create_default_notification_preferences(p_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Functie om oude gelezen notificaties op te schonen (ouder dan 30 dagen)
CREATE OR REPLACE FUNCTION cleanup_old_read_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM notifications
  WHERE read = true 
    AND created_at < now() - interval '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Functie om zeer oude ongelezen notificaties op te schonen (ouder dan 90 dagen)
CREATE OR REPLACE FUNCTION cleanup_old_unread_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM notifications
  WHERE read = false 
    AND created_at < now() - interval '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Functie om notificatie aan te maken met gebruikersvoorkeuren check
CREATE OR REPLACE FUNCTION create_notification_with_preferences(
  p_user_id text,
  p_type text,
  p_title text,
  p_body text,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_action_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id uuid;
  v_prefs record;
  v_should_create boolean := true;
  v_current_time time;
BEGIN
  -- Haal gebruikersvoorkeuren op
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;
  
  -- Als er geen voorkeuren zijn, maak defaults aan
  IF NOT FOUND THEN
    PERFORM create_default_notification_preferences(p_user_id);
    SELECT * INTO v_prefs
    FROM notification_preferences
    WHERE user_id = p_user_id;
  END IF;
  
  -- Check of dit type notificatie is ingeschakeld
  CASE p_type
    WHEN 'TASK_ASSIGNED' THEN
      v_should_create := v_prefs.task_assigned_enabled;
    WHEN 'TASK_COMPLETED' THEN
      v_should_create := v_prefs.task_completed_enabled;
    WHEN 'WORKORDER_STATUS' THEN
      v_should_create := v_prefs.workorder_status_enabled;
    WHEN 'FEEDBACK_RECEIVED' THEN
      v_should_create := v_prefs.feedback_enabled;
    WHEN 'SYSTEM_ANNOUNCEMENT' THEN
      v_should_create := v_prefs.system_announcements_enabled;
  END CASE;
  
  -- Check quiet hours
  IF v_prefs.quiet_hours_start IS NOT NULL AND v_prefs.quiet_hours_end IS NOT NULL THEN
    v_current_time := LOCALTIME;
    
    -- Check of we in quiet hours zitten
    IF v_prefs.quiet_hours_start < v_prefs.quiet_hours_end THEN
      -- Normal case: quiet hours binnen 1 dag (bijv. 22:00 - 08:00)
      IF v_current_time >= v_prefs.quiet_hours_start AND v_current_time < v_prefs.quiet_hours_end THEN
        v_should_create := false;
      END IF;
    ELSE
      -- Edge case: quiet hours over middernacht (bijv. 23:00 - 07:00)
      IF v_current_time >= v_prefs.quiet_hours_start OR v_current_time < v_prefs.quiet_hours_end THEN
        v_should_create := false;
      END IF;
    END IF;
  END IF;
  
  -- Maak notificatie aan als alle checks slagen
  IF v_should_create THEN
    INSERT INTO notifications (user_id, type, title, body, metadata, action_url)
    VALUES (p_user_id, p_type, p_title, p_body, p_metadata, p_action_url)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
  END IF;
  
  RETURN NULL;
END;
$$;