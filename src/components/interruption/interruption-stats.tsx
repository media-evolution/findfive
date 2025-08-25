'use client'

import { useEffect, useState } from 'react'
import { Group, Text, Badge, Stack, Paper, Box } from '@mantine/core'
import { IconAlertTriangle, IconClock } from '@tabler/icons-react'
import { useInterruptionStore } from '@/store/interruption-store'

interface InterruptionStatsProps {
  sessionId: string
  compact?: boolean
  className?: string
}

interface Stats {
  total: number
  bySource: Record<string, number>
  byImpact: Record<string, number>
  totalMinutes: number
  averageDuration: number
}

export function InterruptionStats({ sessionId, compact = false, className }: InterruptionStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const { getInterruptionStats } = useInterruptionStore()

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getInterruptionStats(sessionId)
        setStats(data)
      } catch (error) {
        console.error('Failed to load interruption stats:', error)
      }
    }

    if (sessionId) {
      loadStats()
    }
  }, [sessionId, getInterruptionStats])

  if (!stats || stats.total === 0) {
    return compact ? null : (
      <Paper p="sm" radius="md" bg="green.0" className={className}>
        <Group gap="xs">
          <IconAlertTriangle size={16} color="var(--mantine-color-green-6)" />
          <Text size="sm" c="green.7">
            No interruptions yet - great focus! 🎯
          </Text>
        </Group>
      </Paper>
    )
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'red'
      case 'medium': return 'yellow'
      case 'low': return 'green'
      default: return 'gray'
    }
  }

  const topSource = Object.entries(stats.bySource)
    .sort(([,a], [,b]) => b - a)[0]
  
  const topImpact = Object.entries(stats.byImpact)
    .sort(([,a], [,b]) => b - a)[0]

  if (compact) {
    return (
      <Group gap="sm" className={className}>
        <Badge variant="light" color="red" size="sm">
          {stats.total} interruptions
        </Badge>
        <Badge variant="light" color="orange" size="sm">
          {stats.totalMinutes}min lost
        </Badge>
      </Group>
    )
  }

  return (
    <Paper p="md" radius="md" bg="red.0" className={className}>
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconAlertTriangle size={18} color="var(--mantine-color-red-6)" />
            <Text fw={600} c="red.8">
              Interruption Summary
            </Text>
          </Group>
          <Badge color="red" variant="filled">
            {stats.total} total
          </Badge>
        </Group>

        <Group justify="space-between">
          <Box>
            <Text size="sm" c="dimmed">Time Lost</Text>
            <Group gap="xs" align="center">
              <IconClock size={14} />
              <Text fw={600}>{stats.totalMinutes} minutes</Text>
            </Group>
          </Box>
          
          <Box>
            <Text size="sm" c="dimmed">Avg Duration</Text>
            <Text fw={600}>{stats.averageDuration} min</Text>
          </Box>
        </Group>

        <Group justify="space-between">
          <Box>
            <Text size="sm" c="dimmed">Top Source</Text>
            <Badge variant="light" color="blue" size="sm">
              {topSource[0]} ({topSource[1]})
            </Badge>
          </Box>
          
          <Box>
            <Text size="sm" c="dimmed">Top Impact</Text>
            <Badge variant="light" color={getImpactColor(topImpact[0])} size="sm">
              {topImpact[0]} ({topImpact[1]})
            </Badge>
          </Box>
        </Group>
      </Stack>
    </Paper>
  )
}