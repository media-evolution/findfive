'use client'

import { useState } from 'react'
import { 
  Modal, 
  Button, 
  Group, 
  Stack, 
  Text, 
  Textarea,
  ActionIcon,
  Paper,
  Badge,
  Center,
  Box,
  Grid
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { 
  IconMail, 
  IconPhone, 
  IconUsers, 
  IconUser, 
  IconBuildingStore, 
  IconDots,
  IconClock,
  IconX
} from '@tabler/icons-react'
import { useInterruptionStore } from '@/store/interruption-store'
import { useSession } from '@/contexts/session-context'
import type { Interruption } from '@/types/session'

interface InterruptionModalProps {
  opened: boolean
  onClose: () => void
}

const interruptionSources = [
  { 
    key: 'self' as const, 
    label: 'Self', 
    icon: IconUser, 
    color: 'blue',
    description: 'Internal distraction'
  },
  { 
    key: 'email' as const, 
    label: 'Email', 
    icon: IconMail, 
    color: 'orange',
    description: 'Email notification'
  },
  { 
    key: 'phone' as const, 
    label: 'Phone', 
    icon: IconPhone, 
    color: 'green',
    description: 'Phone call/text'
  },
  { 
    key: 'team' as const, 
    label: 'Team', 
    icon: IconUsers, 
    color: 'violet',
    description: 'Team member'
  },
  { 
    key: 'client' as const, 
    label: 'Client', 
    icon: IconBuildingStore, 
    color: 'red',
    description: 'Client request'
  },
  { 
    key: 'other' as const, 
    label: 'Other', 
    icon: IconDots, 
    color: 'gray',
    description: 'Other source'
  }
]

const impactLevels = [
  { 
    key: 'low' as const, 
    label: 'Low', 
    color: 'green',
    description: 'Minor disruption'
  },
  { 
    key: 'medium' as const, 
    label: 'Medium', 
    color: 'yellow',
    description: 'Noticeable impact'
  },
  { 
    key: 'high' as const, 
    label: 'High', 
    color: 'red',
    description: 'Significant disruption'
  }
]

const durationPresets = [
  { minutes: 5, label: '5min' },
  { minutes: 15, label: '15min' },
  { minutes: 30, label: '30min' },
  { minutes: 60, label: '1hr' }
]

export function InterruptionModal({ opened, onClose }: InterruptionModalProps) {
  const [source, setSource] = useState<Interruption['source']>('self')
  const [impact, setImpact] = useState<Interruption['impact']>('medium')
  const [duration, setDuration] = useState(5)
  const [customDuration, setCustomDuration] = useState('')
  const [description, setDescription] = useState('')
  const [showCustomDuration, setShowCustomDuration] = useState(false)

  const { createInterruption, isLoading } = useInterruptionStore()
  const { currentSession } = useSession()

  const handleSubmit = async () => {
    if (!currentSession) {
      notifications.show({
        title: 'No Active Session',
        message: 'Please start a session first to track interruptions',
        color: 'orange'
      })
      return
    }

    const finalDuration = showCustomDuration ? 
      parseInt(customDuration) || 5 : duration

    try {
      await createInterruption({
        session_id: currentSession.id,
        source,
        impact,
        duration_minutes: finalDuration,
        description: description.trim() || undefined,
        occurred_at: new Date().toISOString()
      })

      notifications.show({
        title: 'Interruption Logged',
        message: `${finalDuration}min ${impact} impact interruption recorded`,
        color: 'blue',
        autoClose: 2000
      })

      // Reset form
      setSource('self')
      setImpact('medium')
      setDuration(5)
      setCustomDuration('')
      setDescription('')
      setShowCustomDuration(false)
      onClose()
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to log interruption. Saved for offline sync.',
        color: 'yellow'
      })
      onClose()
    }
  }

  const selectedSource = interruptionSources.find(s => s.key === source)
  const selectedImpact = impactLevels.find(i => i.key === impact)

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Text size="lg" fw={600}>Log Interruption</Text>
          <Badge color="red" variant="light" size="sm">
            Quick Capture
          </Badge>
        </Group>
      }
      size="md"
      centered
      overlayProps={{ backgroundOpacity: 0.5, blur: 2 }}
      radius="xl"
      transitionProps={{ transition: 'pop' }}
    >
      <Stack gap="md">
        {!currentSession && (
          <Paper p="sm" radius="md" bg="orange.0">
            <Text size="sm" c="orange.8" ta="center">
              ⚠️ No active session. Start a session to track interruptions.
            </Text>
          </Paper>
        )}

        {/* Source Selection */}
        <Box>
          <Text size="sm" fw={600} mb="sm">What interrupted you?</Text>
          <Grid>
            {interruptionSources.map((src) => (
              <Grid.Col span={4} key={src.key}>
                <Paper
                  p="sm"
                  radius="md"
                  style={{ 
                    cursor: 'pointer',
                    border: source === src.key ? `2px solid var(--mantine-color-${src.color}-6)` : '1px solid var(--mantine-color-gray-3)',
                    backgroundColor: source === src.key ? `var(--mantine-color-${src.color}-0)` : 'transparent'
                  }}
                  onClick={() => setSource(src.key)}
                >
                  <Center>
                    <Stack gap={4} align="center">
                      <src.icon 
                        size={20} 
                        color={source === src.key ? `var(--mantine-color-${src.color}-6)` : 'var(--mantine-color-gray-6)'}
                      />
                      <Text 
                        size="xs" 
                        fw={source === src.key ? 600 : 400}
                        c={source === src.key ? `${src.color}.7` : 'gray.7'}
                        ta="center"
                      >
                        {src.label}
                      </Text>
                    </Stack>
                  </Center>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>
          {selectedSource && (
            <Text size="xs" c="dimmed" mt="xs">
              {selectedSource.description}
            </Text>
          )}
        </Box>

        {/* Impact Level */}
        <Box>
          <Text size="sm" fw={600} mb="sm">Impact level?</Text>
          <Group gap="sm">
            {impactLevels.map((level) => (
              <Button
                key={level.key}
                variant={impact === level.key ? 'filled' : 'light'}
                color={level.color}
                size="sm"
                onClick={() => setImpact(level.key)}
                flex={1}
              >
                {level.label}
              </Button>
            ))}
          </Group>
          {selectedImpact && (
            <Text size="xs" c="dimmed" mt="xs">
              {selectedImpact.description}
            </Text>
          )}
        </Box>

        {/* Duration */}
        <Box>
          <Text size="sm" fw={600} mb="sm">How long?</Text>
          {!showCustomDuration ? (
            <Group gap="sm">
              {durationPresets.map((preset) => (
                <Button
                  key={preset.minutes}
                  variant={duration === preset.minutes ? 'filled' : 'light'}
                  size="sm"
                  onClick={() => setDuration(preset.minutes)}
                  leftSection={<IconClock size={14} />}
                >
                  {preset.label}
                </Button>
              ))}
              <Button
                variant="light"
                size="sm"
                color="gray"
                onClick={() => setShowCustomDuration(true)}
              >
                Custom
              </Button>
            </Group>
          ) : (
            <Group gap="sm">
              <input
                type="number"
                placeholder="Minutes"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid var(--mantine-color-gray-4)',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                min="1"
                max="480"
                autoFocus
              />
              <ActionIcon
                variant="light"
                color="red"
                onClick={() => {
                  setShowCustomDuration(false)
                  setCustomDuration('')
                }}
              >
                <IconX size={16} />
              </ActionIcon>
            </Group>
          )}
        </Box>

        {/* Description */}
        <Textarea
          label="Details (optional)"
          placeholder="Brief description of the interruption..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          minRows={2}
          maxRows={3}
          radius="md"
        />

        {/* Action Buttons */}
        <Group gap="sm" mt="md">
          <Button
            variant="light"
            onClick={onClose}
            flex={1}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isLoading}
            disabled={!currentSession}
            flex={1}
            color="red"
          >
            Log Interruption
          </Button>
        </Group>

        {/* Quick Stats */}
        <Paper p="xs" radius="md" bg="gray.0">
          <Text size="xs" c="dimmed" ta="center">
            Occurred: {new Date().toLocaleTimeString()} • 
            Duration: {showCustomDuration ? (customDuration || '0') : duration}min • 
            Impact: {impact}
          </Text>
        </Paper>
      </Stack>
    </Modal>
  )
}