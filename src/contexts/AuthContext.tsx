import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseStorage } from '../utils/supabaseStorage';
import { storageUtils } from '../utils/storage';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (firstName: string, lastName: string, email: string, username: string, password: string, level: 'rookie' | 'AA' | 'AAA' | 'The Show', location: 'Philadelphia' | 'Seattle' | 'Mobile Camp', city?: string, state?: string, educationLevel?: 'Youth' | 'High School' | 'NAIA' | 'NCAA D1' | 'NCAA D2' | 'NCAA D3', conferencesWorked?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Function to create master admin account if it doesn't exist
  const ensureMasterAdminExists = async () => {
    try {
      // Check if master admin already exists
      const existingAdmin = await supabaseStorage.getUserByUsername('umpireperformance');
      if (existingAdmin) {
        console.log('Master admin account already exists');
        return;
      }

      console.log('Creating master admin account...');
      
      // Create admin user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'admin@umpireperformance.com',
        password: 'admin123',
        user_metadata: {
          username: 'umpireperformance',
          first_name: 'Admin',
          last_name: 'User'
        },
        email_confirm: true
      });

      if (authError) {
        console.error('Failed to create admin auth user:', authError);
        return;
      }

      if (authData.user) {
        // Create user profile in users table
        const adminProfile = {
          id: authData.user.id,
          username: 'umpireperformance',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@umpireperformance.com',
          level: 'The Show' as const,
          location: 'Philadelphia' as const,
          isAdmin: true,
          isEvaluator: true
        };

        await supabaseStorage.createUser(adminProfile);
        console.log('Master admin account created successfully');
      }
    } catch (error) {
      console.error('Error creating master admin account:', error);
    }
  };
  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.warn('Loading timeout - falling back to localStorage');
      setConnectionError('Unable to connect to server. Using offline mode.');
      setLoading(false);
    }, 10000); // 10 second timeout

    // Initialize master admin account
    const initializeApp = async () => {
      try {
        await ensureMasterAdminExists();
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        clearTimeout(loadingTimeout);
        
        if (error) {
          console.error('Supabase session error:', error);
          setConnectionError('Connection error. Using offline mode.');
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          loadUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        clearTimeout(loadingTimeout);
        console.error('Supabase connection failed:', error);
        setConnectionError('Unable to connect to server. Using offline mode.');
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Cleanup timeout on unmount
    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const userProfile = await supabaseStorage.getUserById(userId);
      if (userProfile) {
        setUser(userProfile);
      } else {
        console.warn('User profile not found in Supabase');
        setConnectionError('User profile not found. Please contact support.');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setConnectionError('Error loading profile. Using offline mode.');
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrUsername: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('Attempting login for:', emailOrUsername);
      let email = emailOrUsername;
      
      // Check if input is username instead of email
      if (!emailOrUsername.includes('@')) {
        console.log('Looking up username:', emailOrUsername);
        try {
          const userProfile = await supabaseStorage.getUserByUsername(emailOrUsername);
          if (userProfile) {
            email = userProfile.email;
            console.log('Found user profile, using email:', email);
          } else {
            console.log('User profile not found for username:', emailOrUsername);
            return { success: false, message: 'User not found' };
          }
        } catch (error) {
          console.error('Error looking up username:', error);
          return { success: false, message: 'User not found' };
        }
      }

      console.log('Attempting Supabase authentication with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Supabase auth error:', error);
        // Check if it's a user not found error
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, message: 'Account not found in Supabase. Please contact admin to migrate your account or create a new one.' };
        }
        return { success: false, message: error.message };
      }

      if (data.user) {
        console.log('Authentication successful, loading user profile...');
        await loadUserProfile(data.user.id);
        return { success: true, message: 'Login successful' };
      }

      console.log('Authentication failed - no user data returned');
      return { success: false, message: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  const signup = async (
    firstName: string, 
    lastName: string, 
    email: string, 
    username: string, 
    password: string, 
    level: 'rookie' | 'AA' | 'AAA' | 'The Show', 
    location: 'Philadelphia' | 'Seattle' | 'Mobile Camp', 
    city?: string, 
    state?: string, 
    educationLevel?: 'Youth' | 'High School' | 'NAIA' | 'NCAA D1' | 'NCAA D2' | 'NCAA D3', 
    conferencesWorked?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      // Check if username already exists
      try {
        const existingUser = await supabaseStorage.getUserByUsername(username);
        if (existingUser) {
          return { success: false, message: 'Username already exists' };
        }
      } catch (error) {
        // If getUserByUsername fails, return error instead of continuing
        console.error('Could not check for existing username:', error);
        return { success: false, message: 'Failed to verify username availability. Please try again.' };
      }

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            first_name: firstName,
            last_name: lastName,
            level,
            location,
            city,
            state,
            education_level: educationLevel || 'High School',
            conferences_worked: conferencesWorked
          }
        }
      });

      if (error) {
        // Handle database trigger errors more gracefully
        if (error.message.includes('Database error saving new user')) {
          return { success: false, message: 'Account creation failed. Please try again or contact support.' };
        }
        return { success: false, message: error.message };
      }

      if (data.user) {

        // Check if user profile was created by trigger
        try {
          const existingProfile = await supabaseStorage.getUserById(data.user.id);
          
          if (!existingProfile) {
            // Create user profile if not created by trigger
            const userProfile: Omit<User, 'password' | 'createdAt'> = {
              id: data.user.id,
              username,
              firstName,
              lastName,
              email,
              level,
              location,
              city,
              state,
              educationLevel: educationLevel || 'High School',
              conferencesWorked,
              isAdmin: false,
              isEvaluator: false,
            };

            await supabaseStorage.createUser(userProfile);
          }
        } catch (profileError) {
          console.error('Error handling user profile:', profileError);
          // Continue with login even if profile creation fails
        }
        
        // Load the user profile
        await loadUserProfile(data.user.id);
        
        return { success: true, message: 'Account created successfully' };
      }

      return { success: false, message: 'Signup failed' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'An unexpected error occurred during signup. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};