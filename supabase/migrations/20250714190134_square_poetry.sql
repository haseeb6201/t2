/*
  # Create drill sessions table

  1. New Tables
    - `drill_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id)
      - `drill_type` (text)
      - `start_time` (timestamp)
      - `end_time` (timestamp)
      - `results` (jsonb)
      - `notes` (text)
      - `evaluator_id` (uuid, references users.id)
      - `evaluator_username` (text)
      - `is_evaluator_recorded` (boolean)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on `drill_sessions` table
    - Add policies for users to manage their own sessions
    - Add policies for evaluators and admins
*/

CREATE TABLE IF NOT EXISTS drill_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  drill_type text NOT NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  results jsonb DEFAULT '[]'::jsonb,
  notes text,
  evaluator_id uuid REFERENCES users(id) ON DELETE SET NULL,
  evaluator_username text,
  is_evaluator_recorded boolean DEFAULT false,
  is_active boolean DEFAULT false
);

ALTER TABLE drill_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own sessions
CREATE POLICY "Users can read own sessions"
  ON drill_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy for users to insert their own sessions
CREATE POLICY "Users can insert own sessions"
  ON drill_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy for users to update their own sessions
CREATE POLICY "Users can update own sessions"
  ON drill_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Policy for evaluators to read all sessions
CREATE POLICY "Evaluators can read all sessions"
  ON drill_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_evaluator = true
    )
  );

-- Policy for evaluators to insert sessions for other users
CREATE POLICY "Evaluators can insert sessions for others"
  ON drill_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_evaluator = true
    )
  );

-- Policy for evaluators to update sessions
CREATE POLICY "Evaluators can update sessions"
  ON drill_sessions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_evaluator = true
    )
  );

-- Policy for admins to read all sessions
CREATE POLICY "Admins can read all sessions"
  ON drill_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy for admins to update sessions
CREATE POLICY "Admins can update sessions"
  ON drill_sessions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy for admins to delete sessions
CREATE POLICY "Admins can delete sessions"
  ON drill_sessions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_drill_sessions_user_id ON drill_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_drill_sessions_drill_type ON drill_sessions(drill_type);
CREATE INDEX IF NOT EXISTS idx_drill_sessions_start_time ON drill_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_drill_sessions_is_active ON drill_sessions(is_active);