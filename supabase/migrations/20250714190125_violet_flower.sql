/*
  # Create game film evaluations table

  1. New Tables
    - `game_film_evaluations`
      - `id` (uuid, primary key)
      - `evaluator_id` (uuid, references users.id)
      - `evaluator_username` (text)
      - `target_user_id` (uuid, references users.id)
      - `target_username` (text)
      - `play_type` (text)
      - `notes` (text)
      - `video_url` (text)
      - `timestamp` (timestamp)

  2. Security
    - Enable RLS on `game_film_evaluations` table
    - Add policies for evaluators to manage evaluations
    - Add policies for users to read their own evaluations
*/

CREATE TABLE IF NOT EXISTS game_film_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  evaluator_username text NOT NULL,
  target_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_username text NOT NULL,
  play_type text NOT NULL,
  notes text NOT NULL,
  video_url text,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE game_film_evaluations ENABLE ROW LEVEL SECURITY;

-- Policy for users to read evaluations about them
CREATE POLICY "Users can read own evaluations"
  ON game_film_evaluations
  FOR SELECT
  TO authenticated
  USING (target_user_id = auth.uid());

-- Policy for evaluators to read all evaluations
CREATE POLICY "Evaluators can read all evaluations"
  ON game_film_evaluations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_evaluator = true
    )
  );

-- Policy for evaluators to insert evaluations
CREATE POLICY "Evaluators can insert evaluations"
  ON game_film_evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_evaluator = true
    )
  );

-- Policy for evaluators to update their own evaluations
CREATE POLICY "Evaluators can update own evaluations"
  ON game_film_evaluations
  FOR UPDATE
  TO authenticated
  USING (evaluator_id = auth.uid());

-- Policy for evaluators to delete their own evaluations
CREATE POLICY "Evaluators can delete own evaluations"
  ON game_film_evaluations
  FOR DELETE
  TO authenticated
  USING (evaluator_id = auth.uid());

-- Policy for admins to read all evaluations
CREATE POLICY "Admins can read all evaluations"
  ON game_film_evaluations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_film_evaluations_evaluator_id ON game_film_evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_game_film_evaluations_target_user_id ON game_film_evaluations(target_user_id);
CREATE INDEX IF NOT EXISTS idx_game_film_evaluations_timestamp ON game_film_evaluations(timestamp);