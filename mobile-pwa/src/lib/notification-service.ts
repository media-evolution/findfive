export interface NotificationPreferences {
  enabled: boolean
  interval: 15 | 30 | 60 // minutes
  workHoursOnly: boolean
  workStartTime: string // "09:00"
  workEndTime: string // "17:00"
  workDays: number[] // 0=Sunday, 6=Saturday
  soundEnabled: boolean
  vibrationEnabled: boolean
  mutedUntil?: Date | null
  sessionReminders: boolean
  progressiveIntervals: boolean // Start gentle, increase frequency
  smartMuting: boolean // Auto-detect user activity
}

export interface NotificationSchedule {
  nextNotificationTime: Date
  isActive: boolean
  lastNotificationTime?: Date
  notificationCount: number
  currentInterval: number // Current interval in minutes
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  actions?: NotificationAction[]
  data?: any
  silent?: boolean
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export class NotificationService {
  private static instance: NotificationService
  private schedule: NotificationSchedule | null = null
  private timerId: NodeJS.Timeout | null = null
  private preferences: NotificationPreferences = {
    enabled: true,
    interval: 30,
    workHoursOnly: true,
    workStartTime: '09:00',
    workEndTime: '17:00',
    workDays: [1, 2, 3, 4, 5], // Monday to Friday
    soundEnabled: true,
    vibrationEnabled: true,
    sessionReminders: true,
    progressiveIntervals: true,
    smartMuting: true
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.loadPreferences()
      this.initializeSchedule()
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  // Check if notifications are supported and permitted
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator
  }

  isPermitted(): boolean {
    return Notification.permission === 'granted'
  }

  // Update user preferences
  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences }
    this.savePreferences()
    
