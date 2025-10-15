/*
  # Fix Notification Case Statement

  1. Problem
    - The `create_notification_with_preferences` function has a CASE statement
      without an ELSE clause
    - When notification type doesn't match predefined types, it causes error:
      "case not found"

  2. Solution
    - Add ELSE clause to CASE statement to handle any notification type
    - Default to creating the notification for unknown types

  3. Changes
    - Update `create_notification_with_preferences` function
    - Add ELSE clause that defaults v_should_create to true
    - This allows custom notification types while still respecting preferences
*/

-- Drop and recreate the function with the fix
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
    ELSE
      -- Voor onbekende types, standaard aanmaken
      -- Dit ondersteunt custom notification types
      v_should_create := true;
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
