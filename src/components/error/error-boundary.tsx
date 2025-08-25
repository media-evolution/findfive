'use client'

import React, { Component, ReactNode } from 'react'
import { 
  Container, 
  Alert, 
  Title, 
  Text, 
  Button, 
  Stack, 
  Group,
  Paper,
  ThemeIcon
} from '@mantine/core'
import { 
  IconAlertTriangle, 
  IconRefresh, 
  IconBug,
  IconHome 
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  level?: 'page' | 'component' | 'critical'
  onError?: (error: Error, errorInfo: React.ErrorInfo, errorId: string) => void
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.state.errorId
    
    this.setState({
      errorInfo
    })

    // Log error details
    console.group(`🚨 Error Boundary Caught Error [${errorId}]`)
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Component Stack:', errorInfo.componentStack)
    console.groupEnd()

    // Call custom error handler
    this.props.onError?.(error, errorInfo, errorId)

    // Report to error tracking service (if available)
    if (typeof window !== 'undefined') {
      // Could integrate with Sentry, LogRocket, etc.
      try {
        const errorReport = {
          errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          level: this.props.level || 'component'
        }
        
        // Store in localStorage for debugging
        const existingErrors = JSON.parse(
          localStorage.getItem('find-five-errors') || '[]'
        )
        existingErrors.push(errorReport)
        
        // Keep only last 10 errors
        if (existingErrors.length > 10) {
          existingErrors.shift()
        }
        
        localStorage.setItem('find-five-errors', JSON.stringify(existingErrors))
      } catch (reportError) {
        console.error('Failed to report error:', reportError)
      }
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorId } = this.state
      const level = this.props.level || 'component'

      return (
        <ErrorFallback
          error={error}
          errorId={errorId}
          level={level}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  errorId: string
  level: 'page' | 'component' | 'critical'
  onRetry: () => void
  onReload: () => void
}

function ErrorFallback({ error, errorId, level, onRetry, onReload }: ErrorFallbackProps) {
  const getErrorConfig = () => {
    switch (level) {
      case 'critical':
        return {
          title: 'Critical Error',
          description: 'A critical error occurred that requires a page reload.',
          color: 'red',
          icon: <IconAlertTriangle size={24} />,
          showDetails: true,
          primaryAction: { label: 'Reload Page', action: onReload }
        }
      case 'page':
        return {
          title: 'Page Error',
          description: 'Something went wrong loading this page.',
          color: 'orange',
          icon: <IconBug size={24} />,
          showDetails: false,
          primaryAction: { label: 'Try Again', action: onRetry }
        }
      case 'component':
        return {
          title: 'Component Error',
          description: 'A component failed to render properly.',
          color: 'yellow',
          icon: <IconAlertTriangle size={20} />,
          showDetails: false,
          primaryAction: { label: 'Retry', action: onRetry }
        }
    }
  }

  const config = getErrorConfig()

  if (level === 'critical') {
    return (
      <Container size="sm" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Paper p="xl" radius="lg" w="100%" withBorder>
          <Stack align="center" gap="xl">
            <ThemeIcon size={80} radius="xl" color={config.color} variant="light">
              {config.icon}
            </ThemeIcon>
            
            <Stack align="center" gap="sm">
              <Title order={2} ta="center">{config.title}</Title>
              <Text size="lg" c="dimmed" ta="center">
                {config.description}
              </Text>
            </Stack>

            {config.showDetails && (
              <Alert color={config.color} title="Error Details" style={{ width: '100%' }}>
                <Stack gap="xs">
                  <Text size="sm">
                    <strong>Error ID:</strong> {errorId}
                  </Text>
                  <Text size="sm">
                    <strong>Message:</strong> {error?.message || 'Unknown error'}
                  </Text>
                  <Text size="xs" c="dimmed">
                    This error has been logged for debugging.
                  </Text>
                </Stack>
              </Alert>
            )}

            <Group gap="sm">
              <Button
                onClick={config.primaryAction.action}
                leftSection={<IconRefresh size={16} />}
                color={config.color}
                size="lg"
              >
                {config.primaryAction.label}
              </Button>
              
              <Button
                variant="light"
                onClick={() => window.location.href = '/'}
                leftSection={<IconHome size={16} />}
              >
                Go Home
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Container>
    )
  }

  return (
    <Alert 
      color={config.color} 
      title={config.title}
      icon={config.icon}
      style={{ margin: level === 'page' ? '20px' : '10px' }}
    >
      <Stack gap="sm">
        <Text size="sm">
          {config.description}
        </Text>
        
        {level === 'page' && (
          <Text size="xs" c="dimmed">
            Error ID: {errorId}
          </Text>
        )}
        
        <Group gap="xs">
          <Button
            size="xs"
            onClick={config.primaryAction.action}
            leftSection={<IconRefresh size={12} />}
            color={config.color}
          >
            {config.primaryAction.label}
          </Button>
          
          {level === 'page' && (
            <Button
              size="xs"
              variant="light"
              onClick={() => window.location.href = '/'}
              leftSection={<IconHome size={12} />}
            >
              Home
            </Button>
          )}
        </Group>
      </Stack>
    </Alert>
  )
}

// Specialized error boundaries for different contexts
export function PageErrorBoundary({ children, onError }: { 
  children: ReactNode
  onError?: ErrorBoundaryProps['onError'] 
}) {
  return (
    <ErrorBoundary level="page" onError={onError}>
      {children}
    </ErrorBoundary>
  )
}

export function ComponentErrorBoundary({ children, fallback, onError }: { 
  children: ReactNode
  fallback?: ReactNode
  onError?: ErrorBoundaryProps['onError'] 
}) {
  return (
    <ErrorBoundary level="component" fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  )
}

export function CriticalErrorBoundary({ children, onError }: { 
  children: ReactNode
  onError?: ErrorBoundaryProps['onError'] 
}) {
  return (
    <ErrorBoundary level="critical" onError={onError}>
      {children}
    </ErrorBoundary>
  )
}