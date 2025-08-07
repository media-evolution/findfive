import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, TimeEntry } from '@/lib/supabase'
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
  userId: string | null
  syncQueue: NewEntry[]
  
  // Actions
  setUserId: (id: string) => void
  addEntry: (entry: NewEntry) => Promise<void>
  addEntryFromVoice: (transcript: string, durationMinutes?: number) => Promise<void>
  updateEntry: (id: string, updates: Partial<TimeEntry>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  loadEntries: () => Promise<void>
  syncOfflineEntries: () => Promise<void>
  clearError: () => void
}

export const useEntriesStore = create<EntriesStore>()(
  persist(
    (set, get) => ({
      entries: [],
      isLoading: false,
      error: null,
      userId: null,
      syncQueue: [],

      setUserId: (id: string) => {
        set({ userId: id })
      },

      addEntry: async (entry: NewEntry) => {
        const { userId } = get()
        if (!userId) {
          set({ error: 'User ID required' })
          return
        }

        set({ isLoading: true, error: null })

        try {
          // Try to save to Supabase
          const { data, error } = await supabase
            .from('time_entries')
            .insert([{ ...entry, user_id: userId }])
            .select()
            .single()

          if (error) throw error

          // Add to local state
          set(state => ({
            entries: [data, ...state.entries],
            isLoading: false
          }))
        } catch (error) {
          console.error('Failed to save entry:', error)
          
          // If offline or error, queue for later sync
          set(state => ({
            syncQueue: [...state.syncQueue, entry],
            isLoading: false,
            error: 'Entry saved offline - will sync when connection restored'
          }))

          // Also add to local state with temporary ID
          const tempEntry: TimeEntry = {
            id: `temp-${Date.now()}`,
            user_id: userId,
            created_at: new Date().toISOString(),
            ...entry
          }
          
          set(state => ({
            entries: [tempEntry, ...state.entries]
          }))
        }
      },

      addEntryFromVoice: async (transcript: string, durationMinutes = 15) => {
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

          await get().addEntry(entry)
        } catch (error) {
          console.error('Failed to process voice entry:', error)
          set({ 
            error: 'Failed to process voice recording',
            isLoading: false 
          })
        }
      },

      updateEntry: async (id: string, updates: Partial<TimeEntry>) => {
        set({ isLoading: true, error: null })

        try {
          const { error } = await supabase
            .from('time_entries')
            .update(updates)
            .eq('id', id)

          if (error) throw error

          set(state => ({
            entries: state.entries.map(entry => 
              entry.id === id ? { ...entry, ...updates } : entry
            ),
            isLoading: false
          }))
        } catch (error) {
          console.error('Failed to update entry:', error)
          set({ 
            error: 'Failed to update entry',
            isLoading: false 
          })
        }
      },

      deleteEntry: async (id: string) => {
        set({ isLoading: true, error: null })

        try {
          const { error } = await supabase
            .from('time_entries')
            .delete()
            .eq('id', id)

          if (error) throw error

          set(state => ({
            entries: state.entries.filter(entry => entry.id !== id),
            isLoading: false
          }))
        } catch (error) {
          console.error('Failed to delete entry:', error)
          set({ 
            error: 'Failed to delete entry',
            isLoading: false 
          })
        }
      },

      loadEntries: async () => {
        const { userId } = get()
        if (!userId) return

        set({ isLoading: true, error: null })

        try {
          const { data, error } = await supabase
            .from('time_entries')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50)

          if (error) throw error

          set({ 
            entries: data || [],
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

      syncOfflineEntries: async () => {
        const { syncQueue, userId } = get()
        if (!userId || syncQueue.length === 0) return

        set({ isLoading: true })

        try {
          const { data, error } = await supabase
            .from('time_entries')
            .insert(syncQueue.map(entry => ({ ...entry, user_id: userId })))
            .select()

          if (error) throw error

          // Remove synced entries from queue and add to entries
          set(state => ({
            syncQueue: [],
            entries: [...(data || []), ...state.entries.filter(e => !e.id.startsWith('temp-'))],
            isLoading: false,
            error: null
          }))
        } catch (error) {
          console.error('Failed to sync offline entries:', error)
          set({ 
            error: 'Failed to sync offline entries',
            isLoading: false 
          })
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'find-five-entries',
      partialize: (state) => ({ 
        entries: state.entries,
        syncQueue: state.syncQueue,
        userId: state.userId
      })
    }
  )
)