'use client'

import { create } from 'zustand'

export interface ConnectivityState {
  isOnline: boolean
  isBackOnline: boolean
  lastOfflineTime?: Date
  lastOnlineTime?: Date
  connectionType?: string
  effectiveType?: string
}

interface ConnectivityStore extends ConnectivityState {
  setOnline: (online: boolean) => void
  updateConnectionInfo: (info: Partial<ConnectivityState>) => void
  reset: () => void
}

export const useConnectivityStore = create<ConnectivityStore>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isBackOnline: false,
  
  setOnline: (online: boolean) => {
    const current = get()
    const now = new Date()
    
    set({
      isOnline: online,
      isBackOnline: !current.isOnline && online,
      lastOfflineTime: online ? current.lastOfflineTime : now,
      lastOnlineTime: online ? now : current.lastOnlineTime
    })
    
    // Reset back online flag after 5 seconds
    if (!current.isOnline && online) {
      setTimeout(() => {
        set(state => ({ ...state, isBackOnline: false }))
      }, 5000)
    }
  },
  
  updateConnectionInfo: (info: Partial<ConnectivityState>) => {
    set(state => ({ ...state, ...info }))
  },
  
  reset: () => {
    set({
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isBackOnline: false,
      lastOfflineTime: undefined,
      lastOnlineTime: undefined,
      connectionType: undefined,
      effectiveType: undefined
    })
  }
}))

export class ConnectivityService {
  private static instance: ConnectivityService
  private checkInterval?: NodeJS.Timeout
  private onlineHandler?: () => void
  private offlineHandler?: () => void
  
  private constructor() {
    this.init()
  }
  
  static getInstance(): ConnectivityService {
    if (!ConnectivityService.instance) {
      ConnectivityService.instance = new ConnectivityService()
    }
    return ConnectivityService.instance
  }
  
  private init() {
    if (typeof window === 'undefined') return
    
    // Set up event listeners
    this.onlineHandler = () => {
      useConnectivityStore.getState().setOnline(true)
      this.updateConnectionInfo()
    }
    
    this.offlineHandler = () => {
      useConnectivityStore.getState().setOnline(false)
    }
    
    window.addEventListener('online', this.onlineHandler)
    window.addEventListener('offline', this.offlineHandler)
    
    // Initial connection info
    this.updateConnectionInfo()
    
    // Periodic connectivity checks (every 30 seconds)
    this.checkInterval = setInterval(() => {
      this.performConnectivityCheck()
    }, 30000)
  }
  
  private updateConnectionInfo() {
    if (typeof window === 'undefined') return
    
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    if (connection) {
      useConnectivityStore.getState().updateConnectionInfo({
        connectionType: connection.type,
        effectiveType: connection.effectiveType
      })
    }
  }
  
  private async performConnectivityCheck() {
    if (typeof window === 'undefined') return
    
    // Only do aggressive checks if navigator.onLine is false
    // This prevents false offline detection when the server is slow
    if (!navigator.onLine) {
      useConnectivityStore.getState().setOnline(false)
      return
    }
    
    try {
      // Only do health check if browser says we're offline but we think we're online
      const currentState = useConnectivityStore.getState()
      if (!currentState.isOnline) {
        const response = await fetch('/api/health', {
          method: 'HEAD',
          cache: 'no-cache',
          signal: AbortSignal.timeout(3000) // 3 second timeout
        })
        
        if (response.ok) {
          useConnectivityStore.getState().setOnline(true)
        }
      }
    } catch (error) {
      // Don't change online status on fetch failure - could be server issue
      console.debug('Health check failed, but keeping current online status')
    }
  }
  
  async waitForConnection(timeout = 10000): Promise<boolean> {
    return new Promise((resolve) => {
      const state = useConnectivityStore.getState()
      
      if (state.isOnline) {
        resolve(true)
        return
      }
      
      const timeoutId = setTimeout(() => {
        resolve(false)
      }, timeout)
      
      const unsubscribe = useConnectivityStore.subscribe(
        (state) => {
          if (state.isOnline) {
            clearTimeout(timeoutId)
            unsubscribe()
            resolve(true)
          }
        }
      )
    })
  }
  
  isSlowConnection(): boolean {
    const state = useConnectivityStore.getState()
    return state.effectiveType === 'slow-2g' || state.effectiveType === '2g'
  }
  
  getOfflineDuration(): number | null {
    const state = useConnectivityStore.getState()
    if (state.isOnline || !state.lastOfflineTime) {
      return null
    }
    return Date.now() - state.lastOfflineTime.getTime()
  }
  
  destroy() {
    if (typeof window !== 'undefined') {
      if (this.onlineHandler) {
        window.removeEventListener('online', this.onlineHandler)
      }
      if (this.offlineHandler) {
        window.removeEventListener('offline', this.offlineHandler)
      }
    }
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
  }
}

// Enhanced fetch with connectivity awareness
export async function connectivityAwareFetch(
  url: string,
  options: RequestInit = {},
  retryOnConnection = true
): Promise<Response> {
  const connectivityService = ConnectivityService.getInstance()
  
  // Check if we're offline
  const state = useConnectivityStore.getState()
  if (!state.isOnline) {
    if (retryOnConnection) {
      const connected = await connectivityService.waitForConnection()
      if (!connected) {
        throw new Error('No internet connection available')
      }
    } else {
      throw new Error('Device is offline')
    }
  }
  
  // Adjust request based on connection quality
  const requestOptions = { ...options }
  if (connectivityService.isSlowConnection()) {
    requestOptions.priority = 'high'
    if (!requestOptions.headers) {
      requestOptions.headers = {}
    }
    
    // Add headers to optimize for slow connections
    ;(requestOptions.headers as Record<string, string>)['Accept-Encoding'] = 'gzip, deflate, br'
  }
  
  return fetch(url, requestOptions)
}