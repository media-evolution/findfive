'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/lib/auth-client'
import { SessionProgressHeader } from '@/components/session/session-progress-header'

interface AuthenticatedLayoutProps {
  children: ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <>
      {/* Only show the timer when user is authenticated and not loading */}
      {isAuthenticated && !isLoading && <SessionProgressHeader />}
      {children}
    </>
  )
}