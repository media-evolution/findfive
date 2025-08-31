// Find Five V2 Database Types
// Generated types for the new database schema

export interface Session {
  id: string
  user_id: string
  type: '5_days' | '7_days' | '14_days' | '30_days'
  start_date: string // ISO date string (YYYY-MM-DD)
  planned_end_date: string // ISO date string (YYYY-MM-DD)
  actual_end_date?: string // ISO date string (YYYY-MM-DD)
  status: 'active' | 'completed' | 'paused'
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
}

export interface LeaveRecord {
  id: string
  session_id: string
  leave_date: string // ISO date string (YYYY-MM-DD)
  reason?: string
  created_at: string // ISO timestamp
}

export interface Interruption {
  id: string
  session_id: string
  source: 'self' | 'email' | 'phone' | 'team' | 'client' | 'other'
  impact: 'low' | 'medium' | 'high'
  duration_minutes: number
  description?: string
  occurred_at: string // ISO timestamp
  created_at: string // ISO timestamp
}

export interface UserPreferences {
  user_id: string
  notification_interval: number // minutes (5-1440)
  work_start_time: string // HH:MM:SS format
  work_end_time: string // HH:MM:SS format  
  work_days: number[] // Array of weekday numbers (1=Monday, 7=Sunday)
  theme: 'light' | 'dark' | 'auto'
  voice_enabled: boolean
  auto_categorize: boolean
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
}

// Input types for creating new records (without auto-generated fields)
export interface CreateSessionInput {
  type: Session['type']
  start_date: string
  planned_end_date: string
}

export interface CreateLeaveRecordInput {
  session_id: string
  leave_date: string
  reason?: string
}

export interface CreateInterruptionInput {
  session_id: string
  source: Interruption['source']
  impact: Interruption['impact']
  duration_minutes: number
  description?: string
  occurred_at: string
}

export interface CreateUserPreferencesInput {
  notification_interval?: number
  work_start_time?: string
  work_end_time?: string
  work_days?: number[]
  theme?: UserPreferences['theme']
  voice_enabled?: boolean
  auto_categorize?: boolean
}

// Update types for modifying existing records
export interface UpdateSessionInput {
  type?: Session['type']
  start_date?: string
  planned_end_date?: string
  actual_end_date?: string
  status?: Session['status']
}

export interface UpdateLeaveRecordInput {
  leave_date?: string
  reason?: string
}

export interface UpdateInterruptionInput {
  source?: Interruption['source']
  impact?: Interruption['impact']
  duration_minutes?: number
  description?: string
  occurred_at?: string
}

export interface UpdateUserPreferencesInput {
  notification_interval?: number
  work_start_time?: string
  work_end_time?: string
  work_days?: number[]
  theme?: UserPreferences['theme']
  voice_enabled?: boolean
  auto_categorize?: boolean
}

// Response types from database functions
export interface SessionProgress {
  session_id: string
  days_total: number
  days_elapsed: number
  days_remaining: number
  leave_days: number
  working_days: number
  progress_percentage: number
  status: Session['status']
}

// Utility types
export type SessionType = Session['type']
export type SessionStatus = Session['status']
export type InterruptionSource = Interruption['source']
export type InterruptionImpact = Interruption['impact']
export type Theme = UserPreferences['theme']

// Combined types for views/joins
export interface SessionWithProgress extends Session {
  progress?: SessionProgress
  leave_count?: number
  interruption_count?: number
  total_interruption_minutes?: number
}

export interface InterruptionWithSession extends Interruption {
  session?: Pick<Session, 'type' | 'start_date' | 'status'>
}

// API response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

// Database error types
export interface DatabaseError {
  code: string
  message: string
  details?: string
  hint?: string
}