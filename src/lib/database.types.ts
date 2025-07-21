export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          first_name: string
          last_name: string
          email: string
          level: string
          location: string
          city: string | null
          state: string | null
          education_level: string | null
          conferences_worked: string | null
          is_admin: boolean
          is_evaluator: boolean
          profile_photo: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          first_name: string
          last_name: string
          email: string
          level?: string
          location?: string
          city?: string | null
          state?: string | null
          education_level?: string | null
          conferences_worked?: string | null
          is_admin?: boolean
          is_evaluator?: boolean
          profile_photo?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          first_name?: string
          last_name?: string
          email?: string
          level?: string
          location?: string
          city?: string | null
          state?: string | null
          education_level?: string | null
          conferences_worked?: string | null
          is_admin?: boolean
          is_evaluator?: boolean
          profile_photo?: string | null
          created_at?: string
        }
      }
      drill_results: {
        Row: {
          id: string
          user_id: string
          drill_type: string
          result: string
          session_id: string | null
          session_start_time: string | null
          session_end_time: string | null
          session_notes: string | null
          evaluator_id: string | null
          evaluator_username: string | null
          is_evaluator_recorded: boolean
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          drill_type: string
          result: string
          session_id?: string | null
          session_start_time?: string | null
          session_end_time?: string | null
          session_notes?: string | null
          evaluator_id?: string | null
          evaluator_username?: string | null
          is_evaluator_recorded?: boolean
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          drill_type?: string
          result?: string
          session_id?: string | null
          session_start_time?: string | null
          session_end_time?: string | null
          session_notes?: string | null
          evaluator_id?: string | null
          evaluator_username?: string | null
          is_evaluator_recorded?: boolean
          timestamp?: string
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          username: string
          content: string
          video_url: string | null
          video_file: string | null
          likes: Json
          comments: Json
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          content: string
          video_url?: string | null
          video_file?: string | null
          likes?: Json
          comments?: Json
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          content?: string
          video_url?: string | null
          video_file?: string | null
          likes?: Json
          comments?: Json
          timestamp?: string
        }
      }
      game_film_evaluations: {
        Row: {
          id: string
          evaluator_id: string
          evaluator_username: string
          target_user_id: string
          target_username: string
          play_type: string
          notes: string
          video_url: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          evaluator_id: string
          evaluator_username: string
          target_user_id: string
          target_username: string
          play_type: string
          notes: string
          video_url?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          evaluator_id?: string
          evaluator_username?: string
          target_user_id?: string
          target_username?: string
          play_type?: string
          notes?: string
          video_url?: string | null
          timestamp?: string
        }
      }
      drill_sessions: {
        Row: {
          id: string
          user_id: string
          drill_type: string
          start_time: string
          end_time: string | null
          results: Json
          notes: string | null
          evaluator_id: string | null
          evaluator_username: string | null
          is_evaluator_recorded: boolean
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          drill_type: string
          start_time?: string
          end_time?: string | null
          results?: Json
          notes?: string | null
          evaluator_id?: string | null
          evaluator_username?: string | null
          is_evaluator_recorded?: boolean
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          drill_type?: string
          start_time?: string
          end_time?: string | null
          results?: Json
          notes?: string | null
          evaluator_id?: string | null
          evaluator_username?: string | null
          is_evaluator_recorded?: boolean
          is_active?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}