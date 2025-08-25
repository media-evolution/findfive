// Interruption Store - Zustand state management for interruptions
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { InterruptionService } from '@/lib/interruption-service'
import { 
  Interruption, 
  CreateInterruptionInput,
  UpdateInterruptionInput,
  InterruptionWithSession
} from '@/types/session'

interface InterruptionStore {
  // State
  interruptions: InterruptionWithSession[]
  sessionInterruptions: Interruption[]
  isLoading: boolean
  error: string | null
  lastInterruption: Interruption | null
  
  // Offline queue for when network is unavailable
  offlineQueue: CreateInterruptionInput[]

  // Actions
  createInterruption: (input: CreateInterruptionInput) => Promise<Interruption>
  quickInterruption: (sessionId: string, source: Interruption['source'], impact?: Interruption['impact'], duration?: number) => Promise<Interruption>
  getSessionInterruptions: (sessionId: string) => Promise<void>
  getUserInterruptions: (userId: string, options?: any) => Promise<void>
  updateInterruption: (interruptionId: string, updates: UpdateInterruptionInput) => Promise<void>
  deleteInterruption: (interruptionId: string) => Promise<void>
  
  // Offline sync
  syncOfflineQueue: () => Promise<void>
  addToOfflineQueue: (input: CreateInterruptionInput) => void
  
  // Utilities
  clearError: () => void
  getInterruptionStats: (sessionId: string) => Promise<any>
}

export const useInterruptionStore = create<InterruptionStore>()(
  persist(
    (set, get) => ({
      // Initial State
      interruptions: [],
      sessionInterruptions: [],
      isLoading: false,
      error: null,
      lastInterruption: null,
      offlineQueue: [],

      // Actions
      createInterruption: async (input: CreateInterruptionInput) => {
        set({ isLoading: true, error: null })
        
        try {
          // Check if online
          if (!navigator.onLine) {
            get().addToOfflineQueue(input)
            // Create optimistic local interruption
            const optimisticInterruption: Interruption = {
              id: `offline-${Date.now()}`,
              session_id: input.session_id,
              source: input.source,
              impact: input.impact,
              duration_minutes: input.duration_minutes,
              description: input.description,
              occurred_at: input.occurred_at,
              created_at: new Date().toISOString()
            }
            
            set({ 
              lastInterruption: optimisticInterruption,
              isLoading: false 
            })
            return optimisticInterruption
          }

          const interruption = await InterruptionService.createInterruption(input)
          
          set({ 
            lastInterruption: interruption,
            isLoading: false 
          })
          
          return interruption
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create interruption'
          set({ error: errorMessage, isLoading: false })
          
          // Add to offline queue as fallback
          get().addToOfflineQueue(input)
          throw error
        }
      },

      quickInterruption: async (
        sessionId: string, 
        source: Interruption['source'], 
        impact: Interruption['impact'] = 'medium', 
        duration: number = 5
      ) => {
        const input: CreateInterruptionInput = {
          session_id: sessionId,
          source,
          impact,
          duration_minutes: duration,
          occurred_at: new Date().toISOString()
        }
        
        return get().createInterruption(input)
      },

      getSessionInterruptions: async (sessionId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const interruptions = await InterruptionService.getSessionInterruptions(sessionId)
          set({ sessionInterruptions: interruptions, isLoading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to get session interruptions'
          set({ error: errorMessage, isLoading: false })
        }
      },

      getUserInterruptions: async (userId: string, options?: any) => {
        set({ isLoading: true, error: null })
        
        try {
          const interruptions = await InterruptionService.getUserInterruptions(userId, options)
          set({ interruptions, isLoading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to get user interruptions'
          set({ error: errorMessage, isLoading: false })
        }
      },

      updateInterruption: async (interruptionId: string, updates: UpdateInterruptionInput) => {
        set({ isLoading: true, error: null })
        
        try {
          const updatedInterruption = await InterruptionService.updateInterruption(interruptionId, updates)
          
          // Update in local state
          set(state => ({
            interruptions: state.interruptions.map(int => 
              int.id === interruptionId ? { ...int, ...updatedInterruption } : int
            ),
            sessionInterruptions: state.sessionInterruptions.map(int =>
              int.id === interruptionId ? { ...int, ...updatedInterruption } : int
            ),
            isLoading: false
          }))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update interruption'
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      deleteInterruption: async (interruptionId: string) => {
        set({ isLoading: true, error: null })
        
        try {
          await InterruptionService.deleteInterruption(interruptionId)
          
          // Remove from local state
          set(state => ({
            interruptions: state.interruptions.filter(int => int.id !== interruptionId),
            sessionInterruptions: state.sessionInterruptions.filter(int => int.id !== interruptionId),
            isLoading: false
          }))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete interruption'
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      // Offline queue management
      addToOfflineQueue: (input: CreateInterruptionInput) => {
        set(state => ({
          offlineQueue: [...state.offlineQueue, input]
        }))
      },

      syncOfflineQueue: async () => {
        const { offlineQueue } = get()
        if (offlineQueue.length === 0) return

        set({ isLoading: true, error: null })

        try {
          for (const input of offlineQueue) {
            await InterruptionService.createInterruption(input)
          }
          
          // Clear queue after successful sync
          set({ offlineQueue: [], isLoading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to sync offline interruptions'
          set({ error: errorMessage, isLoading: false })
        }
      },

      getInterruptionStats: async (sessionId: string) => {
        try {
          return await InterruptionService.getSessionInterruptionStats(sessionId)
        } catch (error) {
          console.error('Failed to get interruption stats:', error)
          return {
            total: 0,
            bySource: {},
            byImpact: {},
            totalMinutes: 0,
            averageDuration: 0
          }
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'find-five-interruption-store',
      partialize: (state) => ({ 
        lastInterruption: state.lastInterruption,
        offlineQueue: state.offlineQueue
      })
    }
  )
)

// Auto-sync offline queue when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    const store = useInterruptionStore.getState()
    if (store.offlineQueue.length > 0) {
      store.syncOfflineQueue()
    }
  })
}