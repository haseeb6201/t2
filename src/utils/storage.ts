import { User, DrillResult, Note, DrillType, ResultType, DrillSession } from '../types';
import type { GameFilmEvaluation } from '../types';

const USERS_KEY = 'baseball_umpire_users';
const DRILL_RESULTS_KEY = 'baseball_umpire_drill_results';
const NOTES_KEY = 'baseball_umpire_notes';
const ACTIVE_SESSIONS_KEY = 'baseball_umpire_active_sessions';
const SESSION_HISTORY_KEY = 'baseball_umpire_session_history';
const GAME_FILM_KEY = 'baseball_umpire_game_film';
const DATA_VERSION_KEY = 'baseball_umpire_data_version';
const BACKUP_KEY = 'baseball_umpire_backup';

const CURRENT_DATA_VERSION = '1.0.0';

// Helper functions to parse dates from localStorage
const parseUserDates = (user: any): User => ({
  ...user,
  createdAt: new Date(user.createdAt)
});

const parseDrillResultDates = (result: any): DrillResult => ({
  ...result,
  timestamp: new Date(result.timestamp),
  sessionStartTime: result.sessionStartTime ? new Date(result.sessionStartTime) : undefined,
  sessionEndTime: result.sessionEndTime ? new Date(result.sessionEndTime) : undefined,
  isEvaluatorRecorded: result.isEvaluatorRecorded || false,
  evaluatorId: result.evaluatorId || undefined,
  evaluatorUsername: result.evaluatorUsername || undefined
});

const parseNoteDates = (note: any): Note => ({
  ...note,
  timestamp: new Date(note.timestamp),
  comments: note.comments || []
});

const parseSessionDates = (session: any): DrillSession => ({
  ...session,
  startTime: new Date(session.startTime),
  endTime: session.endTime ? new Date(session.endTime) : undefined,
  results: session.results || [],
  isEvaluatorRecorded: session.isEvaluatorRecorded || false,
  evaluatorId: session.evaluatorId || undefined,
  evaluatorUsername: session.evaluatorUsername || undefined
});

const parseGameFilmDates = (evaluation: any): GameFilmEvaluation => ({
  ...evaluation,
  timestamp: new Date(evaluation.timestamp)
});

// Data validation functions
const validateUser = (user: any): boolean => {
  return user && 
    typeof user.id === 'string' && 
    typeof user.username === 'string' && 
    typeof user.firstName === 'string' && 
    typeof user.lastName === 'string' && 
    typeof user.email === 'string' && 
    typeof user.password === 'string' && 
    user.createdAt;
};

const validateDrillResult = (result: any): boolean => {
  return result && 
    typeof result.id === 'string' && 
    typeof result.userId === 'string' && 
    typeof result.drillType === 'string' && 
    typeof result.result === 'string' && 
    result.timestamp;
};

// Data backup and recovery
const createBackup = (): void => {
  try {
    const backup = {
      users: localStorage.getItem(USERS_KEY),
      drillResults: localStorage.getItem(DRILL_RESULTS_KEY),
      notes: localStorage.getItem(NOTES_KEY),
      sessions: localStorage.getItem(SESSION_HISTORY_KEY),
      gameFilm: localStorage.getItem(GAME_FILM_KEY),
      timestamp: new Date().toISOString(),
      version: CURRENT_DATA_VERSION
    };
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
  } catch (error) {
    console.error('Failed to create backup:', error);
  }
};

const restoreFromBackup = (): boolean => {
  try {
    const backupData = localStorage.getItem(BACKUP_KEY);
    if (!backupData) return false;
    
    const backup = JSON.parse(backupData);
    
    // Restore data from backup
    if (backup.users) localStorage.setItem(USERS_KEY, backup.users);
    if (backup.drillResults) localStorage.setItem(DRILL_RESULTS_KEY, backup.drillResults);
    if (backup.notes) localStorage.setItem(NOTES_KEY, backup.notes);
    if (backup.sessions) localStorage.setItem(SESSION_HISTORY_KEY, backup.sessions);
    if (backup.gameFilm) localStorage.setItem(GAME_FILM_KEY, backup.gameFilm);
    
    console.log('Data restored from backup');
    return true;
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    return false;
  }
};

