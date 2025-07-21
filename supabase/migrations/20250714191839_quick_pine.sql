/*
  # Add username lookup function

  1. Function
    - `get_user_by_username()` - Function to get user by username or email
    - This helps with login functionality that supports both email and username
  
  2. Security
    - Function is secured and only accessible to authenticated users
    - Returns user data based on username or email lookup
*/

-- Function to get user by username or email
CREATE OR REPLACE FUNCTION get_user_by_username(lookup_value TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  level TEXT,
  location TEXT,
  city TEXT,
  state TEXT,
  education_level TEXT,
  conferences_worked TEXT,
  is_admin BOOLEAN,
  is_evaluator BOOLEAN,
  profile_photo TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.first_name,
    u.last_name,
    u.email,
    u.level,
    u.location,
    u.city,
    u.state,
    u.education_level,
    u.conferences_worked,
    u.is_admin,
    u.is_evaluator,
    u.profile_photo,
    u.created_at
  FROM users u
  WHERE u.username = lookup_value OR u.email = lookup_value
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_by_username(TEXT) TO authenticated;