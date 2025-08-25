import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface TimeEntry {
  id: string
  user_id: string
  task_name: string
  description?: string
  category: 'delegate' | 'automate' | 'eliminate' | 'personal'
  confidence_score: number
  duration_minutes: number
  input_method?: 'voice' | 'text' | 'quick_select'
  voice_transcript?: string
  created_at: string
  updated_at: string
  completed_at?: string
  is_deleted: boolean
  // V2 fields
  session_id?: string
  energy_level?: number // 1-5 scale
  task_mode?: 'proactive' | 'reactive'
  enjoyment?: 'like' | 'neutral' | 'dislike'
  task_type?: 'personal' | 'work' | 'both'
  frequency?: 'daily' | 'regular' | 'infrequent'
  recorded_at?: string // ISO timestamp
  recording_delay_minutes?: number
  urgency?: 'urgent' | 'not_urgent'
  importance?: 'important' | 'not_important'
}

export interface User {
  id: string
  email: string
  created_at: string
}

// Re-export V2 types for convenience
export type {
  Session,
  LeaveRecord,
  Interruption,
  UserPreferences,
  CreateSessionInput,
  CreateLeaveRecordInput,
  CreateInterruptionInput,
  CreateUserPreferencesInput,
  UpdateSessionInput,
  UpdateLeaveRecordInput,
  UpdateInterruptionInput,
  UpdateUserPreferencesInput,
  SessionProgress,
  SessionWithProgress,
  InterruptionWithSession,
  ApiResponse,
  PaginatedResponse,
  DatabaseError
} from './types/database'