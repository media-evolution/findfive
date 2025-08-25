import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TimeEntry } from '@/lib/supabase'
import { categorizeTask, CategoryResult } from '@/lib/ai-service'
import { withRetry, ApiError, NetworkError, ErrorReporter, VoiceError } from '@/lib/error-handling'
import { useConnectivityStore } from '@/lib/connectivity'

interface NewEntry {
  task_name: string
  description?: string
  category: 'delegate' | 'automate' | 'eliminate' | 'personal'
  confidence_score?: number
  duration_minutes: number
  voice_transcript?: string
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

interface EntriesStore {
  entries: TimeEntry[]
  isLoading: boolean
  error: string | null
  errorId: string | null
  retryCount: number
  lastRetryAt: Date | null
  failedEntries: Array<{
    entry: NewEntry
    userId: string
    timestamp: Date
    errorId: string
  }>
  
  // Actions
  addEntry: (entry: NewEntry, userId: string) => Promise<void>
  addEntryFromVoice: (transcript: string, userId: string, durationMinutes?: number) => Promise<void>
  updateEntry: (id: string, updates: Partial<TimeEntry>) => void
  deleteEntry: (id: string) => void
  retryFailedEntries: () => Promise<void>
  removeFailedEntry: (errorId: string) => void
  clearError: () => void
}

export const useEntriesStore = create<EntriesStore>()(
  persist(
    (set, get) => {
      const handleError = (error: unknown, operation: string, entry?: NewEntry, userId?: string) => {
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
          isLoading: false,
          failedEntries: entry && userId ? [
            ...state.failedEntries,
            { entry, userId, timestamp: new Date(), errorId }
          ] : state.failedEntries
        }))
      }

      return {
        entries: [],
        isLoading: false,
        error: null,
        errorId: null,
        retryCount: 0,
        lastRetryAt: null,
        failedEntries: [],

        addEntry: async (entry: NewEntry, userId: string) => {
          set({ isLoading: true, error: null, errorId: null })

          try {
            // Check connectivity
            const connectivityState = useConnectivityStore.getState()
            
            // Create local entry with UUID
            const newEntry: TimeEntry = {
              id: crypto.randomUUID(),
              user_id: userId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_deleted: false,
              input_method: entry.voice_transcript ? 'voice' : 'text',
              confidence_score: entry.confidence_score || 0.5,
              ...entry
            }

            // Add to local state optimistically
            set(state => ({
              entries: [newEntry, ...state.entries],
              isLoading: false,
              retryCount: 0
            }))

            // If offline, add to failed entries for later sync
            if (!connectivityState.isOnline) {
              set(state => ({
                failedEntries: [
                  ...state.failedEntries,
                  { entry, userId, timestamp: new Date(), errorId: newEntry.id }
                ]
              }))
              return
            }

            // TODO: When backend is ready, sync to server with retry logic
            // await withRetry(() => syncEntryToServer(newEntry), retryConfig)

          } catch (error) {
            // Remove from local state on failure
            set(state => ({
              entries: state.entries.filter(e => e.user_id === userId && e.task_name === entry.task_name)
            }))
            handleError(error, 'addEntry', entry, userId)
            throw error
          }
        },

        addEntryFromVoice: async (transcript: string, userId: string, durationMinutes = 15) => {
          set({ isLoading: true, error: null, errorId: null })

          try {
            // Skip AI categorization - let users categorize later
            // Parse task name from transcript (simple extraction)
            const taskName = transcript.length > 100 
              ? transcript.slice(0, 100).trim() + '...'
              : transcript.trim()
            
            const entry: NewEntry = {
              task_name: taskName,
              description: transcript, // Keep full transcript as description
              category: 'personal', // Default category, will be changed later
              confidence_score: 0, // No AI confidence since not categorized
              duration_minutes: durationMinutes,
              voice_transcript: transcript
            }

            await get().addEntry(entry, userId)
            set({ isLoading: false })
          } catch (error) {
            console.error('Failed to process voice entry:', error)
            handleError(error, 'addEntryFromVoice')
          }
        },

      updateEntry: (id: string, updates: Partial<TimeEntry>) => {
        set(state => ({
          entries: state.entries.map(entry => 
            entry.id === id ? { ...entry, ...updates, updated_at: new Date().toISOString() } : entry
          )
        }))
      },

        deleteEntry: (id: string) => {
          set(state => ({
            entries: state.entries.filter(entry => entry.id !== id)
          }))
        },

        retryFailedEntries: async () => {
          const { failedEntries } = get()
          set({ isLoading: true, error: null })
          
          const successfulIds: string[] = []
          
          for (const failedEntry of failedEntries) {
            try {
              await get().addEntry(failedEntry.entry, failedEntry.userId)
              successfulIds.push(failedEntry.errorId)
            } catch (error) {
              console.error('Failed to retry entry:', error)
            }
          }
          
          // Remove successful retries
          set(state => ({
            failedEntries: state.failedEntries.filter(fe => !successfulIds.includes(fe.errorId)),
            isLoading: false
          }))
        },

        removeFailedEntry: (errorId: string) => {
          set(state => ({
            failedEntries: state.failedEntries.filter(fe => fe.errorId !== errorId)
          }))
        },

        clearError: () => set({ 
          error: null, 
          errorId: null, 
          retryCount: 0, 
          lastRetryAt: null 
        })
      }
    },
    {
      name: 'find-five-entries',
      partialize: (state) => ({ 
        entries: state.entries
      })
    }
  )
)