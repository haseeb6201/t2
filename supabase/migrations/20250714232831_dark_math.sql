/*
  # Fix RLS policies for users table

  This migration fixes the Row-Level Security policies for the users table to resolve:
  1. Missing INSERT policy causing "new row violates row-level security policy" errors
  2. Infinite recursion in SELECT policies causing circular dependency errors

  ## Changes Made
  1. Drop existing problematic policies that cause infinite recursion
  2. Add INSERT policy for users to create their own records
  3. Add simplified SELECT policies that avoid circular dependencies
  4. Add policies for admins and evaluators that check roles safely
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can read all user data" ON users;
DROP POLICY IF EXISTS "Evaluators can read user data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Create new SELECT policies that avoid infinite recursion
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- For admins and evaluators, we need to check their status without causing recursion
-- We'll use a simpler approach that checks the auth.jwt() claims or user metadata
CREATE POLICY "Admins can read all user data"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

CREATE POLICY "Evaluators can read user data"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE id = auth.uid() 
      AND is_evaluator = true
    )
  );

-- Add INSERT policy to allow users to create their own records during signup
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Alternative approach: Create a function to safely check user roles
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND is_admin = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_evaluator(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND is_evaluator = true
  );
END;
$$;

-- Drop the problematic policies and recreate them using the functions
DROP POLICY IF EXISTS "Admins can read all user data" ON users;
DROP POLICY IF EXISTS "Evaluators can read user data" ON users;

CREATE POLICY "Admins can read all user data"
  ON users
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Evaluators can read user data"
  ON users
  FOR SELECT
  TO authenticated
  USING (public.is_evaluator(auth.uid()));