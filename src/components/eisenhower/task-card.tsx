'use client'

import { useState } from 'react'
import { Card, Text, Badge, Group, Stack, Box, ActionIcon, Tooltip, Progress } from '@mantine/core'
import { IconClock, IconBattery, IconUser, IconBriefcase, IconHome, IconCheck } from '@tabler/icons-react'
import { EisenhowerTask } from '@/lib/eisenhower-service'

interface TaskCardProps {
  task: EisenhowerTask
  isDragging?: boolean
  isSelected?: boolean
  onSelect?: (taskId: string, selected: boolean) => void
  onHover?: (task: EisenhowerTask | null) => void
  className?: string
}

export function TaskCard({ 
  task, 
  isDragging = false, 
  isSelected = false, 
  onSelect, 
  onHover,
  className 
}: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getEnergyColor = (level: number) => {
    if (level <= 2) return 'red'
    if (level <= 3) return 'yellow'
    return 'green'
  }

  const getEnjoymentIcon = (enjoyment: string) => {
    switch (enjoyment) {
      case 'like': return '😊'
      case 'dislike': return '😞'
      default: return '😐'
    }
  }

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'work': return <IconBriefcase size={14} />
      case 'personal': return <IconHome size={14} />
      case 'both': return <IconUser size={14} />
      default: return <IconUser size={14} />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'delegate': return 'blue'
      case 'automate': return 'green'
      case 'eliminate': return 'red'
      case 'personal': return 'violet'
      default: return 'gray'
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      onSelect?.(task.id, !isSelected)
    }
  }

  return (
    <Card
      className={className}
      radius="md"
      padding="sm"
      withBorder
      onMouseEnter={() => {
        setIsHovered(true)
        onHover?.(task)
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        onHover?.(null)
      }}
      onClick={handleCardClick}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.7 : 1,
        transform: isDragging ? 'rotate(3deg)' : 'none',
        borderColor: isSelected ? 'var(--mantine-color-blue-5)' : undefined,
        backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : undefined,
        boxShadow: isHovered && !isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : undefined,
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      {/* Selection indicator */}
      {isSelected && (
        <Box
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10
          }}
        >
          <ActionIcon size="xs" color="blue" variant="filled" radius="xl">
            <IconCheck size={12} />
          </ActionIcon>
        </Box>
      )}

      <Stack gap="xs">
        {/* Task name and duration */}
        <Group justify="space-between" align="flex-start">
          <Text 
            size="sm" 
            fw={600} 
            lineClamp={2}
            style={{ flex: 1, paddingRight: isSelected ? 24 : 0 }}
          >
            {task.taskName}
          </Text>
          <Group gap="xs">
            <Badge 
              size="xs" 
              variant="light" 
              color="gray"
              leftSection={<IconClock size={10} />}
            >
              {task.durationMinutes}m
            </Badge>
          </Group>
        </Group>

        {/* Description if available */}
        {task.description && (
          <Text size="xs" c="dimmed" lineClamp={2}>
            {task.description}
          </Text>
        )}

        {/* Task metadata */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            {/* Energy level */}
            <Tooltip label={`Energy Level: ${task.energyLevel}/5`}>
              <Badge 
                size="xs" 
                variant="dot" 
                color={getEnergyColor(task.energyLevel)}
                leftSection={<IconBattery size={10} />}
              >
                {task.energyLevel}
              </Badge>
            </Tooltip>

            {/* Task type */}
            <Tooltip label={`Type: ${task.taskType}`}>
              <Badge 
                size="xs" 
                variant="outline" 
                color="gray"
                leftSection={getTaskTypeIcon(task.taskType)}
              >
                {task.taskType}
              </Badge>
            </Tooltip>

            {/* Enjoyment */}
            <Tooltip label={`Enjoyment: ${task.enjoyment}`}>
              <Text size="xs" style={{ fontSize: 12 }}>
                {getEnjoymentIcon(task.enjoyment)}
              </Text>
            </Tooltip>
          </Group>

          {/* AI Category */}
          <Badge 
            size="xs" 
            color={getCategoryColor(task.category)}
            variant="filled"
          >
            {task.category}
          </Badge>
        </Group>

        {/* Confidence score for AI categorization */}
        {task.confidenceScore > 0 && (
          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed">AI Confidence</Text>
              <Text size="xs" c="dimmed">{Math.round(task.confidenceScore * 100)}%</Text>
            </Group>
            <Progress 
              size="xs" 
              value={task.confidenceScore * 100} 
              color={task.confidenceScore > 0.8 ? 'green' : task.confidenceScore > 0.6 ? 'yellow' : 'red'}
            />
          </Box>
        )}

        {/* Task mode and frequency */}
        <Group justify="space-between">
          <Badge 
            size="xs" 
            variant="light" 
            color={task.taskMode === 'proactive' ? 'blue' : 'orange'}
          >
            {task.taskMode}
          </Badge>
          <Badge size="xs" variant="light" color="gray">
            {task.frequency}
          </Badge>
        </Group>

        {/* Session info if available */}
        {task.sessionId && (
          <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
            Session: {task.sessionId.slice(-8)}
          </Text>
        )}

        {/* Created date */}
        <Text size="xs" c="dimmed">
          {new Date(task.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </Stack>
    </Card>
  )
}