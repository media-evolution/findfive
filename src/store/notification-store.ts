import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { NotificationService, NotificationPreferences, NotificationSchedule } from '@/lib/notification-service'

interface NotificationState {
  // State
  preferences: NotificationPreferences
  schedule: NotificationSchedule | null
  permissionStatus: NotificationPermission
  isSupported: boolean
  isMuted: boolean
  mutedUntil: Date | null
  
  // Actions
  initialize: () => Promise<void>
  requestPermission: () => Promise<boolean>
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void
  muteFor: (minutes: number) => void
  unmute: () => void
  testNotification: () => Promise<void>
  startScheduler: () => void
  stopScheduler: () => void
  notifySessionStart: (sessionName: string) => Promise<void>
  notifySessionEnd: (sessionName: string, duration: number) => Promise<void>
  checkAndUpdateStatus: () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      preferences: {
        enabled: true,
        interval: 30,
        workHoursOnly: true,
        workStartTime: '09:00',
        workEndTime: '17:00',
        workDays: [1, 2, 3, 4, 5],
        soundEnabled: true,
        vibrationEnabled: true,
        sessionReminders: true,
        progressiveIntervals: true,
        smartMuting: true
      },
      schedule: null,
      permissionStatus: 'default',
      isSupported: false,
      isMuted: false,
      mutedUntil: null,

      // Initialize notification service
      initialize: async () => {
        if (typeof window === 'undefined') return

        const service = NotificationService.getInstance()
        const isSupported = service.isSupported()
        const permissionStatus = isSupported && 'Notification' in window 
          ? Notification.permission 
          : 'default'

        // Load saved preferences
        const preferences = service.getPreferences()
        const isMuted = service.isMuted()
        
        set({
          isSupported,
          permissionStatus,
          preferences,
          isMuted,
          mutedUntil: preferences.mutedUntil || null
        })

        // Start scheduler if enabled and permitted
        if (preferences.enabled && permissionStatus === 'granted') {
          service.startScheduler()
        }
      },

      // Request notification permission
      requestPermission: async () => {
        const service = NotificationService.getInstance()
        const granted = await service.requestPermission()
        
        set({ 
          permissionStatus: granted ? 'granted' : Notification.permission 
        })

        // Start scheduler if permission granted and enabled
        const { preferences } = get()
        if (granted && preferences.enabled) {
          service.startScheduler()
        }

        return granted
      },

      // Update preferences
      updatePreferences: (newPreferences: Partial<NotificationPreferences>) => {
        const service = NotificationService.getInstance()
        const currentPreferences = get().preferences
        const updatedPreferences = { ...currentPreferences, ...newPreferences }
        
        service.updatePreferences(updatedPreferences)
        
        set({ 
          preferences: updatedPreferences,
          isMuted: service.isMuted(),
          mutedUntil: updatedPreferences.mutedUntil || null
        })

        // Handle scheduler based on enabled state
        if (updatedPreferences.enabled && get().permissionStatus === 'granted') {
          service.startScheduler()
        } else if (!updatedPreferences.enabled) {
          service.stopScheduler()
        }
      },

      // Mute notifications temporarily
      muteFor: (minutes: number) => {
        const service = NotificationService.getInstance()
        service.muteFor(minutes)
        
        const mutedUntil = new Date()
        mutedUntil.setMinutes(mutedUntil.getMinutes() + minutes)
        
        set({ 
          isMuted: true,
          mutedUntil,
          preferences: { ...get().preferences, mutedUntil }
        })
      },

      // Unmute notifications
      unmute: () => {
        const service = NotificationService.getInstance()
        service.unmute()
        
        set({ 
          isMuted: false,
          mutedUntil: null,
          preferences: { ...get().preferences, mutedUntil: null }
        })
      },

      // Test notification
      testNotification: async () => {
        const service = NotificationService.getInstance()
        await service.testNotification()
      },

      // Start notification scheduler
      startScheduler: () => {
        const service = NotificationService.getInstance()
        const { permissionStatus, preferences } = get()
        
        if (permissionStatus === 'granted' && preferences.enabled) {
          service.startScheduler()
          set(state => ({
            preferences: { ...state.preferences, enabled: true }
          }))
        }
      },

      // Stop notification scheduler
      stopScheduler: () => {
        const service = NotificationService.getInstance()
        service.stopScheduler()
        
        set(state => ({
          preferences: { ...state.preferences, enabled: false }
        }))
      },

      // Session notifications
      notifySessionStart: async (sessionName: string) => {
        const service = NotificationService.getInstance()
        await service.notifySessionStart(sessionName)
      },

      notifySessionEnd: async (sessionName: string, duration: number) => {
        const service = NotificationService.getInstance()
        await service.notifySessionEnd(sessionName, duration)
      },

      // Check and update notification status
      checkAndUpdateStatus: () => {
        if (typeof window === 'undefined') return

        const service = NotificationService.getInstance()
        const permissionStatus = 'Notification' in window 
          ? Notification.permission 
          : 'default'
        const isMuted = service.isMuted()

        // Auto-unmute if mute period has expired
        const { mutedUntil } = get()
        if (mutedUntil && new Date() >= new Date(mutedUntil)) {
          get().unmute()
        } else {
          set({ permissionStatus, isMuted })
        }
      }
    }),
    {
      name: 'notification-preferences',
      partialize: (state) => ({
        preferences: state.preferences,
        mutedUntil: state.mutedUntil
      })
    }
  )
)

// Auto-initialize on client side
if (typeof window !== 'undefined') {
  useNotificationStore.getState().initialize()
  
  // Check status periodically
  setInterval(() => {
    useNotificationStore.getState().checkAndUpdateStatus()
  }, 60000) // Every minute
}