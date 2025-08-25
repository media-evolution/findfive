'use client'

import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { useSessionStore } from '@/store/session-store'
import { useUser } from '@/lib/user-context'
import { SessionWithProgress, SessionConfig } from '@/types/session'

interface SessionContextValue {
  // State
  currentSession: SessionWithProgress | null
  sessions: SessionWithProgress[]
  isLoading: boolean
  error: string | null
  config: SessionConfig
  
  // Computed values
  hasActiveSession: boolean
  sessionProgress: number
  daysRemaining: number
  
  // Actions from store
  createSession: (userId: string, input: any) => Promise<any>
  getCurrentSession: (userId: string) => Promise<void>
  getUserSessions: (userId: string, options?: any) => Promise<void>
  extendSession: (request: any) => Promise<void>
  completeSession: (request: any) => Promise<void>
  pauseSession: (sessionId: string) => Promise<void>
  resumeSession: (sessionId: string) => Promise<void>
  addLeaveDay: (sessionId: string, date: string, reason?: string) => Promise<void>
  removeLeaveDay: (leaveRecordId: string) => Promise<void>
  updateConfig: (newConfig: any) => void
  clearError: () => void
  
  // Context-specific actions
  initializeSession: () => Promise<void>
  refreshCurrentSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

interface SessionProviderProps {
  children: ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  const { userId, isAuthenticated } = useUser()
  
  const {
    currentSession,
    sessions,
    isLoading,
    error,
    config,
    createSession,
    getCurrentSession,
    getUserSessions,
    extendSession,
    completeSession,
    pauseSession,
    resumeSession,
    addLeaveDay,
    removeLeaveDay,
    updateConfig,
    clearError
  } = useSessionStore()

  // Computed values
  const hasActiveSession = currentSession?.status === 'active'
  const sessionProgress = currentSession?.progress?.progress_percentage || 0
  const daysRemaining = currentSession?.progress?.days_remaining || 0

  // Initialize session on auth
  const initializeSession = async () => {
    if (!isAuthenticated || !userId) return
    
    try {
      await getCurrentSession(userId)
    } catch (error) {
      console.error('Failed to initialize session:', error)
    }
  }

  // Refresh current session
  const refreshCurrentSession = async () => {
    if (!isAuthenticated || !userId) return
    await getCurrentSession(userId)
  }

  // Auto-initialize when user is authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      initializeSession()
    }
  }, [isAuthenticated, userId])

  // Auto-extension check (runs daily)
  useEffect(() => {
    if (!currentSession || !config.autoExtendOnMiss) return

    const checkAutoExtension = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const plannedEndDate = currentSession.planned_end_date
        
        if (today > plannedEndDate && currentSession.status === 'active') {
          const daysPastEnd = Math.floor(
            (new Date(today).getTime() - new Date(plannedEndDate).getTime()) / (1000 * 60 * 60 * 24)
          )
          
          if (daysPastEnd <= config.maxMissedDays) {
            await extendSession({
              sessionId: currentSession.id,
              additionalDays: daysPastEnd,
              reason: 'Auto-extended due to missed days'
            })
          }
        }
      } catch (error) {
        console.error('Auto-extension check failed:', error)
      }
    }

    // Run check immediately and then daily
    checkAutoExtension()
    const interval = setInterval(checkAutoExtension, 24 * 60 * 60 * 1000) // 24 hours
    
    return () => clearInterval(interval)
  }, [currentSession, config, extendSession])

  // Session notifications
  useEffect(() => {
    if (!currentSession || !config.notificationEnabled) return

    const checkNotifications = () => {
      const progress = currentSession.progress
      if (!progress) return

      // Notify when session is nearing completion
      if (progress.days_remaining <= 2 && progress.days_remaining > 0) {
        // You could show a toast notification here
        console.log(`Session ending in ${progress.days_remaining} days`)
      }

      // Notify when session is overdue
      if (progress.days_remaining < 0) {
        console.log(`Session is ${Math.abs(progress.days_remaining)} days overdue`)
      }
    }

    checkNotifications()
  }, [currentSession, config])

  const contextValue: SessionContextValue = {
    // State
    currentSession,
    sessions,
    isLoading,
    error,
    config,
    
    // Computed values
    hasActiveSession,
    sessionProgress,
    daysRemaining,
    
    // Store actions
    createSession,
    getCurrentSession,
    getUserSessions,
    extendSession,
    completeSession,
    pauseSession,
    resumeSession,
    addLeaveDay,
    removeLeaveDay,
    updateConfig,
    clearError,
    
    // Context actions
    initializeSession,
    refreshCurrentSession
  }

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}

// Convenience hooks for specific session states
export function useActiveSession() {
  const { currentSession, hasActiveSession } = useSession()
  return hasActiveSession ? currentSession : null
}

export function useSessionProgress() {
  const { currentSession } = useSession()
  return currentSession?.progress || null
}

export function useSessionConfig() {
  const { config, updateConfig } = useSession()
  return { config, updateConfig }
}