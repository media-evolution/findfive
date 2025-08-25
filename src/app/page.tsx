'use client'

import { useEffect, useState, useRef } from 'react'
import { TaskList } from '@/components/task-list-mantine'
import { TaskModal } from '@/components/task-modal-mantine'
import { BottomNav } from '@/components/bottom-nav-mantine'
import { SyncStatus } from '@/components/sync-status'
import { SessionCard } from '@/components/session/session-card'
import { InterruptionFAB } from '@/components/interruption/interruption-fab'
import { useEntriesStore } from '@/store/entries-store'
import { useUser } from '@/lib/user-context'
import { VoiceRecorder } from '@/lib/voice-recorder'
import { Mic, Plus, Keyboard, RotateCcw } from 'lucide-react'
import { 
  Container, 
  Title, 
  Text, 
  Card, 
  Button, 
  Group, 
  Stack, 
  SegmentedControl,
  Box,
  Affix,
  Transition,
  rem
} from '@mantine/core'

export default function Home() {
  const { addEntryFromVoice } = useEntriesStore()
  const { userId, isAuthenticated, isLoading } = useUser()
  const [activeTab, setActiveTab] = useState('Today')
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentDate, setCurrentDate] = useState('')
  const recorderRef = useRef<VoiceRecorder | null>(null)

  // Handle mounting and date generation
  useEffect(() => {
    setMounted(true)
    const date = new Date()
    setCurrentDate(date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }))
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/auth/signin?redirect=/'
    }
  }, [isAuthenticated, isLoading])

  // Initialize voice recorder - always call this hook
  useEffect(() => {
    if (!mounted || !isAuthenticated) return

    const recorder = new VoiceRecorder({
      onStart: () => {
        setIsRecording(true)
        setTranscript('')
      },
      onStop: () => {
        setIsRecording(false)
        if (transcript.trim()) {
          handleVoiceTranscript(transcript.trim())
          setTranscript('')
        }
      },
      onTranscript: (text) => {
        setTranscript(text)
      },
      onError: (err) => {
        console.error('Voice recording error:', err)
        setIsRecording(false)
        setTranscript('')
      }
    })

    recorderRef.current = recorder

    return () => {
      if (recorder.getIsRecording()) {
        recorder.stopRecording()
      }
    }
  }, [mounted, isAuthenticated, transcript])

  // Show loading while checking auth or not mounted
  if (isLoading || !mounted) {
    return (
      <Container size="sm" px="md">
        <Stack align="center" justify="center" style={{ minHeight: '100vh' }}>
          <Text>Loading...</Text>
        </Stack>
      </Container>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  const handleVoiceTranscript = async (transcript: string) => {
    await addEntryFromVoice(transcript, userId, 15)
  }

  const handleMouseDown = () => {
    if (!isRecording) {
      recorderRef.current?.startRecording()
    }
  }

  const handleMouseUp = () => {
    if (isRecording) {
      recorderRef.current?.stopRecording()
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

  return (
    <Box pb={80} mih="100vh" bg="gray.0">
      <Container size="sm" px="md">
        <Stack py="xl" gap="xl">
          {/* Header */}
          <Box>
            <Title order={1} size="h1" fw={800}>
              Find Five
            </Title>
            <Text size="lg" c="dimmed">
              {currentDate}
            </Text>
          </Box>

          {/* Tab Navigation */}
          <SegmentedControl
            value={activeTab}
            onChange={setActiveTab}
            data={['Today', 'This Week', 'Insights']}
            radius="xl"
            size="md"
            fullWidth
          />

          {/* Quick Capture Card */}
          <Card 
            radius="xl" 
            padding="xl"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
            shadow="xl"
          >
            <Stack gap="lg">
              <Box>
                <Title order={2} c="white" mb="xs">
                  Quick Capture
                </Title>
                <Text size="lg" c="white" opacity={0.9}>
                  Tap and hold to record what you're doing
                </Text>
              </Box>

              {/* Voice Button */}
              <Box ta="center" py="md">
                <Box
                  component="button"
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: isRecording ? 'var(--mantine-color-red-6)' : 'white',
                    transform: isRecording ? 'scale(1.1)' : 'scale(1)',
                    position: 'relative',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  }}
                >
                  <Mic 
                    size={40}
                    color={isRecording ? 'white' : '#667eea'}
                  />
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
              </Box>
              
              <Transition mounted={isRecording && !!transcript} transition="fade">
                {(styles) => (
                  <Text style={styles} ta="center" c="white" fs="italic" size="sm">
                    "{transcript}"
                  </Text>
                )}
              </Transition>
              
              <Transition mounted={isRecording} transition="fade">
                {(styles) => (
                  <Box style={styles}>
                    <Text ta="center" c="white" fw={500}>Recording...</Text>
                    <Text ta="center" c="white" size="sm" opacity={0.8}>
                      Hold to continue, release to stop
                    </Text>
                  </Box>
                )}
              </Transition>

              {/* Action Buttons */}
              <Group justify="center">
                <Button 
                  variant="white"
                  color="dark"
                  leftSection={<Keyboard size={16} />}
                  onClick={() => setIsModalOpen(true)}
                  radius="xl"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                >
                  Type
                </Button>
                <Button 
                  variant="white"
                  color="dark"
                  leftSection={<RotateCcw size={16} />}
                  onClick={() => {
                    setTranscript('')
                    if (isRecording) {
                      recorderRef.current?.stopRecording()
                    }
                  }}
                  radius="xl"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                >
                  Restart
                </Button>
              </Group>
            </Stack>
          </Card>

          {/* Session Card */}
          <SessionCard />

          <TaskList />

          {/* Sync Status */}
          <SyncStatus />
        </Stack>
      </Container>

      {/* Floating Action Button */}
      <Affix position={{ bottom: 90, right: 20 }}>
        <Transition transition="slide-up" mounted={true}>
          {(transitionStyles) => (
            <Button
              size="xl"
              radius="xl"
              onClick={() => setIsModalOpen(true)}
              style={{
                ...transitionStyles,
                width: 56,
                height: 56,
                padding: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <Plus size={28} />
            </Button>
          )}
        </Transition>
      </Affix>

      {/* Task Modal */}
      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Interruption FAB */}
      <InterruptionFAB />

      {/* Bottom Navigation */}
      <BottomNav />
    </Box>
  )
}