// Safe localStorage operations with error handling
const safeGetItem = (key: string, defaultValue: string = '[]'): string => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    // Test if the item is valid JSON
    JSON.parse(item);
    return item;
  } catch (error) {
    console.error(`Corrupted data detected for key ${key}:`, error);
    
    // Try to restore from backup first
    if (restoreFromBackup()) {
      try {
        const restoredItem = localStorage.getItem(key);
        if (restoredItem) {
          JSON.parse(restoredItem);
          return restoredItem;
        }
      } catch (restoreError) {
        console.error('Backup restoration failed:', restoreError);
      }
    }
    
    // If all else fails, return default value
    localStorage.removeItem(key);
    return defaultValue;
  }
};

const safeSetItem = (key: string, value: string): boolean => {
  try {
    // Create backup before making changes
    createBackup();
    
    // Validate JSON before saving
    JSON.parse(value);
    localStorage.setItem(key, value);
    
    // Update data version
    localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
    
    return true;
  } catch (error) {
    console.error(`Failed to save data for key ${key}:`, error);
    
    // Try to restore from backup if save fails
    restoreFromBackup();
    return false;
  }
};

// Initialize master admin account if it doesn't exist
const initializeMasterAccount = (): void => {
  const users = storageUtils.getUsers();
  
  // Always ensure these accounts exist with correct permissions
  const masterAccount = users.find(user => user.username === 'umpireperformance');
  const evaluatorAccount = users.find(user => user.username === 'MACevalPeterson');
  
  let needsUpdate = false;
  
  if (!masterAccount) {
    const adminUser: User = {
      id: 'master-admin-001',
      username: 'umpireperformance',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@umpireperformance.com',
      password: 'admin123',
      level: 'The Show',
      location: 'Philadelphia',
      isAdmin: true,
      isEvaluator: true,
      createdAt: new Date()
    };
    
    users.push(adminUser);
    needsUpdate = true;
  } else {
    // Ensure existing admin account has proper permissions
    if (!masterAccount.isAdmin || !masterAccount.isEvaluator) {
      masterAccount.isAdmin = true;
      masterAccount.isEvaluator = true;
      needsUpdate = true;
    }
  }
  
  if (!evaluatorAccount) {
    const evaluatorUser: User = {
      id: 'evaluator-001',
      username: 'MACevalPeterson',
      firstName: 'MAC',
      lastName: 'Peterson',
      email: 'evaluator@umpireperformance.com',
      password: 'eval123',
      level: 'The Show',
      location: 'Philadelphia',
      isAdmin: false,
      isEvaluator: true,
      createdAt: new Date()
    };
    
    users.push(evaluatorUser);
    needsUpdate = true;
  } else {
    // Ensure existing evaluator account has proper permissions
    if (!evaluatorAccount.isEvaluator) {
      evaluatorAccount.isEvaluator = true;
      needsUpdate = true;
    }
  }
  
  // Add demo user accounts for testing
  if (!users.find(user => user.username === 'demo')) {
    const demoUser: User = {
      id: 'demo-001',
      username: 'demo',
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@example.com',
      password: 'demo123',
      level: 'rookie',
      location: 'Philadelphia',
      createdAt: new Date()
    };
    
    users.push(demoUser);
    needsUpdate = true;
  }
  
  if (needsUpdate) {
    storageUtils.saveUsers(users);
  }
};

import { supabaseStorage } from './supabaseStorage';

