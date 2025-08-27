// Error handling utilities and retry logic for Find Five V2

export interface RetryConfig {
  maxAttempts: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
  shouldRetry?: (error: Error, attempt: number) => boolean
}

export interface ErrorContext {
  operation: string
  userId?: string
  sessionId?: string
  timestamp: Date
  userAgent?: string
  url?: string
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public context?: ErrorContext
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  constructor(message: string, public context?: ErrorContext) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string, public context?: ErrorContext) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class VoiceError extends Error {
  constructor(message: string, public code?: string, public context?: ErrorContext) {
    super(message)
    this.name = 'VoiceError'
  }
}

// Default retry configurations for different operations
export const RETRY_CONFIGS: Record<string, RetryConfig> = {
  default: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    shouldRetry: (error: Error) => {
      // Retry on network errors, 5xx errors, but not 4xx errors
      if (error instanceof ApiError) {
        return error.status >= 500 || error.status === 408 || error.status === 429
      }
      if (error instanceof NetworkError) {
        return true
      }
      return false
    }
  },
  
  critical: {
    maxAttempts: 5,
    initialDelay: 500,
    maxDelay: 30000,
    backoffMultiplier: 2.5,
    shouldRetry: (error: Error) => {
      if (error instanceof ApiError) {
        return error.status >= 500 || error.status === 408 || error.status === 429
      }
      return error instanceof NetworkError
    }
  },
  
  background: {
    maxAttempts: 10,
    initialDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 1.5,
    shouldRetry: (error: Error, attempt: number) => {
      // Be more aggressive with background retries
      if (attempt >= 10) return false
      
      if (error instanceof ApiError) {
        return error.status >= 500 || error.status === 408 || error.status === 429 || error.status === 404
      }
      return true
    }
  },
  
  realtime: {
    maxAttempts: 2,
    initialDelay: 100,
    maxDelay: 1000,
    backoffMultiplier: 2,
    shouldRetry: (error: Error) => {
      // Quick retry for real-time operations
      return error instanceof NetworkError
    }
  }
}

// Retry wrapper function
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = RETRY_CONFIGS.default,
  context?: Partial<ErrorContext>
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Enhance error with context
      if (context && lastError instanceof ApiError) {
        lastError.context = {
          operation: context.operation || 'unknown',
          userId: context.userId,
          sessionId: context.sessionId,
          timestamp: new Date(),
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          ...context
        }
      }
      
      // Check if we should retry
      if (attempt === config.maxAttempts || !config.shouldRetry?.(lastError, attempt)) {
        // Log final failure
        console.error(`Operation failed after ${attempt} attempts:`, {
          error: lastError.message,
          context,
          attempts: attempt
        })
        throw lastError
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      )
      
      // Add jitter to prevent thundering herd
      const jitteredDelay = delay * (0.5 + Math.random() * 0.5)
      
      console.warn(`Operation failed (attempt ${attempt}/${config.maxAttempts}), retrying in ${jitteredDelay}ms:`, {
        error: lastError.message,
        context
      })
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay))
    }
  }
  
  throw lastError!
}

