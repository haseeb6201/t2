/*
  # Create drill results table

  1. New Tables
    - `drill_results`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id)
      - `drill_type` (text)
      - `result` (text)
      - `session_id` (text)
      - `session_start_time` (timestamp)
      - `session_end_time` (timestamp)
      - `session_notes` (text)
      - `evaluator_id` (uuid, references users.id)
      - `evaluator_username` (text)
      - `is_evaluator_recorded` (boolean)
      - `timestamp` (timestamp)

  2. Security
    - Enable RLS on `drill_results` table
    - Add policies for users to read their own results
    - Add policies for evaluators and admins
*/

CREATE TABLE IF NOT EXISTS drill_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  drill_type text NOT NULL,
  result text NOT NULL CHECK (result IN ('confirmed', 'stands', 'overturned')),
  session_id text,
  session_start_time timestamptz,
  session_end_time timestamptz,
  session_notes text,
  evaluator_id uuid REFERENCES users(id) ON DELETE SET NULL,
  evaluator_username text,
  is_evaluator_recorded boolean DEFAULT false,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE drill_results ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own drill results
CREATE POLICY "Users can read own drill results"
  ON drill_results
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy for users to insert their own drill results
CREATE POLICY "Users can insert own drill results"
  ON drill_results
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy for evaluators to read all drill results
CREATE POLICY "Evaluators can read all drill results"
  ON drill_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_evaluator = true
    )
  );

-- Policy for evaluators to insert drill results for other users
CREATE POLICY "Evaluators can insert drill results for others"
  ON drill_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_evaluator = true
    )
  );

-- Policy for admins to read all drill results
CREATE POLICY "Admins can read all drill results"
  ON drill_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy for admins to update drill results
CREATE POLICY "Admins can update drill results"
  ON drill_results
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policy for admins to delete drill results
CREATE POLICY "Admins can delete drill results"
  ON drill_results
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_drill_results_user_id ON drill_results(user_id);
CREATE INDEX IF NOT EXISTS idx_drill_results_drill_type ON drill_results(drill_type);
CREATE INDEX IF NOT EXISTS idx_drill_results_timestamp ON drill_results(timestamp);
CREATE INDEX IF NOT EXISTS idx_drill_results_evaluator_id ON drill_results(evaluator_id);