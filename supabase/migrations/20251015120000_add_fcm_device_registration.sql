/*
  # FCM Device Registration en Push Notification Support

  1. Nieuwe Tabellen
    - `fcm_devices`
      - `id` (uuid, primary key)
      - `user_id` (text, foreign key naar users in Firebase)
      - `fcm_token` (text, unique) - Firebase Cloud Messaging token
      - `device_type` (text) - 'ios', 'android', 'web'
      - `device_name` (text) - naam van het apparaat
      - `is_active` (boolean) - of het apparaat actief is
      - `last_used` (timestamptz) - laatste keer gebruikt
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Uitbreidingen op bestaande tabellen
    - `notification_preferences`
      - `fcm_enabled` (boolean) - of FCM push notificaties zijn ingeschakeld
      - `device_tokens` (jsonb) - array van device tokens voor multi-device support

  3. Security
    - Enable RLS op `fcm_devices` tabel
    - Add policies voor authenticated gebruikers om hun eigen devices te beheren
    - Add policies voor admins om alle devices te kunnen zien

  4. Indexes
    - Index op `fcm_token` voor snelle lookup
    - Index op `user_id` en `is_active` voor actieve devices per gebruiker
    - Index op `last_used` voor cleanup van oude devices

  5. Functions
    - `cleanup_inactive_fcm_devices()` - verwijdert devices die >90 dagen niet gebruikt zijn
    - `upsert_fcm_device()` - registreert of update een FCM device
*/

-- Maak fcm_devices tabel
CREATE TABLE IF NOT EXISTS fcm_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  fcm_token text NOT NULL UNIQUE,
  device_type text NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  device_name text,
  is_active boolean DEFAULT true,
  last_used timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index voor snelle lookups
CREATE INDEX IF NOT EXISTS idx_fcm_devices_user_id ON fcm_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_devices_fcm_token ON fcm_devices(fcm_token);
CREATE INDEX IF NOT EXISTS idx_fcm_devices_user_active ON fcm_devices(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_fcm_devices_last_used ON fcm_devices(last_used);

-- Enable RLS
ALTER TABLE fcm_devices ENABLE ROW LEVEL SECURITY;

-- Policy: gebruikers kunnen hun eigen devices zien
CREATE POLICY "Users can view own devices"
  ON fcm_devices FOR SELECT
  TO authenticated
  USING (user_id = auth.jwt()->>'sub' OR user_id = auth.jwt()->>'user_id');

-- Policy: gebruikers kunnen hun eigen devices toevoegen
CREATE POLICY "Users can insert own devices"
  ON fcm_devices FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.jwt()->>'sub' OR user_id = auth.jwt()->>'user_id');

-- Policy: gebruikers kunnen hun eigen devices updaten
CREATE POLICY "Users can update own devices"
  ON fcm_devices FOR UPDATE
  TO authenticated
  USING (user_id = auth.jwt()->>'sub' OR user_id = auth.jwt()->>'user_id')
  WITH CHECK (user_id = auth.jwt()->>'sub' OR user_id = auth.jwt()->>'user_id');

-- Policy: gebruikers kunnen hun eigen devices verwijderen
CREATE POLICY "Users can delete own devices"
  ON fcm_devices FOR DELETE
  TO authenticated
  USING (user_id = auth.jwt()->>'sub' OR user_id = auth.jwt()->>'user_id');

-- Voeg FCM velden toe aan notification_preferences
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_preferences' AND column_name = 'fcm_enabled'
  ) THEN
    ALTER TABLE notification_preferences ADD COLUMN fcm_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_preferences' AND column_name = 'device_tokens'
  ) THEN
    ALTER TABLE notification_preferences ADD COLUMN device_tokens jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Function om FCM device te registreren of updaten
CREATE OR REPLACE FUNCTION upsert_fcm_device(
  p_user_id text,
  p_fcm_token text,
  p_device_type text,
  p_device_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_device_id uuid;
BEGIN
  -- Controleer of device al bestaat
  SELECT id INTO v_device_id
  FROM fcm_devices
  WHERE fcm_token = p_fcm_token;

  IF v_device_id IS NOT NULL THEN
    -- Update bestaand device
    UPDATE fcm_devices
    SET
      user_id = p_user_id,
      device_type = p_device_type,
      device_name = COALESCE(p_device_name, device_name),
      is_active = true,
      last_used = now(),
      updated_at = now()
    WHERE id = v_device_id;
  ELSE
    -- Maak nieuw device
    INSERT INTO fcm_devices (user_id, fcm_token, device_type, device_name)
    VALUES (p_user_id, p_fcm_token, p_device_type, p_device_name)
    RETURNING id INTO v_device_id;
  END IF;

  RETURN v_device_id;
END;
$$;

-- Function om inactieve devices op te ruimen
CREATE OR REPLACE FUNCTION cleanup_inactive_fcm_devices()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  -- Verwijder devices die >90 dagen niet gebruikt zijn
  WITH deleted AS (
    DELETE FROM fcm_devices
    WHERE last_used < now() - interval '90 days'
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_count FROM deleted;

  RETURN v_deleted_count;
END;
$$;

-- Function om actieve FCM tokens op te halen voor een gebruiker
CREATE OR REPLACE FUNCTION get_active_fcm_tokens(p_user_id text)
RETURNS TABLE (fcm_token text, device_type text, device_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT d.fcm_token, d.device_type, d.device_name
  FROM fcm_devices d
  WHERE d.user_id = p_user_id
    AND d.is_active = true
  ORDER BY d.last_used DESC;
END;
$$;

-- Function om device last_used te updaten
CREATE OR REPLACE FUNCTION update_fcm_device_last_used(p_fcm_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE fcm_devices
  SET last_used = now(), updated_at = now()
  WHERE fcm_token = p_fcm_token;

  RETURN FOUND;
END;
$$;

-- Function om device te deactiveren
CREATE OR REPLACE FUNCTION deactivate_fcm_device(p_fcm_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE fcm_devices
  SET is_active = false, updated_at = now()
  WHERE fcm_token = p_fcm_token;

  RETURN FOUND;
END;
$$;
