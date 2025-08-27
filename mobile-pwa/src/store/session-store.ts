// Session Store - Zustand store for session management
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SessionService } from '@/lib/session-service'
import { useNotificationStore } from './notification-store'
import { withRetry, ApiError, NetworkError, ErrorReporter } from '@/lib/error-handling'
import { useConnectivityStore } from '@/lib/connectivity'
import { 
  Session, 
  SessionWithProgress, 
  LeaveRecord,
  CreateSessionInput,
  SessionExtendRequest,
  SessionCompleteRequest,
  SessionConfig 
} from '@/types/session'

interface SessionStore {
  // State
  currentSession: SessionWithProgress | null
  sessions: SessionWithProgress[]
  leaveRecords: LeaveRecord[]
  isLoading: boolean
  error: string | null
  errorId: string | null
  retryCount: number
  lastRetryAt: Date | null
  config: SessionConfig

  // Actions
  createSession: (userId: string, input: CreateSessionInput) => Promise<Session>
  getCurrentSession: (userId: string) => Promise<void>
  getUserSessions: (userId: string, options?: { status?: string, limit?: number, offset?: number }) => Promise<void>
  extendSession: (request: SessionExtendRequest) => Promise<void>
  completeSession: (request: SessionCompleteRequest) => Promise<void>
  pauseSession: (sessionId: string) => Promise<void>
  resumeSession: (sessionId: string) => Promise<void>
  addLeaveDay: (sessionId: string, date: string, reason?: string) => Promise<void>
  removeLeaveDay: (leaveRecordId: string) => Promise<void>
  getSessionLeaveRecords: (sessionId: string) => Promise<void>
  updateConfig: (newConfig: Partial<SessionConfig>) => void
  retryLastAction: () => Promise<void>
  clearError: () => void
  clearCurrentSession: () => void
}

