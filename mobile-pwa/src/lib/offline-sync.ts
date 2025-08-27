import { supabase } from '@/lib/supabase'
import { TimeEntry } from './supabase-types'

export interface SyncQueueItem {
  id: string
  action: 'create' | 'update' | 'delete'
  entityType: 'time_entry' | 'task_template'
  entityId?: string
  payload: any
  timestamp: number
  attempts: number
}

class OfflineSyncManager {
  private syncQueue: SyncQueueItem[] = []
  private isOnline = true
  private isSyncing = false
  private retryTimeouts = new Map<string, NodeJS.Timeout>()
  
  constructor() {
    this.loadQueueFromStorage()
    this.setupNetworkListeners()
    this.startPeriodicSync()
  }

  private loadQueueFromStorage() {
    if (typeof window === 'undefined') return
    
    const stored = localStorage.getItem('find-five-sync-queue')
    if (stored) {
      try {
        this.syncQueue = JSON.parse(stored)
      } catch (error) {
        console.error('Failed to load sync queue from storage:', error)
        this.syncQueue = []
      }
    }
  }

  private saveQueueToStorage() {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem('find-five-sync-queue', JSON.stringify(this.syncQueue))
    } catch (error) {
      console.error('Failed to save sync queue to storage:', error)
    }
  }

  private setupNetworkListeners() {
    if (typeof window === 'undefined') return

    this.isOnline = navigator.onLine
    
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('🌐 Back online - starting sync')
      this.syncPendingChanges()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('📱 Gone offline - queueing changes')
    })
  }

  private startPeriodicSync() {
    // Sync every 30 seconds when online
    setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncPendingChanges()
      }
    }, 30000)
  }

  // Add action to sync queue
  public queueAction(action: Omit<SyncQueueItem, 'id' | 'timestamp' | 'attempts'>) {
    const queueItem: SyncQueueItem = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      attempts: 0
    }

    this.syncQueue.push(queueItem)
    this.saveQueueToStorage()

    console.log(`📝 Queued ${action.action} for ${action.entityType}`, queueItem)

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingChanges()
    }

    return queueItem.id
  }

  // Main sync function
  public async syncPendingChanges(): Promise<void> {
    if (!this.isOnline || this.isSyncing || this.syncQueue.length === 0) {
      return
    }

    this.isSyncing = true
    console.log(`🔄 Syncing ${this.syncQueue.length} pending changes...`)

    const client = supabase
    const completedItems: string[] = []
    const failedItems: string[] = []

    for (const item of this.syncQueue) {
      try {
        await this.syncItem(client, item)
        completedItems.push(item.id)
        console.log(`✅ Synced ${item.action} ${item.entityType}`)
      } catch (error) {
        console.error(`❌ Failed to sync ${item.action} ${item.entityType}:`, error)
        failedItems.push(item.id)
        
        // Increment attempt count
        item.attempts += 1
        
        // Remove if too many attempts
        if (item.attempts >= 3) {
          console.warn(`🚫 Removing item after ${item.attempts} failed attempts`, item)
          completedItems.push(item.id)
        } else {
          // Schedule retry with exponential backoff
          this.scheduleRetry(item)
        }
      }
    }

    // Remove completed items from queue
    this.syncQueue = this.syncQueue.filter(item => !completedItems.includes(item.id))
    this.saveQueueToStorage()

    this.isSyncing = false
    
    if (completedItems.length > 0) {
      console.log(`✨ Completed syncing ${completedItems.length} items`)
    }
  }

  private async syncItem(supabase: any, item: SyncQueueItem): Promise<void> {
    const { action, entityType, entityId, payload } = item

    switch (entityType) {
      case 'time_entry':
        await this.syncTimeEntry(supabase, action, entityId, payload)
        break
      case 'task_template':
        await this.syncTaskTemplate(supabase, action, entityId, payload)
        break
      default:
        throw new Error(`Unknown entity type: ${entityType}`)
    }
  }

  private async syncTimeEntry(supabase: any, action: string, entityId?: string, payload?: any): Promise<void> {
    switch (action) {
      case 'create':
        const { error: createError } = await supabase
          .from('time_entries')
          .insert(payload)
        if (createError) throw createError
        break

      case 'update':
        if (!entityId) throw new Error('Entity ID required for update')
        const { error: updateError } = await supabase
          .from('time_entries')
          .update(payload)
          .eq('id', entityId)
        if (updateError) throw updateError
        break

      case 'delete':
        if (!entityId) throw new Error('Entity ID required for delete')
        const { error: deleteError } = await supabase
          .from('time_entries')
          .update({ is_deleted: true })
          .eq('id', entityId)
        if (deleteError) throw deleteError
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }

  private async syncTaskTemplate(supabase: any, action: string, entityId?: string, payload?: any): Promise<void> {
    switch (action) {
      case 'create':
        const { error: createError } = await supabase
          .from('task_templates')
          .insert(payload)
        if (createError) throw createError
        break

      case 'update':
        if (!entityId) throw new Error('Entity ID required for update')
        const { error: updateError } = await supabase
          .from('task_templates')
          .update(payload)
          .eq('id', entityId)
        if (updateError) throw updateError
        break

      case 'delete':
        if (!entityId) throw new Error('Entity ID required for delete')
        const { error: deleteError } = await supabase
          .from('task_templates')
          .delete()
          .eq('id', entityId)
        if (deleteError) throw deleteError
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }

  private scheduleRetry(item: SyncQueueItem) {
    // Clear existing timeout
    const existingTimeout = this.retryTimeouts.get(item.id)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Exponential backoff: 2^attempts * 5 seconds
    const delay = Math.pow(2, item.attempts) * 5000
    
    const timeout = setTimeout(() => {
      if (this.isOnline) {
        this.syncPendingChanges()
      }
      this.retryTimeouts.delete(item.id)
    }, delay)

    this.retryTimeouts.set(item.id, timeout)
    console.log(`⏰ Scheduled retry for ${item.id} in ${delay}ms`)
  }

  // Public methods for components to use
  public getQueueStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queueLength: this.syncQueue.length,
      lastSync: this.getLastSyncTime()
    }
  }

  private getLastSyncTime(): Date | null {
    const stored = localStorage.getItem('find-five-last-sync')
    return stored ? new Date(stored) : null
  }

  private setLastSyncTime() {
    localStorage.setItem('find-five-last-sync', new Date().toISOString())
  }

  public forceSync(): Promise<void> {
    return this.syncPendingChanges()
  }

  public clearQueue() {
    this.syncQueue = []
    this.saveQueueToStorage()
    // Clear all retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    this.retryTimeouts.clear()
  }

  public getQueueItems(): SyncQueueItem[] {
    return [...this.syncQueue]
  }
}

// Singleton instance
export const offlineSyncManager = new OfflineSyncManager()

// Utility functions for easier use in components
export const queueTimeEntryCreate = (timeEntry: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>) => {
  return offlineSyncManager.queueAction({
    action: 'create',
    entityType: 'time_entry',
    payload: timeEntry
  })
}

export const queueTimeEntryUpdate = (id: string, updates: Partial<TimeEntry>) => {
  return offlineSyncManager.queueAction({
    action: 'update',
    entityType: 'time_entry',
    entityId: id,
    payload: updates
  })
}

export const queueTimeEntryDelete = (id: string) => {
  return offlineSyncManager.queueAction({
    action: 'delete',
    entityType: 'time_entry',
    entityId: id,
    payload: {}
  })
}

export const getSyncStatus = () => {
  return offlineSyncManager.getQueueStatus()
}

export const forceSyncNow = () => {
  return offlineSyncManager.forceSync()
}