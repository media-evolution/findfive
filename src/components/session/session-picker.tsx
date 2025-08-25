'use client'

import { useState } from 'react'
import { 
  Modal, 
  Button, 
  Text, 
  Group, 
  Stack, 
  Card, 
  Badge,
  LoadingOverlay,
  Alert,
  Center
} from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { IconCalendar, IconClock, IconTarget, IconRocket, IconAlertTriangle } from '@tabler/icons-react'
import { useSession } from '@/contexts/session-context'
import { useUser } from '@/lib/user-context'
import { 
  SessionType, 
  getSessionTypeLabel, 
  getSessionDuration, 
  calculateEndDate 
} from '@/types/session'

interface SessionPickerProps {
  opened: boolean
  onClose: () => void
}

interface SessionOption {
  type: SessionType
  label: string
  duration: number
  description: string
  color: string
  icon: React.ReactNode
  recommended?: boolean
}

const sessionOptions: SessionOption[] = [
  {
    type: '5_days',
    label: '5 Day Sprint',
    duration: 5,
    description: 'Perfect for quick habit building',
    color: 'green',
    icon: <IconRocket size={20} />
  },
  {
    type: '7_days',
    label: '1 Week Challenge',
    duration: 7,
    description: 'Build momentum with a full week',
    color: 'blue',
    icon: <IconTarget size={20} />,
    recommended: true
  },
  {
    type: '14_days',
    label: '2 Week Focus',
    duration: 14,
    description: 'Establish solid routines',
    color: 'violet',
    icon: <IconClock size={20} />
  },
  {
    type: '30_days',
    label: '30 Day Journey',
    duration: 30,
    description: 'Transform your productivity habits',
    color: 'orange',
    icon: <IconCalendar size={20} />
  }
]

export function SessionPicker({ opened, onClose }: SessionPickerProps) {
  const { createSession, isLoading, error, currentSession } = useSession()
  const { userId } = useUser()
  const [selectedType, setSelectedType] = useState<SessionType>('7_days')
  const [startDate, setStartDate] = useState<string | null>(new Date().toISOString().split('T')[0])

  const handleCreateSession = async () => {
    if (!startDate || !userId) return

    try {
      const startDateStr = startDate
      const endDateStr = calculateEndDate(startDateStr, selectedType)

      await createSession(userId, {
        type: selectedType,
        start_date: startDateStr,
        planned_end_date: endDateStr
      })

      notifications.show({
        title: 'Session Created!',
        message: `Your ${getSessionTypeLabel(selectedType)} starts today. Good luck!`,
        color: 'green'
      })

      onClose()
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to create session. Please try again.',
        color: 'red'
      })
    }
  }

  const selectedOption = sessionOptions.find(opt => opt.type === selectedType)
  const endDate = startDate ? calculateEndDate(startDate, selectedType) : null

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Start New Session"
      size="lg"
      centered
    >
      <LoadingOverlay visible={isLoading} />
      
      {currentSession?.status === 'active' && (
        <Alert 
          icon={<IconAlertTriangle size={16} />}
          title="Active Session"
          color="yellow"
          mb="md"
        >
          You already have an active session. Starting a new session will not affect your current one, 
          but you can only have one active session at a time.
        </Alert>
      )}

      {error && (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      )}

      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Choose your tracking period and start building better habits
        </Text>

        {/* Session Type Selection */}
        <Stack gap="sm">
          <Text fw={500}>Session Type</Text>
          {sessionOptions.map((option) => (
            <Card
              key={option.type}
              p="md"
              withBorder
              style={{
                cursor: 'pointer',
                borderColor: selectedType === option.type ? `var(--mantine-color-${option.color}-6)` : undefined,
                backgroundColor: selectedType === option.type ? `var(--mantine-color-${option.color}-0)` : undefined
              }}
              onClick={() => setSelectedType(option.type)}
            >
              <Group justify="space-between" wrap="nowrap">
                <Group gap="sm" flex={1}>
                  {option.icon}
                  <div>
                    <Group gap="xs" align="center">
                      <Text fw={500}>{option.label}</Text>
                      {option.recommended && (
                        <Badge size="xs" color="blue" variant="light">
                          Recommended
                        </Badge>
                      )}
                    </Group>
                    <Text size="sm" c="dimmed">
                      {option.description}
                    </Text>
                  </div>
                </Group>
                <Badge color={option.color} variant="light">
                  {option.duration} days
                </Badge>
              </Group>
            </Card>
          ))}
        </Stack>

        {/* Start Date Selection */}
        <Stack gap="sm">
          <Text fw={500}>Start Date</Text>
          <DatePicker
            value={startDate}
            onChange={(value) => setStartDate(value)}
            minDate={new Date()}
            maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
          />
        </Stack>

        {/* Session Preview */}
        {selectedOption && startDate && endDate && (
          <Card withBorder p="md" bg="gray.0">
            <Stack gap="xs">
              <Text fw={500} size="sm">Session Preview</Text>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Duration:</Text>
                <Text size="sm">{selectedOption.duration} days</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Start:</Text>
                <Text size="sm">{new Date(startDate).toLocaleDateString()}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">End:</Text>
                <Text size="sm">{new Date(endDate).toLocaleDateString()}</Text>
              </Group>
            </Stack>
          </Card>
        )}

        {/* Action Buttons */}
        <Group justify="end" gap="sm" mt="md">
          <Button variant="light" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateSession}
            loading={isLoading}
            disabled={!startDate || !userId}
            color={selectedOption?.color}
          >
            Start Session
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}