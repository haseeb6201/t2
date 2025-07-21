/*
  # Fix user signup database trigger

  1. New Functions
    - `handle_new_user()` - Trigger function to create user profile on auth signup
  
  2. Changes
    - Drop existing trigger if it exists
    - Create new trigger function that properly handles user metadata
    - Ensure all NOT NULL columns are populated with appropriate values
    - Add trigger to auth.users table for INSERT operations
  
  3. Security
    - Function runs with SECURITY DEFINER to bypass RLS
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    username,
    first_name,
    last_name,
    email,
    level,
    location,
    city,
    state,
    education_level,
    conferences_worked,
    is_admin,
    is_evaluator,
    profile_photo
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'level', 'rookie'),
    COALESCE(NEW.raw_user_meta_data->>'location', 'Philadelphia'),
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'state',
    COALESCE(NEW.raw_user_meta_data->>'education_level', 'High School'),
    NEW.raw_user_meta_data->>'conferences_worked',
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'is_evaluator')::boolean, false),
    NEW.raw_user_meta_data->>'profile_photo'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();