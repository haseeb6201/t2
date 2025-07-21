import { supabase } from '../lib/supabase';
import { supabaseStorage } from './supabaseStorage';
import { storageUtils } from './storage';

export interface MigrationResult {
  success: boolean;
  message: string;
  details?: {
    usersCreated: number;
    drillResultsMigrated: number;
    notesMigrated: number;
    evaluationsMigrated: number;
    sessionsMigrated: number;
  };
}

export const migrateLocalDataToSupabase = async (): Promise<MigrationResult> => {
  try {
    console.log('Starting data migration from localStorage to Supabase...');
    
    // Get all local data
    const localUsers = storageUtils.getUsers();
    const localDrillResults = storageUtils.getDrillResults();
    const localNotes = storageUtils.getNotes();
    const localEvaluations = storageUtils.getGameFilmEvaluations();
    const localSessions = storageUtils.getSessionHistory();
    
    let usersCreated = 0;
    let drillResultsMigrated = 0;
    let notesMigrated = 0;
    let evaluationsMigrated = 0;
    let sessionsMigrated = 0;
    
    // Create a mapping from old user IDs to new Supabase user IDs
    const userIdMapping: Record<string, string> = {};
    
    // Step 1: Create users in Supabase Auth and users table
    for (const localUser of localUsers) {
      try {
        // Skip if user already exists in Supabase
        const existingUser = await supabaseStorage.getUserByUsername(localUser.username);
        if (existingUser) {
          userIdMapping[localUser.id] = existingUser.id;
          continue;
        }
        
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: localUser.email,
          password: localUser.password,
          user_metadata: {
            username: localUser.username,
            first_name: localUser.firstName,
            last_name: localUser.lastName
          },
          email_confirm: true
        });
        
        if (authError || !authData.user) {
          console.error(`Failed to create auth user for ${localUser.username}:`, authError);
          continue;
        }
        
        // Create user profile in users table
        const userProfile = {
          id: authData.user.id,
          username: localUser.username,
          firstName: localUser.firstName,
          lastName: localUser.lastName,
          email: localUser.email,
          level: localUser.level,
          location: localUser.location,
          city: localUser.city,
          state: localUser.state,
          educationLevel: localUser.educationLevel,
          conferencesWorked: localUser.conferencesWorked,
          isAdmin: localUser.isAdmin,
          isEvaluator: localUser.isEvaluator,
          profilePhoto: localUser.profilePhoto,
          createdAt: localUser.createdAt
        };
        
        await supabaseStorage.createUser(userProfile);
        userIdMapping[localUser.id] = authData.user.id;
        usersCreated++;
        
      } catch (error) {
        console.error(`Failed to migrate user ${localUser.username}:`, error);
      }
    }
    
    // Step 2: Migrate drill results
    for (const localResult of localDrillResults) {
      try {
        const newUserId = userIdMapping[localResult.userId];
        const newEvaluatorId = localResult.evaluatorId ? userIdMapping[localResult.evaluatorId] : undefined;
        
        if (!newUserId) {
          console.warn(`Skipping drill result - user not found: ${localResult.userId}`);
          continue;
        }
        
        const migratedResult = {
          ...localResult,
          userId: newUserId,
          evaluatorId: newEvaluatorId
        };
        
        await supabaseStorage.addDrillResult(migratedResult);
        drillResultsMigrated++;
        
      } catch (error) {
        console.error(`Failed to migrate drill result:`, error);
      }
    }
    
    // Step 3: Migrate notes
    for (const localNote of localNotes) {
      try {
        const newUserId = userIdMapping[localNote.userId];
        
        if (!newUserId) {
          console.warn(`Skipping note - user not found: ${localNote.userId}`);
          continue;
        }
        
        const migratedNote = {
          ...localNote,
          userId: newUserId
        };
        
        await supabaseStorage.addNote(migratedNote);
        notesMigrated++;
        
      } catch (error) {
        console.error(`Failed to migrate note:`, error);
      }
    }
    
    // Step 4: Migrate game film evaluations
    for (const localEvaluation of localEvaluations) {
      try {
        const newEvaluatorId = userIdMapping[localEvaluation.evaluatorId];
        const newTargetUserId = userIdMapping[localEvaluation.targetUserId];
        
        if (!newEvaluatorId || !newTargetUserId) {
          console.warn(`Skipping evaluation - users not found: ${localEvaluation.evaluatorId} -> ${localEvaluation.targetUserId}`);
          continue;
        }
        
        const migratedEvaluation = {
          ...localEvaluation,
          evaluatorId: newEvaluatorId,
          targetUserId: newTargetUserId
        };
        
        await supabaseStorage.addGameFilmEvaluation(migratedEvaluation);
        evaluationsMigrated++;
        
      } catch (error) {
        console.error(`Failed to migrate evaluation:`, error);
      }
    }
    
    // Step 5: Migrate sessions
    for (const localSession of localSessions) {
      try {
        const newUserId = userIdMapping[localSession.userId];
        const newEvaluatorId = localSession.evaluatorId ? userIdMapping[localSession.evaluatorId] : undefined;
        
        if (!newUserId) {
          console.warn(`Skipping session - user not found: ${localSession.userId}`);
          continue;
        }
        
        const migratedSession = {
          ...localSession,
          userId: newUserId,
          evaluatorId: newEvaluatorId
        };
        
        await supabaseStorage.saveActiveSession(migratedSession);
        sessionsMigrated++;
        
      } catch (error) {
        console.error(`Failed to migrate session:`, error);
      }
    }
    
    const result: MigrationResult = {
      success: true,
      message: `Migration completed successfully! Created ${usersCreated} users, migrated ${drillResultsMigrated} drill results, ${notesMigrated} notes, ${evaluationsMigrated} evaluations, and ${sessionsMigrated} sessions.`,
      details: {
        usersCreated,
        drillResultsMigrated,
        notesMigrated,
        evaluationsMigrated,
        sessionsMigrated
      }
    };
    
    console.log('Migration completed:', result);
    return result;
    
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};