    // Restart scheduling with new preferences
    if (this.preferences.enabled) {
      this.startScheduler()
    } else {
      this.stopScheduler()
    }
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences }
  }

  // Check if current time is within work hours
  private isWithinWorkHours(): boolean {
    if (!this.preferences.workHoursOnly) {
      return true
    }

    const now = new Date()
    const currentDay = now.getDay()
    
    // Check if today is a work day
    if (!this.preferences.workDays.includes(currentDay)) {
      return false
    }

    // Check if current time is within work hours
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    return currentTime >= this.preferences.workStartTime && currentTime <= this.preferences.workEndTime
  }

  // Check if user is on leave
  async isOnLeave(): Promise<boolean> {
    try {
      const response = await fetch('/api/sessions/current')
      if (response.ok) {
        const session = await response.json()
        return session?.isOnLeave || false
      }
    } catch (error) {
      console.error('Failed to check leave status:', error)
    }
    return false
  }

  // Check if notifications are currently muted
  isMuted(): boolean {
    if (!this.preferences.mutedUntil) {
      return false
    }
    return new Date() < new Date(this.preferences.mutedUntil)
  }

  // Mute notifications temporarily
  muteFor(minutes: number): void {
    const mutedUntil = new Date()
    mutedUntil.setMinutes(mutedUntil.getMinutes() + minutes)
    this.updatePreferences({ mutedUntil })
  }

  unmute(): void {
    this.updatePreferences({ mutedUntil: null })
  }

  // Calculate next notification interval (progressive intervals)
  private calculateNextInterval(): number {
    if (!this.preferences.progressiveIntervals || !this.schedule) {
      return this.preferences.interval
    }

    const count = this.schedule.notificationCount
    
    // Progressive intervals: start gentle, increase frequency
    if (count === 0) {
      return 60 // First notification after 1 hour
    } else if (count === 1) {
      return 45 // Second after 45 minutes
    } else if (count === 2) {
      return 30 // Third after 30 minutes
    } else {
      return this.preferences.interval // Then use user preference
    }
  }

  // Smart muting: detect user activity
  private async shouldSmartMute(): Promise<boolean> {
    if (!this.preferences.smartMuting) {
      return false
    }

    try {
      // Check if user has recent entries
      const response = await fetch('/api/entries?limit=1&timeRange=10')
      if (response.ok) {
        const entries = await response.json()
        // If user has made an entry in last 10 minutes, skip notification
        return entries.length > 0
      }
    } catch (error) {
      console.error('Smart muting check failed:', error)
    }

    return false
  }

  // Show a notification
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.isPermitted()) {
      console.warn('Notification permission not granted')
      return
    }

    // Check various conditions
    if (this.isMuted()) {
      console.log('Notifications are muted')
      return
    }

    if (!this.isWithinWorkHours()) {
      console.log('Outside work hours')
      return
    }

    if (await this.isOnLeave()) {
      console.log('User is on leave')
      return
    }

    if (await this.shouldSmartMute()) {
      console.log('Smart muting active - recent activity detected')
      return
    }

    // Send notification via service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload: {
          ...payload,
          silent: !this.preferences.soundEnabled,
          vibrate: this.preferences.vibrationEnabled ? [200, 100, 200] : undefined
        }
      })
    } else {
      // Fallback to browser notification API
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.svg',
        badge: payload.badge || '/icon-192x192.svg',
        tag: payload.tag || 'find-five',
        requireInteraction: payload.requireInteraction,
        silent: !this.preferences.soundEnabled
      })
    }

    // Update schedule
    if (this.schedule) {
      this.schedule.lastNotificationTime = new Date()
      this.schedule.notificationCount++
      this.saveSchedule()
    }
  }

  // Schedule next notification
  private scheduleNext(): void {
    if (!this.preferences.enabled || !this.schedule) {
      return
    }

    const interval = this.calculateNextInterval()
    const nextTime = new Date()
    nextTime.setMinutes(nextTime.getMinutes() + interval)
    
    this.schedule.nextNotificationTime = nextTime
    this.schedule.currentInterval = interval
    this.saveSchedule()

    // Clear existing timer
    if (this.timerId) {
      clearTimeout(this.timerId)
    }

    // Set new timer
    const delay = nextTime.getTime() - Date.now()
    this.timerId = setTimeout(() => {
      this.sendScheduledNotification()
    }, delay)
  }

  // Send scheduled notification
  private async sendScheduledNotification(): Promise<void> {
    const messages = [
      "Time to log your activities! What have you been working on?",
      "Quick check-in: How did the last period go?",
      "Don't forget to track your time! Quick voice note?",
      "Productivity check: Ready to log your recent tasks?",
      "Hey! Let's capture what you've accomplished."
    ]

    const randomMessage = messages[Math.floor(Math.random() * messages.length)]

    await this.showNotification({
      title: '⏰ Find Five Reminder',
      body: randomMessage,
      requireInteraction: true,
      actions: [
        { action: 'log', title: 'Log Now' },
        { action: 'snooze', title: 'Snooze 10min' }
      ],
      data: { type: 'scheduled_reminder' }
    })

    // Schedule next notification
    this.scheduleNext()
  }

  // Start the notification scheduler
  startScheduler(): void {
    if (!this.preferences.enabled || !this.isPermitted()) {
      return
    }

    this.initializeSchedule()
    this.scheduleNext()
  }

  // Stop the notification scheduler
  stopScheduler(): void {
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
    
    if (this.schedule) {
      this.schedule.isActive = false
      this.saveSchedule()
    }
  }

  // Initialize schedule
  private initializeSchedule(): void {
    const saved = this.loadSchedule()
    if (saved) {
      this.schedule = saved
    } else {
      this.schedule = {
        nextNotificationTime: new Date(),
        isActive: true,
        notificationCount: 0,
        currentInterval: this.preferences.interval
      }
    }
  }

  // Session-aware notifications
  async notifySessionStart(sessionName: string): Promise<void> {
    if (!this.preferences.sessionReminders) {
      return
    }

    await this.showNotification({
      title: '🎯 Session Started',
      body: `You've started: ${sessionName}. Stay focused!`,
      tag: 'session-start'
    })

    // Reset notification count for new session
    if (this.schedule) {
      this.schedule.notificationCount = 0
      this.saveSchedule()
    }
  }

  async notifySessionEnd(sessionName: string, duration: number): Promise<void> {
    if (!this.preferences.sessionReminders) {
      return
    }

    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    const durationText = hours > 0 
      ? `${hours}h ${minutes}min` 
      : `${minutes} minutes`

    await this.showNotification({
      title: '✅ Session Complete',
      body: `Great work on "${sessionName}"! Duration: ${durationText}`,
      tag: 'session-end'
    })
  }

  // Persistence methods
  private savePreferences(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification_preferences', JSON.stringify(this.preferences))
    }
  }

  private loadPreferences(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notification_preferences')
      if (saved) {
        try {
          this.preferences = JSON.parse(saved)
        } catch (error) {
          console.error('Failed to load notification preferences:', error)
        }
      }
    }
  }

  private saveSchedule(): void {
    if (typeof window !== 'undefined' && this.schedule) {
      localStorage.setItem('notification_schedule', JSON.stringify(this.schedule))
    }
  }

  private loadSchedule(): NotificationSchedule | null {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notification_schedule')
      if (saved) {
        try {
          const schedule = JSON.parse(saved)
          // Convert date strings back to Date objects
          schedule.nextNotificationTime = new Date(schedule.nextNotificationTime)
          if (schedule.lastNotificationTime) {
            schedule.lastNotificationTime = new Date(schedule.lastNotificationTime)
          }
          return schedule
        } catch (error) {
          console.error('Failed to load notification schedule:', error)
        }
      }
    }
    return null
  }

  // Test notification
  async testNotification(): Promise<void> {
    await this.showNotification({
      title: '🔔 Test Notification',
      body: 'Notifications are working correctly!',
      requireInteraction: false
    })
  }
}