const defaultConfig: SessionConfig = {
  autoExtendOnMiss: true,
  maxMissedDays: 3,
  notificationEnabled: true,
  workdaysOnly: true
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => {
      let lastAction: (() => Promise<void>) | null = null

      const handleError = (error: unknown, operation: string) => {
        const errorId = ErrorReporter.report(
          error instanceof Error ? error : new Error('Unknown error'),
          { operation, timestamp: new Date() }
        )
        
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
        
        set(state => ({
          error: errorMessage,
          errorId,
          retryCount: state.retryCount + 1,
          lastRetryAt: new Date(),
          isLoading: false
        }))
      }

      return {
        // Initial State
        currentSession: null,
        sessions: [],
        leaveRecords: [],
        isLoading: false,
        error: null,
        errorId: null,
        retryCount: 0,
        lastRetryAt: null,
        config: defaultConfig,

        // Actions
        createSession: async (userId: string, input: CreateSessionInput) => {
          const action = async () => {
            const session = await withRetry(
              () => SessionService.createSession(userId, input),
              { 
                maxAttempts: 3,
                initialDelay: 1000,
                maxDelay: 5000,
                backoffMultiplier: 2,
                shouldRetry: (error) => {
                  return error instanceof NetworkError || 
                         (error instanceof ApiError && error.status >= 500)
                }
              },
              { operation: 'createSession', userId }
            )
            
            // Fetch the newly created session with progress data
            await get().getCurrentSession(userId)
            
            // Send notification for session start (don't retry this)
            try {
              const notificationStore = useNotificationStore.getState()
              const sessionName = `${input.type.replace('_', '-')} session`
              await notificationStore.notifySessionStart(sessionName)
            } catch (notificationError) {
              console.warn('Failed to send session start notification:', notificationError)
            }
            
            return session
          }
          
          lastAction = () => get().createSession(userId, input).then(() => {})
          set({ isLoading: true, error: null, errorId: null })
          
          try {
            const result = await action()
            set({ isLoading: false, retryCount: 0 })
            return result
          } catch (error) {
            handleError(error, 'createSession')
            throw error
          }
        },

        getCurrentSession: async (userId: string) => {
          const action = async () => {
            const session = await withRetry(
              () => SessionService.getCurrentSession(userId),
              {
                maxAttempts: 3,
                initialDelay: 500,
                maxDelay: 3000,
                backoffMultiplier: 2,
                shouldRetry: (error) => {
                  return error instanceof NetworkError || 
                         (error instanceof ApiError && error.status >= 500)
                }
              },
              { operation: 'getCurrentSession', userId }
            )
            return session
          }
          
          lastAction = () => get().getCurrentSession(userId)
          set({ isLoading: true, error: null, errorId: null })
          
          try {
            const session = await action()
            set({ currentSession: session, isLoading: false, retryCount: 0 })
          } catch (error) {
            handleError(error, 'getCurrentSession')
            set(state => ({ ...state, currentSession: null }))
          }
        },

      getUserSessions: async (userId: string, options?: { status?: string, limit?: number, offset?: number }) => {
        set({ isLoading: true, error: null })
        
        try {
          const sessions = await SessionService.getUserSessions(userId, options)
          set({ sessions, isLoading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to get user sessions'
          set({ error: errorMessage, isLoading: false })
        }
      },

      extendSession: async (request: SessionExtendRequest) => {
        set({ isLoading: true, error: null })
        
        try {
          const updatedSession = await SessionService.extendSession(request)
          
          // Update current session if it's the one being extended
          const currentSession = get().currentSession
          if (currentSession && currentSession.id === request.sessionId) {
            set({ 
              currentSession: { ...currentSession, ...updatedSession },
              isLoading: false 
            })
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to extend session'
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      completeSession: async (request: SessionCompleteRequest) => {
        set({ isLoading: true, error: null })
        
        try {
          const completedSession = await SessionService.completeSession(request)
          
          // Update current session if it's the one being completed
          const currentSession = get().currentSession
          if (currentSession && currentSession.id === request.sessionId) {
            // Calculate session duration
            const startDate = new Date(currentSession.start_date)
            const endDate = new Date(completedSession.actual_end_date || new Date())
            const durationMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60))
            
            // Send notification for session end
            const notificationStore = useNotificationStore.getState()
            const sessionName = `${currentSession.type.replace('_', '-')} session`
            await notificationStore.notifySessionEnd(sessionName, durationMinutes)
            
            set({ 
              currentSession: { ...currentSession, ...completedSession },
              isLoading: false 
            })
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to complete session'
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      pauseSession: async (sessionId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const pausedSession = await SessionService.pauseSession(sessionId)
          
          // Update current session if it's the one being paused
          const currentSession = get().currentSession
          if (currentSession && currentSession.id === sessionId) {
            set({ 
              currentSession: { ...currentSession, ...pausedSession },
              isLoading: false 
            })
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to pause session'
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      resumeSession: async (sessionId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const resumedSession = await SessionService.resumeSession(sessionId)
          
          // Update current session if it's the one being resumed
          const currentSession = get().currentSession
          if (currentSession && currentSession.id === sessionId) {
            set({ 
              currentSession: { ...currentSession, ...resumedSession },
              isLoading: false 
            })
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to resume session'
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      addLeaveDay: async (sessionId: string, date: string, reason?: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const leaveRecord = await SessionService.addLeaveDay(sessionId, date, reason)
          
          // Add to leave records and refresh session progress
          set(state => ({
            leaveRecords: [...state.leaveRecords, leaveRecord],
            isLoading: false
          }))
          
          // Refresh current session progress if it matches
          const currentSession = get().currentSession
          if (currentSession && currentSession.id === sessionId) {
            // Trigger a refresh by getting current session again
            const userId = currentSession.user_id
            await get().getCurrentSession(userId)
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add leave day'
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      removeLeaveDay: async (leaveRecordId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          await SessionService.removeLeaveDay(leaveRecordId)
          
          // Remove from leave records
          set(state => ({
            leaveRecords: state.leaveRecords.filter(record => record.id !== leaveRecordId),
            isLoading: false
          }))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to remove leave day'
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      getSessionLeaveRecords: async (sessionId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const leaveRecords = await SessionService.getSessionLeaveRecords(sessionId)
          set({ leaveRecords, isLoading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to get leave records'
          set({ error: errorMessage, isLoading: false })
        }
      },

        updateConfig: (newConfig: Partial<SessionConfig>) => {
          set(state => ({
            config: { ...state.config, ...newConfig }
          }))
        },

        retryLastAction: async () => {
          if (lastAction) {
            set(state => ({ 
              retryCount: state.retryCount + 1,
              lastRetryAt: new Date() 
            }))
            await lastAction()
          }
        },

        clearError: () => set({ 
          error: null, 
          errorId: null, 
          retryCount: 0, 
          lastRetryAt: null 
        }),

        clearCurrentSession: () => set({ currentSession: null })
      }
    },
    {
      name: 'find-five-session-store',
      partialize: (state) => ({ 
        currentSession: state.currentSession,
        sessions: state.sessions.slice(0, 10), // Only persist recent sessions
        config: state.config
      })
    }
  )
)