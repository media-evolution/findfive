'use client'

import { 
  Card, 
  Text, 
  Group, 
  Stack, 
  Button,
  Badge,
  Center,
  Box,
  ActionIcon,
  Menu
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconPlus, IconDotsVertical, IconPlayerPlay, IconPlayerPause, IconCheck, IconCalendarPlus } from '@tabler/icons-react'
import { useSession } from '@/contexts/session-context'
import { SessionProgress } from './session-progress'
import { SessionPicker } from './session-picker'
import { getSessionTypeLabel } from '@/types/session'

interface SessionCardProps {
  className?: string
}

export function SessionCard({ className }: SessionCardProps) {
  const { 
    currentSession, 
    hasActiveSession, 
    completeSession, 
    pauseSession, 
    resumeSession,
    isLoading 
  } = useSession()
  const [pickerOpened, { open: openPicker, close: closePicker }] = useDisclosure(false)

  const handleCompleteSession = async () => {
    if (!currentSession) return
    
    try {
      await completeSession({
        sessionId: currentSession.id,
        actualEndDate: new Date().toISOString().split('T')[0]
      })
    } catch (error) {
      console.error('Failed to complete session:', error)
    }
  }

  const handlePauseSession = async () => {
    if (!currentSession) return
    
    try {
      await pauseSession(currentSession.id)
    } catch (error) {
      console.error('Failed to pause session:', error)
    }
  }

  const handleResumeSession = async () => {
    if (!currentSession) return
    
    try {
      await resumeSession(currentSession.id)
    } catch (error) {
      console.error('Failed to resume session:', error)
    }
  }

  // No active session - show start new session card
  if (!currentSession) {
    return (
      <>
        <Card withBorder p="xl" className={className}>
          <Center>
            <Stack align="center" gap="md">
              <Box 
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  border: '2px dashed var(--mantine-color-gray-4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <IconPlus size={32} color="var(--mantine-color-gray-5)" />
              </Box>
              
              <Stack align="center" gap="xs">
                <Text fw={600} size="lg" ta="center">
                  Ready to Start Tracking?
                </Text>
                <Text size="sm" c="dimmed" ta="center" maw={280}>
                  Begin a new session to track your productivity and build better habits
                </Text>
              </Stack>

              <Button 
                leftSection={<IconPlus size={16} />}
                size="md"
                radius="xl"
                onClick={openPicker}
              >
                Start New Session
              </Button>
            </Stack>
          </Center>
        </Card>

        <SessionPicker opened={pickerOpened} onClose={closePicker} />
      </>
    )
  }

  // Active session card
  return (
    <>
      <Card withBorder p="lg" className={className}>
        <Stack gap="md">
          {/* Header with session type and actions */}
          <Group justify="space-between" align="flex-start">
            <Stack gap={4}>
              <Group gap="sm" align="center">
                <Text fw={600} size="lg">
                  Current Session
                </Text>
                <Badge 
                  color={currentSession.status === 'active' ? 'green' : 'yellow'} 
                  variant="light"
                >
                  {currentSession.status}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                {getSessionTypeLabel(currentSession.type)}
              </Text>
            </Stack>

            <Menu shadow="md" width={180}>
              <Menu.Target>
                <ActionIcon variant="subtle" size="sm">
                  <IconDotsVertical size={16} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                {currentSession.status === 'active' ? (
                  <>
                    <Menu.Item 
                      leftSection={<IconPlayerPause size={14} />}
                      onClick={handlePauseSession}
                      disabled={isLoading}
                    >
                      Pause Session
                    </Menu.Item>
                    <Menu.Item 
                      leftSection={<IconCheck size={14} />}
                      onClick={handleCompleteSession}
                      disabled={isLoading}
                    >
                      Complete Session
                    </Menu.Item>
                  </>
                ) : (
                  <Menu.Item 
                    leftSection={<IconPlayerPlay size={14} />}
                    onClick={handleResumeSession}
                    disabled={isLoading}
                  >
                    Resume Session
                  </Menu.Item>
                )}
                <Menu.Divider />
                <Menu.Item 
                  leftSection={<IconCalendarPlus size={14} />}
                  onClick={openPicker}
                >
                  Start New Session
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>

          {/* Progress Display */}
          <SessionProgress variant="detailed" showRefresh={false} />

          {/* Quick Stats */}
          {currentSession.progress && (
            <Group justify="center" gap="xl" mt="sm">
              <Stack align="center" gap={2}>
                <Text size="xl" fw={700} c="blue">
                  {Math.round(currentSession.progress.progress_percentage)}%
                </Text>
                <Text size="xs" c="dimmed" ta="center">
                  Complete
                </Text>
              </Stack>

              <Stack align="center" gap={2}>
                <Text size="xl" fw={700} c="green">
                  {currentSession.progress.working_days}
                </Text>
                <Text size="xs" c="dimmed" ta="center">
                  Working Days
                </Text>
              </Stack>

              {currentSession.progress.leave_days > 0 && (
                <Stack align="center" gap={2}>
                  <Text size="xl" fw={700} c="yellow">
                    {currentSession.progress.leave_days}
                  </Text>
                  <Text size="xs" c="dimmed" ta="center">
                    Leave Days
                  </Text>
                </Stack>
              )}

              <Stack align="center" gap={2}>
                <Text 
                  size="xl" 
                  fw={700} 
                  c={currentSession.progress.days_remaining < 0 ? 'red' : 'dimmed'}
                >
                  {Math.abs(currentSession.progress.days_remaining)}
                </Text>
                <Text size="xs" c="dimmed" ta="center">
                  {currentSession.progress.days_remaining < 0 ? 'Overdue' : 'Days Left'}
                </Text>
              </Stack>
            </Group>
          )}
        </Stack>
      </Card>

      <SessionPicker opened={pickerOpened} onClose={closePicker} />
    </>
  )
}