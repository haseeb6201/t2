export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  level: 'rookie' | 'AA' | 'AAA' | 'The Show';
  location: 'Philadelphia' | 'Seattle' | 'Mobile Camp';
  city?: string;
  state?: string;
  educationLevel?: 'Youth' | 'High School' | 'NAIA' | 'NCAA D1' | 'NCAA D2' | 'NCAA D3';
  conferencesWorked?: string;
  isAdmin?: boolean;
  isEvaluator?: boolean;
  profilePhoto?: string;
  createdAt: Date;
}

export interface DrillResult {
  id: string;
  userId: string;
  drillType: DrillType;
  result: ResultType;
  sessionId?: string;
  sessionStartTime?: Date;
  sessionEndTime?: Date;
  sessionNotes?: string;
  evaluatorId?: string;
  evaluatorUsername?: string;
  isEvaluatorRecorded?: boolean;
  timestamp: Date;
}

export interface DrillSession {
  id: string;
  userId: string;
  drillType: DrillType;
  startTime: Date;
  endTime?: Date;
  results: ResultType[];
  notes?: string;
  evaluatorId?: string;
  evaluatorUsername?: string;
  isEvaluatorRecorded?: boolean;
  isActive: boolean;
}

export interface Note {
  id: string;
  userId: string;
  username: string;
  content: string;
  videoUrl?: string;
  videoFile?: string; // Base64 encoded video for local storage
  timestamp: Date;
  likes: string[];
  comments: any[];
}

export interface GameFilmEvaluation {
  id: string;
  evaluatorId: string;
  evaluatorUsername: string;
  targetUserId: string;
  targetUsername: string;
  playType: string;
  notes: string;
  videoUrl?: string; // External video URL
  timestamp: Date;
}

export type DrillType = 
  | 'audio_force_play'
  | 'force_play_replay'
  | 'check_swing'
  | 'check_swing_middle'
  | 'pick_off_1b'
  | 'steal_2b'
  | 'steal_3b'
  | 'fair_foul'
  | 'play_at_plate'
  | 'plays_at_1b_advanced'
  | 'force_plays_middle';

export type ResultType = 'confirmed' | 'stands' | 'overturned';

export interface DrillStats {
  confirmed: number;
  stands: number;
  overturned: number;
  total: number;
  confirmedPercentage: number;
  standsPercentage: number;
  overturnedPercentage: number;
}

export interface DrillStatsWithRecent extends DrillStats {
  last20: DrillStats;
}

export interface UserStats {
  userId: string;
  username: string;
  totalConfirmed: number;
  totalAttempts: number;
  confirmedPercentage: number;
}