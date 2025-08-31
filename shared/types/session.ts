// Session Management Types
// Re-export database types and add additional session-specific types

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
  SessionType,
  SessionStatus,
  InterruptionSource,
  InterruptionImpact,
  Theme
} from '@/lib/types/database'

// Additional session management types
export interface SessionStats {
  totalSessions: number
  completedSessions: number
  activeSessions: number
  averageSessionDuration: number
  totalLeaveDays: number
  totalInterruptions: number
}

export interface SessionConfig {
  autoExtendOnMiss: boolean
  maxMissedDays: number
  notificationEnabled: boolean
  workdaysOnly: boolean
}

export interface SessionCreateRequest extends DbCreateSessionInput {
  config?: Partial<SessionConfig>
}

export interface SessionExtendRequest {
  sessionId: string
  additionalDays: number
  reason?: string
}

export interface SessionCompleteRequest {
  sessionId: string
  actualEndDate?: string
  notes?: string
}

// Import the database types we need
import type { 
  CreateSessionInput as DbCreateSessionInput,
  SessionType as DbSessionType 
} from '@/lib/types/database'

// Session status helpers
export const SessionStatusEnum = {
  ACTIVE: 'active' as const,
  COMPLETED: 'completed' as const,
  PAUSED: 'paused' as const
}

export const SessionTypeEnum = {
  FIVE_DAYS: '5_days' as const,
  SEVEN_DAYS: '7_days' as const,
  FOURTEEN_DAYS: '14_days' as const,
  THIRTY_DAYS: '30_days' as const
}

// Helper functions for session calculations
export const getSessionDuration = (type: DbSessionType): number => {
  switch (type) {
    case '5_days': return 5
    case '7_days': return 7
    case '14_days': return 14
    case '30_days': return 30
    default: return 7
  }
}

export const getSessionTypeLabel = (type: DbSessionType): string => {
  switch (type) {
    case '5_days': return '5 Day Sprint'
    case '7_days': return '1 Week Challenge'
    case '14_days': return '2 Week Focus'
    case '30_days': return '30 Day Journey'
    default: return 'Unknown'
  }
}

export const calculateEndDate = (startDate: string, type: DbSessionType): string => {
  const start = new Date(startDate)
  const duration = getSessionDuration(type)
  const endDate = new Date(start)
  endDate.setDate(start.getDate() + duration - 1)
  return endDate.toISOString().split('T')[0]
}