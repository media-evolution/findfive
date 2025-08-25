'use client'

import { 
  Progress, 
  Text, 
  Group, 
  Stack, 
  Badge,
  ActionIcon,
  Tooltip,
  Box,
  RingProgress,
  Center
} from '@mantine/core'
import { IconRefresh, IconCalendar, IconTrendingUp, IconClock } from '@tabler/icons-react'
import { useSession } from '@/contexts/session-context'
import { getSessionTypeLabel } from '@/types/session'

interface SessionProgressProps {
  variant?: 'compact' | 'detailed' | 'ring'
  showRefresh?: boolean
  className?: string
}

export function SessionProgress({ variant = 'compact', showRefresh = true, className }: SessionProgressProps) {
  const { currentSession, refreshCurrentSession, isLoading } = useSession()

  if (!currentSession) {
    return null
  }

  const progress = currentSession.progress
  const progressPercentage = progress?.progress_percentage || 0
  const daysElapsed = progress?.days_elapsed || 0
  const daysTotal = progress?.days_total || 0
  const daysRemaining = progress?.days_remaining || 0
  const workingDays = progress?.working_days || 0
  const leaveDays = progress?.leave_days || 0

  const isOverdue = daysRemaining < 0
  const isNearEnd = daysRemaining <= 2 && daysRemaining > 0

  const getStatusColor = () => {
    if (isOverdue) return 'red'
    if (isNearEnd) return 'yellow'
    return 'blue'
  }

  const getStatusText = () => {
    if (isOverdue) return `${Math.abs(daysRemaining)} days overdue`
    if (daysRemaining === 0) return 'Last day!'
    if (daysRemaining === 1) return '1 day remaining'
    return `${daysRemaining} days remaining`
  }

  const handleRefresh = () => {
    refreshCurrentSession()
  }

  if (variant === 'ring') {
    return (
      <Box className={className}>
        <RingProgress
          size={80}
          thickness={8}
          sections={[{ value: progressPercentage, color: getStatusColor() }]}
          label={
            <Center>
              <Text size="xs" fw={500}>
                {Math.round(progressPercentage)}%
              </Text>
            </Center>
          }
        />
      </Box>
    )
  }

  if (variant === 'compact') {
    return (
      <Group gap="sm" className={className} wrap="nowrap">
        <Stack gap={2} flex={1}>
          <Group justify="space-between" gap="xs">
            <Text size="sm" fw={500}>
              {getSessionTypeLabel(currentSession.type)}
            </Text>
            {showRefresh && (
              <ActionIcon 
                size="xs" 
                variant="subtle"
                onClick={handleRefresh}
                loading={isLoading}
              >
                <IconRefresh size={12} />
              </ActionIcon>
            )}
          </Group>
          <Progress 
            value={progressPercentage} 
            color={getStatusColor()}
            size="sm"
            radius="xl"
          />
          <Group justify="space-between" gap="xs">
            <Text size="xs" c="dimmed">
              Day {daysElapsed} of {daysTotal}
            </Text>
            <Text size="xs" c={getStatusColor()}>
              {getStatusText()}
            </Text>
          </Group>
        </Stack>
      </Group>
    )
  }

  // Detailed variant
  return (
    <Stack gap="sm" className={className}>
      <Group justify="space-between" align="center">
        <Text fw={600} size="lg">
          {getSessionTypeLabel(currentSession.type)}
        </Text>
        <Group gap="xs">
          <Badge color={getStatusColor()} variant="light">
            {currentSession.status}
          </Badge>
          {showRefresh && (
            <ActionIcon 
              variant="subtle"
              onClick={handleRefresh}
              loading={isLoading}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          )}
        </Group>
      </Group>

      <Progress 
        value={progressPercentage} 
        color={getStatusColor()}
        size="lg"
        radius="xl"
      />

      <Group justify="space-between">
        <Group gap="lg">
          <Tooltip label="Days completed">
            <Group gap={4}>
              <IconCalendar size={16} color="var(--mantine-color-blue-6)" />
              <Text size="sm" fw={500}>
                {daysElapsed}/{daysTotal}
              </Text>
            </Group>
          </Tooltip>

          <Tooltip label="Working days (excluding leave)">
            <Group gap={4}>
              <IconTrendingUp size={16} color="var(--mantine-color-green-6)" />
              <Text size="sm" fw={500}>
                {workingDays} working
              </Text>
            </Group>
          </Tooltip>

          {leaveDays > 0 && (
            <Tooltip label="Leave days taken">
              <Group gap={4}>
                <IconClock size={16} color="var(--mantine-color-yellow-6)" />
                <Text size="sm" fw={500}>
                  {leaveDays} leave
                </Text>
              </Group>
            </Tooltip>
          )}
        </Group>

        <Text size="sm" c={getStatusColor()} fw={500}>
          {getStatusText()}
        </Text>
      </Group>

      <Group justify="space-between">
        <Text size="xs" c="dimmed">
          Started {new Date(currentSession.start_date).toLocaleDateString()}
        </Text>
        <Text size="xs" c="dimmed">
          Ends {new Date(currentSession.planned_end_date).toLocaleDateString()}
        </Text>
      </Group>
    </Stack>
  )
}