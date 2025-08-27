'use client'

import { useEffect, useState } from 'react'
import { ConnectivityService } from './connectivity'
import { OfflineBanner } from '@/components/sync-status'

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    const connectivityService = ConnectivityService.getInstance()
    
    return () => {
      connectivityService.destroy()
    }
  }, [])
  
  return (
    <>
      {mounted && <OfflineBanner />}
      {children}
    </>
  )
}