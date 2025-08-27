'use client'

import { useState, useEffect, useRef } from 'react'
import { VoiceRecorder } from '@/lib/voice-recorder'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { Button, Stack, Text, Paper, Alert, Box, Group, Transition, ActionIcon } from '@mantine/core'
import { IconRefresh, IconSettings } from '@tabler/icons-react'
import { VoiceError, ErrorReporter, getErrorMessage, getRecoveryActions } from '@/lib/error-handling'

interface VoiceButtonProps {
  onTranscript: (transcript: string) => void
  className?: string
  disabled?: boolean
  onError?: (error: Error) => void
}

export function VoiceButton({ onTranscript, disabled = false, onError }: VoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<Error | null>(null)
  const [errorId, setErrorId] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isInitializing, setIsInitializing] = useState(false)
  const recorderRef = useRef<VoiceRecorder | null>(null)
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleError = (err: string | Error, code?: string) => {
    const voiceError = err instanceof Error ? err : new VoiceError(err, code)
    const id = ErrorReporter.report(voiceError, {
      operation: 'voice-recording',
      timestamp: new Date()
    })
    
    setError(voiceError)
    setErrorId(id)
    setIsRecording(false)
    setTranscript('')
    setRetryCount(prev => prev + 1)
    
    onError?.(voiceError)
  }

  const initializeRecorder = () => {
    try {
      setIsInitializing(true)
      setError(null)
      setErrorId(null)
      
      const recorder = new VoiceRecorder({
        onStart: () => {
          setIsRecording(true)
          setError(null)
          setTranscript('')
        },
        onStop: () => {
          setIsRecording(false)
          if (transcript.trim()) {
            onTranscript(transcript.trim())
            setTranscript('')
          }
        },
        onTranscript: (text) => {
          setTranscript(text)
        },
        onError: (err) => {
          if (typeof err === 'string') {
            if (err.includes('permission')) {
              handleError(err, 'NOT_ALLOWED')
            } else if (err.includes('not found') || err.includes('not available')) {
              handleError(err, 'NOT_FOUND')
            } else if (err.includes('not supported')) {
              handleError(err, 'NOT_SUPPORTED')
            } else {
              handleError(err)
            }
          } else {
            handleError(err)
          }
        }
      })

      recorderRef.current = recorder
      setIsSupported(recorder.isSupported())
      setIsInitializing(false)
      
      // Clear any existing timeout
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
      }
      
    } catch (initError) {
      console.error('Failed to initialize voice recorder:', initError)
      handleError(initError instanceof Error ? initError : new Error('Failed to initialize recorder'))
      setIsInitializing(false)
      setIsSupported(false)
    }
  }

  useEffect(() => {
    // Add timeout for initialization
    initTimeoutRef.current = setTimeout(() => {
      if (isInitializing) {
        handleError('Voice recorder initialization timed out', 'TIMEOUT')
        setIsInitializing(false)
      }
    }, 5000)

    initializeRecorder()

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
      }
      if (recorderRef.current?.getIsRecording()) {
        recorderRef.current.stopRecording()
      }
    }
  }, []) // Remove transcript dependency to prevent reinit

  const handleRetry = () => {
    setRetryCount(0)
    initializeRecorder()
  }

  const handlePermissionRequest = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      handleRetry()
    } catch (permError) {
      handleError(permError instanceof Error ? permError : new Error('Permission denied'), 'NOT_ALLOWED')
    }
  }

  const openSystemSettings = () => {
    // On most browsers, this will prompt the user to check their settings
    alert('Please check your browser settings to allow microphone access for this site.')
  }

  const handleMouseDown = () => {
    if (!disabled && !isRecording && !error) {
      try {
        recorderRef.current?.startRecording()
      } catch (startError) {
        handleError(startError instanceof Error ? startError : new Error('Failed to start recording'))
      }
    }
  }

  const handleMouseUp = () => {
    if (!disabled && isRecording) {
      try {
        recorderRef.current?.stopRecording()
      } catch (stopError) {
        handleError(stopError instanceof Error ? stopError : new Error('Failed to stop recording'))
      }
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    handleMouseDown()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    handleMouseUp()
  }

  if (isInitializing) {
    return (
      <Stack align="center" p="lg">
        <Paper
          radius="xl"
          p="xl"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4)',
          }}
        >
          <Box style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
          }}>
            <Loader2 size={32} className="animate-spin" />
          </Box>
        </Paper>
        <Text size="sm" c="dimmed">Initializing microphone...</Text>
      </Stack>
    )
  }

  if (!isSupported || (error && error instanceof VoiceError && error.code === 'NOT_SUPPORTED')) {
    return (
      <Stack align="center" p="lg">
        <MicOff size={32} color="var(--mantine-color-gray-5)" />
        <Text size="sm" c="dimmed">Voice recording not supported</Text>
        <Button size="xs" variant="light" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </Stack>
    )
  }

  return (
    <Stack align="center" gap="md">
      <Paper
        radius="xl"
        p="xl"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4)',
        }}
      >
        <Box
          component="button"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          disabled={disabled}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            background: isRecording ? 'var(--mantine-color-red-6)' : 'white',
            color: isRecording ? 'white' : 'var(--mantine-color-gray-7)',
            transform: isRecording ? 'scale(1.1)' : 'scale(1)',
            opacity: disabled ? 0.5 : 1,
            position: 'relative',
          }}
        >
          {isRecording ? (
            <Loader2 size={32} className="animate-spin" />
          ) : (
            <Mic size={32} />
          )}
          
          {isRecording && (
            <Box
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '4px solid',
                borderColor: 'var(--mantine-color-red-3)',
                animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
              }}
            />
          )}
        </Box>
      </Paper>
      
      <Box style={{ minHeight: 60, maxWidth: 320 }}>
        {error && (
          <Alert color="red" radius="lg" title="Recording Error" icon={<MicOff size={16} />}>
            <Stack gap="xs">
              <Text size="sm">{getErrorMessage(error)}</Text>
              
              {error instanceof VoiceError && (
                <Group gap="xs">
                  {error.code === 'NOT_ALLOWED' && (
                    <>
                      <Button size="xs" onClick={handlePermissionRequest}>
                        Grant Permission
                      </Button>
                      <Button size="xs" variant="light" onClick={openSystemSettings}>
                        Settings
                      </Button>
                    </>
                  )}
                  
                  {error.code === 'NOT_FOUND' && (
                    <Button size="xs" onClick={handleRetry}>
                      Retry
                    </Button>
                  )}
                  
                  {!['NOT_SUPPORTED', 'NOT_ALLOWED'].includes(error.code || '') && (
                    <Button size="xs" onClick={handleRetry}>
                      Try Again
                    </Button>
                  )}
                </Group>
              )}
              
              {retryCount > 0 && (
                <Text size="xs" c="dimmed">
                  {retryCount === 1 ? '1 retry attempt' : `${retryCount} retry attempts`}
                  {errorId && ` • Error ID: ${errorId.slice(-8)}`}
                </Text>
              )}
            </Stack>
          </Alert>
        )}
        
        <Transition mounted={isRecording} transition="fade" duration={200}>
          {(styles) => (
            <Stack style={styles} align="center" gap="xs">
              <Text size="sm" fw={500}>Recording...</Text>
              <Text size="xs" c="dimmed">Hold to continue, release to stop</Text>
            </Stack>
          )}
        </Transition>
        
        {!isRecording && !error && (
          <Text size="sm" c="dimmed" ta="center">
            Hold to record your task
          </Text>
        )}
        
        <Transition mounted={!!transcript} transition="slide-up" duration={200}>
          {(styles) => (
            <Paper style={styles} p="sm" radius="lg" bg="gray.0" mt="sm">
              <Text size="sm" c="gray.7" fs="italic">"{transcript}"</Text>
            </Paper>
          )}
        </Transition>
      </Box>
    </Stack>
  )
}

const style = document.createElement('style')
style.textContent = `
  @keyframes ping {
    75%, 100% {
      transform: scale(2);
      opacity: 0;
    }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`
document.head.appendChild(style)