// Legacy storage utilities - will be replaced by Supabase
// These are kept for migration purposes only
export const storageUtils = {
  // Check if we should use Supabase (when user is authenticated)
  shouldUseSupabase: (): boolean => {
    // For now, always use localStorage for migration compatibility
    return false;
  },

  // Initialize master account on first load (legacy)
  init: (): void => {
    if (storageUtils.shouldUseSupabase()) {
      return; // Skip localStorage initialization if using Supabase
    }
    
    try {
      // Check data version and migrate if necessary
      const currentVersion = localStorage.getItem(DATA_VERSION_KEY);
      if (currentVersion !== CURRENT_DATA_VERSION) {
        console.log('Data version mismatch, ensuring data integrity...');
        createBackup();
      }
      
      initializeMasterAccount();
    } catch (error) {
      console.error('Initialization error:', error);
      
      // Try to restore from backup
      if (restoreFromBackup()) {
        console.log('Data restored from backup during initialization');
        initializeMasterAccount();
      }
    }
  },

  // Users
  getUsers: (): User[] => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage.getUsers() instead');
    }
    const users = safeGetItem(USERS_KEY, '[]');
    try {
      const parsedUsers = JSON.parse(users);
      return parsedUsers
        .filter(validateUser)
        .map(parseUserDates);
    } catch (error) {
      console.error('Error parsing users:', error);
      return [];
    }
  },

  saveUsers: (users: User[]): void => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage methods instead');
    }
    try {
      // Filter out invalid users
      const validUsers = users.filter(validateUser);
      const success = safeSetItem(USERS_KEY, JSON.stringify(validUsers));
      if (success) {
        console.log('Users saved successfully, total count:', validUsers.length);
      } else {
        console.error('Failed to save users to localStorage');
      }
    } catch (error) {
      console.error('Error saving users:', error);
    }
  },

  addUser: (user: User): boolean => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage.createUser() instead');
    }
    if (!validateUser(user)) {
      console.error('Invalid user data:', user);
      return false;
    }
    
    const users = storageUtils.getUsers();
    
    // Check for duplicate usernames and emails
    const existingUsername = users.find(u => u.username === user.username);
    if (existingUsername) {
      console.error('User with same username already exists:', user.username);
      return false;
    }
    
    const existingEmail = users.find(u => u.email === user.email);
    if (existingEmail) {
      console.error('User with same email already exists:', user.email);
      return false;
    }
    
    users.push(user);
    storageUtils.saveUsers(users);
    console.log('User successfully added:', user.username);
    return true;
  },

  getUserByUsername: (username: string): User | undefined => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage.getUserByUsername() instead');
    }
    // Always ensure accounts are initialized
    storageUtils.init();
    const users = storageUtils.getUsers();
    return users.find(user => user.username === username);
  },

  getUserByEmail: (email: string): User | undefined => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage methods instead');
    }
    // Always ensure accounts are initialized
    storageUtils.init();
    const users = storageUtils.getUsers();
    return users.find(user => user.email === email);
  },

  updateUser: (userId: string, updatedUser: User): void => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage.updateUser() instead');
    }
    if (!validateUser(updatedUser)) {
      console.error('Invalid user data for update:', updatedUser);
      return;
    }
    
    const users = storageUtils.getUsers();
    const index = users.findIndex(user => user.id === userId);
    if (index !== -1) {
      users[index] = updatedUser;
      storageUtils.saveUsers(users);
    }
  },

  deleteUser: (userId: string, adminUserId: string): boolean => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage.deleteUser() instead');
    }
    // Security check: only admins can delete users
    const adminUser = storageUtils.getUsers().find(u => u.id === adminUserId);
    if (!adminUser || !adminUser.isAdmin) {
      console.error('Unauthorized attempt to delete user');
      return false;
    }
    
    // Prevent deletion of master admin account
    const userToDelete = storageUtils.getUsers().find(u => u.id === userId);
    if (userToDelete && userToDelete.username === 'umpireperformance') {
      console.error('Cannot delete master admin account');
      return false;
    }
    
    const users = storageUtils.getUsers();
    const filteredUsers = users.filter(user => user.id !== userId);
    storageUtils.saveUsers(filteredUsers);
    
    // Also remove user's associated data
    const drillResults = storageUtils.getDrillResults();
    const filteredResults = drillResults.filter(result => result.userId !== userId);
    storageUtils.saveDrillResults(filteredResults);
    
    const notes = storageUtils.getNotes();
    const filteredNotes = notes.filter(note => note.userId !== userId);
    storageUtils.saveNotes(filteredNotes);
    
    const sessions = storageUtils.getSessionHistory();
    const filteredSessions = sessions.filter(session => session.userId !== userId);
    localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(filteredSessions));
    
    const evaluations = storageUtils.getGameFilmEvaluations();
    const filteredEvaluations = evaluations.filter(evaluation => 
      evaluation.targetUserId !== userId && evaluation.evaluatorId !== userId
    );
    storageUtils.saveGameFilmEvaluations(filteredEvaluations);
    
    return true;
  },

  // Drill Results
  getDrillResults: (): DrillResult[] => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage.getDrillResults() instead');
    }
    const results = safeGetItem(DRILL_RESULTS_KEY, '[]');
    try {
      const parsedResults = JSON.parse(results);
      return parsedResults
        .filter(validateDrillResult)
        .map(parseDrillResultDates);
    } catch (error) {
      console.error('Error parsing drill results:', error);
      return [];
    }
  },

  saveDrillResults: (results: DrillResult[]): void => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage methods instead');
    }
    try {
      const validResults = results.filter(validateDrillResult);
      safeSetItem(DRILL_RESULTS_KEY, JSON.stringify(validResults));
    } catch (error) {
      console.error('Error saving drill results:', error);
    }
  },

  addDrillResult: (result: DrillResult): void => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage.addDrillResult() instead');
    }
    if (!validateDrillResult(result)) {
      console.error('Invalid drill result data:', result);
      return;
    }
    
    const results = storageUtils.getDrillResults();
    results.push(result);
    storageUtils.saveDrillResults(results);
  },

  getUserDrillResults: (userId: string): DrillResult[] => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage.getUserDrillResults() instead');
    }
    const results = storageUtils.getDrillResults();
    return results.filter(result => result.userId === userId);
  },

  getUserDrillResultsByType: (userId: string, drillType: DrillType): DrillResult[] => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage methods instead');
    }
    const results = storageUtils.getUserDrillResults(userId);
    return results.filter(result => result.drillType === drillType);
  },

  // Notes
  getNotes: (): Note[] => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage methods instead');
    }
    const notes = safeGetItem(NOTES_KEY, '[]');
    try {
      const parsedNotes = JSON.parse(notes);
      return parsedNotes.map(parseNoteDates);
    } catch (error) {
      console.error('Error parsing notes:', error);
      return [];
    }
  },

  saveNotes: (notes: Note[]): void => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage methods instead');
    }
    try {
      safeSetItem(NOTES_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  },

  addNote: (note: Note): void => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage.addNote() instead');
    }
    const notes = storageUtils.getNotes();
    notes.push(note);
    storageUtils.saveNotes(notes);
  },

  updateNote: (noteId: string, updatedNote: Note): void => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage methods instead');
    }
    const notes = storageUtils.getNotes();
    const index = notes.findIndex(note => note.id === noteId);
    if (index !== -1) {
      notes[index] = updatedNote;
      storageUtils.saveNotes(notes);
    }
  },

  getUserNotes: (userId: string): Note[] => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage.getUserNotes() instead');
    }
    const notes = storageUtils.getNotes();
    return notes.filter(note => note.userId === userId);
  },

  // Game Film Evaluations
  getGameFilmEvaluations: (): GameFilmEvaluation[] => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage.getGameFilmEvaluations() instead');
    }
    const evaluations = safeGetItem(GAME_FILM_KEY, '[]');
    try {
      const parsedEvaluations = JSON.parse(evaluations);
      return parsedEvaluations.map(parseGameFilmDates);
    } catch (error) {
      console.error('Error parsing game film evaluations:', error);
      return [];
    }
  },

  saveGameFilmEvaluations: (evaluations: GameFilmEvaluation[]): void => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage methods instead');
    }
    try {
      safeSetItem(GAME_FILM_KEY, JSON.stringify(evaluations));
    } catch (error) {
      console.error('Error saving game film evaluations:', error);
    }
  },

  addGameFilmEvaluation: (evaluation: GameFilmEvaluation): void => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage.addGameFilmEvaluation() instead');
    }
    console.log('Adding game film evaluation:', evaluation);
    const evaluations = storageUtils.getGameFilmEvaluations();
    evaluations.push(evaluation);
    console.log('Total evaluations after add:', evaluations.length);
    storageUtils.saveGameFilmEvaluations(evaluations);
  },

  updateGameFilmEvaluation: (evaluationId: string, updatedEvaluation: GameFilmEvaluation): void => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage methods instead');
    }
    const evaluations = storageUtils.getGameFilmEvaluations();
    const index = evaluations.findIndex(evaluation => evaluation.id === evaluationId);
    if (index !== -1) {
      evaluations[index] = updatedEvaluation;
      storageUtils.saveGameFilmEvaluations(evaluations);
    }
  },

  deleteGameFilmEvaluation: (evaluationId: string): void => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage methods instead');
    }
    const evaluations = storageUtils.getGameFilmEvaluations();
    const filteredEvaluations = evaluations.filter(evaluation => evaluation.id !== evaluationId);
    storageUtils.saveGameFilmEvaluations(filteredEvaluations);
  },

  deleteGameFilmEvaluation: (evaluationId: string): void => {
    const evaluations = storageUtils.getGameFilmEvaluations();
    const filteredEvaluations = evaluations.filter(evaluation => evaluation.id !== evaluationId);
    storageUtils.saveGameFilmEvaluations(filteredEvaluations);
  },

  getUserGameFilmEvaluations: (userId: string): GameFilmEvaluation[] => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage.getUserGameFilmEvaluations() instead');
    }
    console.log('Getting evaluations for user:', userId);
    const evaluations = storageUtils.getGameFilmEvaluations();
    console.log('Total evaluations in storage:', evaluations.length);
    const userEvaluations = evaluations
      .filter(evaluation => evaluation.targetUserId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    console.log('Filtered evaluations for user:', userEvaluations.length);
    return userEvaluations;
  },

  // Active Sessions
  getActiveSession: (userId: string): DrillSession | null => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage.getActiveSession() instead');
    }
    const sessions = safeGetItem(ACTIVE_SESSIONS_KEY, '{}');
    try {
      const activeSessions: Record<string, any> = JSON.parse(sessions);
      const session = activeSessions[userId];
      return session ? parseSessionDates(session) : null;
    } catch (error) {
      console.error('Error parsing active sessions:', error);
      return null;
    }
  },

  saveActiveSession: (session: DrillSession): void => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage.saveActiveSession() instead');
    }
    try {
      const sessions = safeGetItem(ACTIVE_SESSIONS_KEY, '{}');
      const activeSessions: Record<string, DrillSession> = JSON.parse(sessions);
      activeSessions[session.userId] = session;
      safeSetItem(ACTIVE_SESSIONS_KEY, JSON.stringify(activeSessions));
    } catch (error) {
      console.error('Error saving active session:', error);
    }
  },

  clearActiveSession: (userId: string): void => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage.clearActiveSession() instead');
    }
    try {
      const sessions = safeGetItem(ACTIVE_SESSIONS_KEY, '{}');
      const activeSessions: Record<string, DrillSession> = JSON.parse(sessions);
      delete activeSessions[userId];
      safeSetItem(ACTIVE_SESSIONS_KEY, JSON.stringify(activeSessions));
    } catch (error) {
      console.error('Error clearing active session:', error);
    }
  },

  // Session History
  getSessionHistory: (): DrillSession[] => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage methods instead');
    }
    const history = safeGetItem(SESSION_HISTORY_KEY, '[]');
    try {
      const parsedHistory = JSON.parse(history);
      return parsedHistory.map(parseSessionDates);
    } catch (error) {
      console.error('Error parsing session history:', error);
      return [];
    }
  },

  saveSessionToHistory: (session: DrillSession): void => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage methods instead');
    }
    try {
      const history = storageUtils.getSessionHistory();
      history.push(session);
      safeSetItem(SESSION_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving session to history:', error);
    }
  },

  getUserSessions: (userId: string): DrillSession[] => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use supabaseStorage.getUserSessions() instead');
    }
    const history = storageUtils.getSessionHistory();
    return history
      .filter(session => session.userId === userId && !session.isActive)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  },

  // Data management and backup
  exportAllData: (): string => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use Supabase export methods instead');
    }
    try {
      const data = {
        users: storageUtils.getUsers(),
        drillResults: storageUtils.getDrillResults(),
        notes: storageUtils.getNotes(),
        sessions: storageUtils.getSessionHistory(),
        gameFilm: storageUtils.getGameFilmEvaluations(),
        exportDate: new Date().toISOString(),
        version: CURRENT_DATA_VERSION
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      return '';
    }
  },

  importData: (jsonData: string, adminUserId: string): boolean => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use Supabase import methods instead');
    }
    try {
      // Security check: only admins can import data
      const adminUser = storageUtils.getUsers().find(u => u.id === adminUserId);
      if (!adminUser || !adminUser.isAdmin) {
        console.error('Unauthorized attempt to import data');
        return false;
      }
      
      // Create backup before import
      createBackup();
      
      const data = JSON.parse(jsonData);
      
      if (data.users) storageUtils.saveUsers(data.users);
      if (data.drillResults) storageUtils.saveDrillResults(data.drillResults);
      if (data.notes) storageUtils.saveNotes(data.notes);
      if (data.sessions) safeSetItem(SESSION_HISTORY_KEY, JSON.stringify(data.sessions));
      if (data.gameFilm) storageUtils.saveGameFilmEvaluations(data.gameFilm);
      
      // Ensure master accounts still exist after import
      storageUtils.init();
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      
      // Restore from backup if import fails
      restoreFromBackup();
      return false;
    }
  },

  // Admin functions for CSV export
  getAllDataForExport: () => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use Supabase export methods instead');
    }
    return {
      users: storageUtils.getUsers(),
      drillResults: storageUtils.getDrillResults(),
      notes: storageUtils.getNotes(),
      sessions: storageUtils.getSessionHistory()
    };
  },

  // Clean up orphaned data
  cleanupOrphanedData: (adminUserId: string): { cleaned: boolean; orphanedCount: number } => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use Supabase cleanup methods instead');
    }
    try {
      // Security check: only admins can clean up data
      const adminUser = storageUtils.getUsers().find(u => u.id === adminUserId);
      if (!adminUser || !adminUser.isAdmin) {
        console.error('Unauthorized attempt to clean up data');
        return { cleaned: false, orphanedCount: 0 };
      }
      
      const users = storageUtils.getUsers();
      const drillResults = storageUtils.getDrillResults();
      const notes = storageUtils.getNotes();
      const sessions = storageUtils.getSessionHistory();
      const evaluations = storageUtils.getGameFilmEvaluations();
      
      const userIds = new Set(users.map(u => u.id));
      
      // Count orphaned data before cleanup
      const orphanedResults = drillResults.filter(r => !userIds.has(r.userId));
      const orphanedNotes = notes.filter(n => !userIds.has(n.userId));
      const orphanedSessions = sessions.filter(s => !userIds.has(s.userId));
      const orphanedEvaluations = evaluations.filter(e => 
        !userIds.has(e.targetUserId) || !userIds.has(e.evaluatorId)
      );
      
      const totalOrphaned = orphanedResults.length + orphanedNotes.length + 
                          orphanedSessions.length + orphanedEvaluations.length;
      
      if (totalOrphaned > 0) {
        // Create backup before cleanup
        createBackup();
        
        // Clean up orphaned data
        const cleanResults = drillResults.filter(r => userIds.has(r.userId));
        const cleanNotes = notes.filter(n => userIds.has(n.userId));
        const cleanSessions = sessions.filter(s => userIds.has(s.userId));
        const cleanEvaluations = evaluations.filter(e => 
          userIds.has(e.targetUserId) && userIds.has(e.evaluatorId)
        );
        
        // Save cleaned data
        storageUtils.saveDrillResults(cleanResults);
        storageUtils.saveNotes(cleanNotes);
        safeSetItem(SESSION_HISTORY_KEY, JSON.stringify(cleanSessions));
        storageUtils.saveGameFilmEvaluations(cleanEvaluations);
        
        console.log(`Cleaned up ${totalOrphaned} orphaned records`);
      }
      
      return { cleaned: true, orphanedCount: totalOrphaned };
    } catch (error) {
      console.error('Error cleaning up orphaned data:', error);
      return { cleaned: false, orphanedCount: 0 };
    }
  },

  // Get orphaned data for reporting
  getOrphanedData: () => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use Supabase methods instead');
    }
    try {
      const users = storageUtils.getUsers();
      const drillResults = storageUtils.getDrillResults();
      const notes = storageUtils.getNotes();
      const sessions = storageUtils.getSessionHistory();
      const evaluations = storageUtils.getGameFilmEvaluations();
      
      const userIds = new Set(users.map(u => u.id));
      
      return {
        orphanedResults: drillResults.filter(r => !userIds.has(r.userId)),
        orphanedNotes: notes.filter(n => !userIds.has(n.userId)),
        orphanedSessions: sessions.filter(s => !userIds.has(s.userId)),
        orphanedEvaluations: evaluations.filter(e => 
          !userIds.has(e.targetUserId) || !userIds.has(e.evaluatorId)
        )
      };
    } catch (error) {
      console.error('Error getting orphaned data:', error);
      return {
        orphanedResults: [],
        orphanedNotes: [],
        orphanedSessions: [],
        orphanedEvaluations: []
      };
    }
  },

  // Data integrity check
  checkDataIntegrity: (): { isValid: boolean; issues: string[] } => {
    if (storageUtils.shouldUseSupabase()) {
      throw new Error('Use Supabase methods instead');
    }
    const issues: string[] = [];
    
    try {
      const users = storageUtils.getUsers();
      const drillResults = storageUtils.getDrillResults();
      const notes = storageUtils.getNotes();
      
      // Check for orphaned drill results
      const userIds = new Set(users.map(u => u.id));
      const orphanedResults = drillResults.filter(r => !userIds.has(r.userId));
      if (orphanedResults.length > 0) {
        issues.push(`Found ${orphanedResults.length} orphaned drill results`);
      }
      
      // Check for orphaned notes
      const orphanedNotes = notes.filter(n => !userIds.has(n.userId));
      if (orphanedNotes.length > 0) {
        issues.push(`Found ${orphanedNotes.length} orphaned notes`);
      }
      
      // Check for duplicate usernames
      const usernames = users.map(u => u.username);
      const duplicateUsernames = usernames.filter((name, index) => usernames.indexOf(name) !== index);
      if (duplicateUsernames.length > 0) {
        issues.push(`Found duplicate usernames: ${duplicateUsernames.join(', ')}`);
      }
      
      // Ensure master admin exists
      const masterAdmin = users.find(u => u.username === 'umpireperformance');
      if (!masterAdmin) {
        issues.push('Master admin account is missing');
      }
      
    } catch (error) {
      issues.push(`Data integrity check failed: ${error}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
};

// Initialize on module load
storageUtils.init();