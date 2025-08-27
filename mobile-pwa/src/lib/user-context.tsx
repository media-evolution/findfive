'use client'

import { useAuth } from './auth-client'

// Updated hook to use Better Auth
export function useUser() {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  return {
    userId: user?.id || '',
    user,
    isAuthenticated,
    isLoading
  }
}

// Legacy compatibility - for components that still expect userId
export function UserProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}