// Enhanced fetch with retry and error handling
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig?: RetryConfig,
  context?: Partial<ErrorContext>
): Promise<Response> {
  const config = retryConfig || RETRY_CONFIGS.default
  
  return withRetry(async () => {
    let response: Response
    
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })
    } catch (error) {
      // Network error
      throw new NetworkError(
        `Failed to connect to ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context as ErrorContext
      )
    }
    
    // Handle HTTP errors
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      let errorCode: string | undefined
      
      try {
        const errorBody = await response.json()
        if (errorBody.error) {
          errorMessage = errorBody.error
        }
        if (errorBody.code) {
          errorCode = errorBody.code
        }
      } catch {
        // Ignore JSON parsing errors for error responses
      }
      
      throw new ApiError(errorMessage, response.status, errorCode, context as ErrorContext)
    }
    
    return response
  }, config, context)
}

// Specific API call wrappers with error handling
export class ApiClient {
  private static baseUrl = '/api'
  
  static async post<T = any>(
    endpoint: string,
    data: any,
    context?: Partial<ErrorContext>
  ): Promise<T> {
    const response = await fetchWithRetry(
      `${this.baseUrl}${endpoint}`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      },
      RETRY_CONFIGS.default,
      { operation: `POST ${endpoint}`, ...context }
    )
    
    return response.json()
  }
  
  static async get<T = any>(
    endpoint: string,
    context?: Partial<ErrorContext>
  ): Promise<T> {
    const response = await fetchWithRetry(
      `${this.baseUrl}${endpoint}`,
      { method: 'GET' },
      RETRY_CONFIGS.default,
      { operation: `GET ${endpoint}`, ...context }
    )
    
    return response.json()
  }
  
  static async put<T = any>(
    endpoint: string,
    data: any,
    context?: Partial<ErrorContext>
  ): Promise<T> {
    const response = await fetchWithRetry(
      `${this.baseUrl}${endpoint}`,
      {
        method: 'PUT',
        body: JSON.stringify(data)
      },
      RETRY_CONFIGS.default,
      { operation: `PUT ${endpoint}`, ...context }
    )
    
    return response.json()
  }
  
  static async delete<T = any>(
    endpoint: string,
    context?: Partial<ErrorContext>
  ): Promise<T> {
    const response = await fetchWithRetry(
      `${this.baseUrl}${endpoint}`,
      { method: 'DELETE' },
      RETRY_CONFIGS.default,
      { operation: `DELETE ${endpoint}`, ...context }
    )
    
    return response.json()
  }
}

// Error logging and reporting
export class ErrorReporter {
  private static errors: Array<{
    id: string
    error: Error
    context?: ErrorContext
    timestamp: Date
    resolved: boolean
  }> = []
  
  static report(error: Error, context?: ErrorContext): string {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const errorReport = {
      id: errorId,
      error,
      context,
      timestamp: new Date(),
      resolved: false
    }
    
    this.errors.push(errorReport)
    
    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors.shift()
    }
    
    // Log to console
    console.group(`🚨 Error Report [${errorId}]`)
    console.error('Error:', error)
    console.error('Context:', context)
    console.error('Stack:', error.stack)
    console.groupEnd()
    
    // Store in localStorage for debugging
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('find-five-errors', JSON.stringify(this.errors))
      } catch (e) {
        console.warn('Failed to store error report:', e)
      }
    }
    
    return errorId
  }
  
  static markResolved(errorId: string): void {
    const error = this.errors.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
    }
  }
  
  static getErrors(unresolvedOnly = false): typeof this.errors {
    return unresolvedOnly 
      ? this.errors.filter(e => !e.resolved)
      : this.errors
  }
  
  static clearErrors(): void {
    this.errors = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('find-five-errors')
    }
  }
}

// User-friendly error messages
export function getErrorMessage(error: Error): string {
  if (error instanceof ValidationError) {
    return `Invalid ${error.field}: ${error.message}`
  }
  
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.'
      case 401:
        return 'You need to sign in to perform this action.'
      case 403:
        return 'You don\'t have permission to perform this action.'
      case 404:
        return 'The requested resource could not be found.'
      case 409:
        return 'This action conflicts with existing data.'
      case 429:
        return 'Too many requests. Please wait a moment and try again.'
      case 500:
        return 'A server error occurred. Please try again later.'
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again in a few moments.'
      default:
        return error.message || 'An unexpected error occurred.'
    }
  }
  
  if (error instanceof NetworkError) {
    return 'Connection failed. Please check your internet connection and try again.'
  }
  
  if (error instanceof VoiceError) {
    switch (error.code) {
      case 'NOT_ALLOWED':
        return 'Microphone access denied. Please enable microphone permissions.'
      case 'NOT_FOUND':
        return 'Microphone not found. Please check your audio device.'
      case 'NOT_SUPPORTED':
        return 'Voice recording is not supported in this browser.'
      default:
        return `Voice recording error: ${error.message}`
    }
  }
  
  return error.message || 'An unexpected error occurred.'
}

// Recovery suggestions
export function getRecoveryActions(error: Error): Array<{
  label: string
  action: string
  primary?: boolean
}> {
  const actions: Array<{ label: string; action: string; primary?: boolean }> = []
  
  if (error instanceof NetworkError) {
    actions.push(
      { label: 'Try Again', action: 'retry', primary: true },
      { label: 'Check Connection', action: 'check_network' }
    )
  } else if (error instanceof ApiError) {
    if (error.status >= 500) {
      actions.push(
        { label: 'Try Again', action: 'retry', primary: true },
        { label: 'Report Issue', action: 'report' }
      )
    } else if (error.status === 401) {
      actions.push(
        { label: 'Sign In', action: 'sign_in', primary: true }
      )
    } else if (error.status === 429) {
      actions.push(
        { label: 'Wait and Retry', action: 'wait_retry', primary: true }
      )
    } else {
      actions.push(
        { label: 'Try Again', action: 'retry', primary: true }
      )
    }
  } else if (error instanceof VoiceError) {
    actions.push(
      { label: 'Check Permissions', action: 'check_permissions', primary: true },
      { label: 'Use Text Input', action: 'use_text' }
    )
  } else {
    actions.push(
      { label: 'Try Again', action: 'retry', primary: true },
      { label: 'Go Home', action: 'go_home' }
    )
  }
  
  return actions
}