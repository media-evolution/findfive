'use client'

import { ReactNode } from 'react'
import { Container, Loader, Center, Stack } from '@mantine/core'
import { useAuth } from '@/lib/auth-client'
import { AuthForms } from './auth-forms'

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ 
  children, 
  fallback,
  requireAuth = true 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
        </Stack>
      </Center>
    )
  }

  // If auth is required and user is not authenticated, show auth forms
  if (requireAuth && !isAuthenticated) {
    return (
      <Container size="sm" py="xl">
        {fallback || <AuthForms />}
      </Container>
    )
  }

  // If user is authenticated or auth is not required, show children
  return <>{children}</>
}

// Higher-order component version for pages
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: { requireAuth?: boolean; fallback?: ReactNode } = {}
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard 
        requireAuth={options.requireAuth} 
        fallback={options.fallback}
      >
        <Component {...props} />
      </AuthGuard>
    )
  }
}