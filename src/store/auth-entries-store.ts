import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TimeEntry } from '@/lib/supabase'
import { categorizeTask, CategoryResult } from '@/lib/ai-service'

interface NewEntry {
  task_name: string
  description?: string
  category: 'delegate' | 'automate' | 'eliminate' | 'personal'
  confidence_score?: number
  duration_minutes: number
  voice_transcript?: string
}

interface EntriesStore {
  entries: TimeEntry[]
  isLoading: boolean
  error: string | null
  
  // Actions
  addEntry: (entry: NewEntry, userId: string) => Promise<void>
  addEntryFromVoice: (transcript: string, userId: string, durationMinutes?: number) => Promise<void>
  updateEntry: (id: string, updates: Partial<TimeEntry>) => void
  deleteEntry: (id: string) => void
  clearError: () => void
  loadEntriesForUser: (userId: string) => Promise<void>
  syncEntry: (entry: TimeEntry) => Promise<void>
  clearEntriesForUser: () => void
}

export const useAuthEntriesStore = create<EntriesStore>()(
  persist(
    (set, get) => ({
      entries: [],
      isLoading: false,
      error: null,

      addEntry: async (entry: NewEntry, userId: string) => {
        set({ isLoading: true, error: null })

        try {
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

          // Add to local state first (optimistic update)
          set(state => ({
            entries: [newEntry, ...state.entries],
            isLoading: false
          }))

          // Sync to server
          await get().syncEntry(newEntry)
        } catch (error) {
          console.error('Failed to add entry:', error)
          set({ 
            error: 'Failed to save entry',
            isLoading: false 
          })
        }
      },

      addEntryFromVoice: async (transcript: string, userId: string, durationMinutes = 15) => {
        set({ isLoading: true, error: null })

        try {
          // Get AI categorization
          const categoryResult: CategoryResult = await categorizeTask(transcript)
          
          const entry: NewEntry = {
            task_name: categoryResult.taskName,
            description: categoryResult.description,
            category: categoryResult.category,
            confidence_score: categoryResult.confidence,
            duration_minutes: durationMinutes,
            voice_transcript: transcript
          }

          await get().addEntry(entry, userId)
        } catch (error) {
          console.error('Failed to process voice entry:', error)
          set({ 
            error: 'Failed to process voice recording',
            isLoading: false 
          })
        }
      },

      updateEntry: (id: string, updates: Partial<TimeEntry>) => {
        set(state => ({
          entries: state.entries.map(entry => 
            entry.id === id ? { ...entry, ...updates, updated_at: new Date().toISOString() } : entry
          )
        }))

        // Sync update to server
        const updatedEntry = get().entries.find(e => e.id === id)
        if (updatedEntry) {
          get().syncEntry(updatedEntry)
        }
      },

      deleteEntry: (id: string) => {
        // Mark as deleted locally
        set(state => ({
          entries: state.entries.map(entry => 
            entry.id === id ? { ...entry, is_deleted: true, updated_at: new Date().toISOString() } : entry
          )
        }))

        // Sync deletion to server
        const deletedEntry = get().entries.find(e => e.id === id)
        if (deletedEntry) {
          get().syncEntry(deletedEntry)
        }
      },

      loadEntriesForUser: async (userId: string) => {
        set({ isLoading: true, error: null })

        try {
          // Load entries from API
          const response = await fetch(`/api/entries?userId=${userId}`, {
            headers: {
              'Content-Type': 'application/json',
            }
          })

          if (!response.ok) {
            throw new Error('Failed to load entries')
          }

          const entries: TimeEntry[] = await response.json()
          
          set({ 
            entries: entries.filter(e => !e.is_deleted), 
            isLoading: false 
          })
        } catch (error) {
          console.error('Failed to load entries:', error)
          set({ 
            error: 'Failed to load entries',
            isLoading: false 
          })
        }
      },

      syncEntry: async (entry: TimeEntry) => {
        try {
          const response = await fetch('/api/entries', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(entry)
          })

          if (!response.ok) {
            throw new Error('Failed to sync entry')
          }

          // Update with server response if needed
          const savedEntry: TimeEntry = await response.json()
          
          set(state => ({
            entries: state.entries.map(e => 
              e.id === entry.id ? savedEntry : e
            )
          }))
        } catch (error) {
          console.error('Failed to sync entry:', error)
          // Keep local version, will retry later
          // Could implement a sync queue here
        }
      },

      clearEntriesForUser: () => {
        set({ entries: [], error: null })
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'find-five-auth-entries',
      partialize: (state) => ({ 
        entries: state.entries
      }),
      // Clear persisted data when user changes
      version: 1,
    }
  )
)

// Hook for use with Better Auth
export const useUserEntries = (userId?: string) => {
  const store = useAuthEntriesStore()

  // Load entries when userId becomes available
  if (userId && store.entries.length === 0 && !store.isLoading) {
    store.loadEntriesForUser(userId)
  }

  return {
    entries: store.entries,
    isLoading: store.isLoading,
    error: store.error,
    addEntry: (entry: NewEntry) => userId ? store.addEntry(entry, userId) : Promise.reject('No user'),
    addEntryFromVoice: (transcript: string, durationMinutes?: number) => 
      userId ? store.addEntryFromVoice(transcript, userId, durationMinutes) : Promise.reject('No user'),
    updateEntry: store.updateEntry,
    deleteEntry: store.deleteEntry,
    clearError: store.clearError,
    refresh: () => userId ? store.loadEntriesForUser(userId) : Promise.resolve(),
  }
}