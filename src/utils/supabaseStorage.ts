import { supabase } from '../lib/supabase';
import { User, DrillResult, Note, DrillSession, GameFilmEvaluation } from '../types';

export class SupabaseStorageError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'SupabaseStorageError';
  }
}

export const supabaseStorage = {
  // Users
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new SupabaseStorageError(`Failed to fetch users: ${error.message}`, error);
    }
    
    return data.map(user => ({
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      password: '', // Not stored in Supabase
      level: user.level as any,
      location: user.location as any,
      city: user.city || undefined,
      state: user.state || undefined,
      educationLevel: user.education_level as any,
      conferencesWorked: user.conferences_worked || undefined,
      isAdmin: user.is_admin,
      isEvaluator: user.is_evaluator,
      profilePhoto: user.profile_photo || undefined,
      createdAt: new Date(user.created_at)
    }));
  },

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      throw new SupabaseStorageError(`Failed to fetch user: ${error.message}`, error);
    }
    
    if (!data) return null; // User not found
    
    return {
      id: data.id,
      username: data.username,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      password: '', // Not stored in Supabase
      level: data.level as any,
      location: data.location as any,
      city: data.city || undefined,
      state: data.state || undefined,
      educationLevel: data.education_level as any,
      conferencesWorked: data.conferences_worked || undefined,
      isAdmin: data.is_admin,
      isEvaluator: data.is_evaluator,
      profilePhoto: data.profile_photo || undefined,
      createdAt: new Date(data.created_at)
    };
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error) {
      throw new SupabaseStorageError(`Failed to fetch user: ${error.message}`, error);
    }
    
    if (!data) return null; // User not found
    
    return {
      id: data.id,
      username: data.username,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      password: '', // Not stored in Supabase
      level: data.level as any,
      location: data.location as any,
      city: data.city || undefined,
      state: data.state || undefined,
      educationLevel: data.education_level as any,
      conferencesWorked: data.conferences_worked || undefined,
      isAdmin: data.is_admin,
      isEvaluator: data.is_evaluator,
      profilePhoto: data.profile_photo || undefined,
      createdAt: new Date(data.created_at)
    };
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    
    if (error) {
      throw new SupabaseStorageError(`Failed to fetch user: ${error.message}`, error);
    }
    
    if (!data) return null; // User not found
    
    return {
      id: data.id,
      username: data.username,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      password: '', // Not stored in Supabase
      level: data.level as any,
      location: data.location as any,
      city: data.city || undefined,
      state: data.state || undefined,
      educationLevel: data.education_level as any,
      conferencesWorked: data.conferences_worked || undefined,
      isAdmin: data.is_admin,
      isEvaluator: data.is_evaluator,
      profilePhoto: data.profile_photo || undefined,
      createdAt: new Date(data.created_at)
    };
  },

  async createUser(user: Omit<User, 'password' | 'createdAt'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        level: user.level,
        location: user.location,
        city: user.city || null,
        state: user.state || null,
        education_level: user.educationLevel || null,
        conferences_worked: user.conferencesWorked || null,
        is_admin: user.isAdmin || false,
        is_evaluator: user.isEvaluator || false,
        profile_photo: user.profilePhoto || null
      })
      .select()
      .single();
    
    if (error) {
      throw new SupabaseStorageError(`Failed to create user: ${error.message}`, error);
    }
    
    return {
      id: data.id,
      username: data.username,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      password: '',
      level: data.level as any,
      location: data.location as any,
      city: data.city || undefined,
      state: data.state || undefined,
      educationLevel: data.education_level as any,
      conferencesWorked: data.conferences_worked || undefined,
      isAdmin: data.is_admin,
      isEvaluator: data.is_evaluator,
      profilePhoto: data.profile_photo || undefined,
      createdAt: new Date(data.created_at)
    };
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        username: updates.username,
        first_name: updates.firstName,
        last_name: updates.lastName,
        email: updates.email,
        level: updates.level,
        location: updates.location,
        city: updates.city || null,
        state: updates.state || null,
        education_level: updates.educationLevel || null,
        conferences_worked: updates.conferencesWorked || null,
        is_admin: updates.isAdmin,
        is_evaluator: updates.isEvaluator,
        profile_photo: updates.profilePhoto || null
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new SupabaseStorageError(`Failed to update user: ${error.message}`, error);
    }
    
    return {
      id: data.id,
      username: data.username,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      password: '',
      level: data.level as any,
      location: data.location as any,
      city: data.city || undefined,
      state: data.state || undefined,
      educationLevel: data.education_level as any,
      conferencesWorked: data.conferences_worked || undefined,
      isAdmin: data.is_admin,
      isEvaluator: data.is_evaluator,
      profilePhoto: data.profile_photo || undefined,
      createdAt: new Date(data.created_at)
    };
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new SupabaseStorageError(`Failed to delete user: ${error.message}`, error);
    }
  },

  // Drill Results
  async getDrillResults(): Promise<DrillResult[]> {
    const { data, error } = await supabase
      .from('drill_results')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
      throw new SupabaseStorageError(`Failed to fetch drill results: ${error.message}`, error);
    }
    
    return data.map(result => ({
      id: result.id,
      userId: result.user_id,
      drillType: result.drill_type as any,
      result: result.result as any,
      sessionId: result.session_id || undefined,
      sessionStartTime: result.session_start_time ? new Date(result.session_start_time) : undefined,
      sessionEndTime: result.session_end_time ? new Date(result.session_end_time) : undefined,
      sessionNotes: result.session_notes || undefined,
      evaluatorId: result.evaluator_id || undefined,
      evaluatorUsername: result.evaluator_username || undefined,
      isEvaluatorRecorded: result.is_evaluator_recorded,
      timestamp: new Date(result.timestamp)
    }));
  },

  async getUserDrillResults(userId: string): Promise<DrillResult[]> {
    const { data, error } = await supabase
      .from('drill_results')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
    
    if (error) {
      throw new SupabaseStorageError(`Failed to fetch user drill results: ${error.message}`, error);
    }
    
    return data.map(result => ({
      id: result.id,
      userId: result.user_id,
      drillType: result.drill_type as any,
      result: result.result as any,
      sessionId: result.session_id || undefined,
      sessionStartTime: result.session_start_time ? new Date(result.session_start_time) : undefined,
      sessionEndTime: result.session_end_time ? new Date(result.session_end_time) : undefined,
      sessionNotes: result.session_notes || undefined,
      evaluatorId: result.evaluator_id || undefined,
      evaluatorUsername: result.evaluator_username || undefined,
      isEvaluatorRecorded: result.is_evaluator_recorded,
      timestamp: new Date(result.timestamp)
    }));
  },

  async addDrillResult(result: DrillResult): Promise<DrillResult> {
    const { data, error } = await supabase
      .from('drill_results')
      .insert({
        id: result.id,
        user_id: result.userId,
        drill_type: result.drillType,
        result: result.result,
        session_id: result.sessionId || null,
        session_start_time: result.sessionStartTime?.toISOString() || null,
        session_end_time: result.sessionEndTime?.toISOString() || null,
        session_notes: result.sessionNotes || null,
        evaluator_id: result.evaluatorId || null,
        evaluator_username: result.evaluatorUsername || null,
        is_evaluator_recorded: result.isEvaluatorRecorded || false,
        timestamp: result.timestamp.toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw new SupabaseStorageError(`Failed to add drill result: ${error.message}`, error);
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      drillType: data.drill_type as any,
      result: data.result as any,
      sessionId: data.session_id || undefined,
      sessionStartTime: data.session_start_time ? new Date(data.session_start_time) : undefined,
      sessionEndTime: data.session_end_time ? new Date(data.session_end_time) : undefined,
      sessionNotes: data.session_notes || undefined,
      evaluatorId: data.evaluator_id || undefined,
      evaluatorUsername: data.evaluator_username || undefined,
      isEvaluatorRecorded: data.is_evaluator_recorded,
      timestamp: new Date(data.timestamp)
    };
  },

  // Notes
  async getUserNotes(userId: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
    
    if (error) {
      throw new SupabaseStorageError(`Failed to fetch user notes: ${error.message}`, error);
    }
    
    return data.map(note => ({
      id: note.id,
      userId: note.user_id,
      username: note.username,
      content: note.content,
      videoUrl: note.video_url || undefined,
      videoFile: note.video_file || undefined,
      timestamp: new Date(note.timestamp),
      likes: (note.likes as string[]) || [],
      comments: (note.comments as any[]) || []
    }));
  },

  async addNote(note: Note): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        id: note.id,
        user_id: note.userId,
        username: note.username,
        content: note.content,
        video_url: note.videoUrl || null,
        video_file: note.videoFile || null,
        likes: note.likes,
        comments: note.comments,
        timestamp: note.timestamp.toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw new SupabaseStorageError(`Failed to add note: ${error.message}`, error);
    }
    
    return {
      id: data.id,
      userId: data.user_id,
      username: data.username,
      content: data.content,
      videoUrl: data.video_url || undefined,
      videoFile: data.video_file || undefined,
      timestamp: new Date(data.timestamp),
      likes: (data.likes as string[]) || [],
      comments: (data.comments as any[]) || []
    };
  },

  // Game Film Evaluations
  async getGameFilmEvaluations(): Promise<GameFilmEvaluation[]> {
    const { data, error } = await supabase
      .from('game_film_evaluations')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
      throw new SupabaseStorageError(`Failed to fetch game film evaluations: ${error.message}`, error);
    }
    
    return data.map(evaluation => ({
      id: evaluation.id,
      evaluatorId: evaluation.evaluator_id,
      evaluatorUsername: evaluation.evaluator_username,
      targetUserId: evaluation.target_user_id,
      targetUsername: evaluation.target_username,
      playType: evaluation.play_type,
      notes: evaluation.notes,
      videoUrl: evaluation.video_url || undefined,
      timestamp: new Date(evaluation.timestamp)
    }));
  },

  async getUserGameFilmEvaluations(userId: string): Promise<GameFilmEvaluation[]> {
    const { data, error } = await supabase
      .from('game_film_evaluations')
      .select('*')
      .eq('target_user_id', userId)
      .order('timestamp', { ascending: false });
    
    if (error) {
      throw new SupabaseStorageError(`Failed to fetch user game film evaluations: ${error.message}`, error);
    }
    
    return data.map(evaluation => ({
      id: evaluation.id,
      evaluatorId: evaluation.evaluator_id,
      evaluatorUsername: evaluation.evaluator_username,
      targetUserId: evaluation.target_user_id,
      targetUsername: evaluation.target_username,
      playType: evaluation.play_type,
      notes: evaluation.notes,
      videoUrl: evaluation.video_url || undefined,
      timestamp: new Date(evaluation.timestamp)
    }));
  },

  async addGameFilmEvaluation(evaluation: GameFilmEvaluation): Promise<GameFilmEvaluation> {
    const { data, error } = await supabase
      .from('game_film_evaluations')
      .insert({
        id: evaluation.id,
        evaluator_id: evaluation.evaluatorId,
        evaluator_username: evaluation.evaluatorUsername,
        target_user_id: evaluation.targetUserId,
        target_username: evaluation.targetUsername,
        play_type: evaluation.playType,
        notes: evaluation.notes,
        video_url: evaluation.videoUrl || null,
        timestamp: evaluation.timestamp.toISOString()
      })
      .select()
      .single();
    
    if (error) {
      throw new SupabaseStorageError(`Failed to add game film evaluation: ${error.message}`, error);
    }
    
    return {
      id: data.id,
      evaluatorId: data.evaluator_id,
      evaluatorUsername: data.evaluator_username,
      targetUserId: data.target_user_id,
      targetUsername: data.target_username,
      playType: data.play_type,
      notes: data.notes,
      videoUrl: data.video_url || undefined,
      timestamp: new Date(data.timestamp)
    };
  },

  // Drill Sessions
  async getUserSessions(userId: string): Promise<DrillSession[]> {
    const { data, error } = await supabase
      .from('drill_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', false)
      .order('start_time', { ascending: false });
    
    if (error) {
      throw new SupabaseStorageError(`Failed to fetch user sessions: ${error.message}`, error);
    }
    
    return data.map(session => ({
      id: session.id,
      userId: session.user_id,
      drillType: session.drill_type as any,
      startTime: new Date(session.start_time),
      endTime: session.end_time ? new Date(session.end_time) : undefined,
      results: (session.results as any[]) || [],
      notes: session.notes || undefined,
      evaluatorId: session.evaluator_id || undefined,
      evaluatorUsername: session.evaluator_username || undefined,
      isEvaluatorRecorded: session.is_evaluator_recorded,
      isActive: session.is_active
    }));
  },

  async getActiveSession(userId: string): Promise<DrillSession | null> {
    const { data, error } = await supabase
      .from('drill_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (error) {
      throw new SupabaseStorageError(`Failed to fetch active session: ${error.message}`, error);
    }
    
    if (!data) return null; // Session not found
    
    return {
      id: data.id,
      userId: data.user_id,
      drillType: data.drill_type as any,
      startTime: new Date(data.start_time),
      endTime: data.end_time ? new Date(data.end_time) : undefined,
      results: (data.results as any[]) || [],
      notes: data.notes || undefined,
      evaluatorId: data.evaluator_id || undefined,
      evaluatorUsername: data.evaluator_username || undefined,
      isEvaluatorRecorded: data.is_evaluator_recorded,
      isActive: data.is_active
    };
  },

  async saveActiveSession(session: DrillSession): Promise<void> {
    const { error } = await supabase
      .from('drill_sessions')
      .upsert({
        id: session.id,
        user_id: session.userId,
        drill_type: session.drillType,
        start_time: session.startTime.toISOString(),
        end_time: session.endTime?.toISOString() || null,
        results: session.results,
        notes: session.notes || null,
        evaluator_id: session.evaluatorId || null,
        evaluator_username: session.evaluatorUsername || null,
        is_evaluator_recorded: session.isEvaluatorRecorded || false,
        is_active: session.isActive
      });
    
    if (error) {
      throw new SupabaseStorageError(`Failed to save active session: ${error.message}`, error);
    }
  },

  async clearActiveSession(userId: string): Promise<void> {
    const { error } = await supabase
      .from('drill_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (error) {
      throw new SupabaseStorageError(`Failed to clear active session: ${error.message}`, error);
    }
  }
};