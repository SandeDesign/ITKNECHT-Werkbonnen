/*
  # Create Users Table for Firebase UID Storage
  
  ## Purpose
  Store Firebase user IDs and basic info in Supabase for notification preferences
  
  ## New Table
  - `users` - Stores Firebase user information
    - `user_id` (text, primary key) - Firebase UID
    - `email` (text) - User email from Firebase
    - `name` (text) - User display name
    - `created_at` (timestamptz) - When record was created
    - `updated_at` (timestamptz) - Last update time
  
  ## Security
  - RLS enabled with public access (Firebase handles auth)
  - Application logic validates user actions
  
  ## Notes
  - This table is purely for storing Firebase user data
  - Used to link notification preferences to Firebase users
  - Synced automatically when users log in via Firebase
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  user_id text PRIMARY KEY,
  email text NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public access (Firebase handles authentication)
CREATE POLICY "Allow public select on users"
  ON users FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert on users"
  ON users FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update on users"
  ON users FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete on users"
  ON users FOR DELETE
  TO public
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);