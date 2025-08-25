'use client'

import { useState } from 'react'
import { 
  Group, 
  Button, 
  ActionIcon, 
  Tooltip, 
  Badge, 
  Menu, 
  Text, 
  Box,
  Transition,
  Stack,
  Divider
} from '@mantine/core'
import { 
  IconCheck, 
  IconX, 
  IconChevronDown,
  IconArrowRight,
  IconAlertTriangle,
  IconCalendar,
  IconTrash
} from '@tabler/icons-react'
import { EisenhowerTask, EisenhowerQuadrant, EisenhowerService } from '@/lib/eisenhower-service'

interface BulkActionsProps {
  selectedTasks: Set<string>
  tasks: EisenhowerTask[]
  onBulkMove: (taskIds: string[], quadrant: EisenhowerQuadrant) => void
  onClearSelection: () => void
  onSelectAll: () => void
  isLoading?: boolean
}

export function BulkActions({
  selectedTasks,
  tasks,
  onBulkMove,
  onClearSelection,
  onSelectAll,
  isLoading = false
}: BulkActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const selectedCount = selectedTasks.size
  const totalTasks = tasks.length
  const isAllSelected = selectedCount === totalTasks && totalTasks > 0

  const getSelectedTasksPreview = () => {
    const selectedTaskObjects = tasks.filter(task => selectedTasks.has(task.id))
    return selectedTaskObjects.slice(0, 3).map(task => task.taskName)
  }

  const handleBulkMove = async (quadrant: EisenhowerQuadrant) => {
    setIsProcessing(true)
    try {
      await onBulkMove(Array.from(selectedTasks), quadrant)
      onClearSelection()
    } finally {
      setIsProcessing(false)
    }
  }

  const quadrantOptions = [
    {
      quadrant: 'urgent-important' as EisenhowerQuadrant,
      info: EisenhowerService.getQuadrantInfo('urgent-important'),
      shortcut: '1'
    },
    {
      quadrant: 'urgent-not-important' as EisenhowerQuadrant,
      info: EisenhowerService.getQuadrantInfo('urgent-not-important'),
      shortcut: '2'
    },
    {
      quadrant: 'not-urgent-important' as EisenhowerQuadrant,
      info: EisenhowerService.getQuadrantInfo('not-urgent-important'),
      shortcut: '3'
    },
    {
      quadrant: 'not-urgent-not-important' as EisenhowerQuadrant,
      info: EisenhowerService.getQuadrantInfo('not-urgent-not-important'),
      shortcut: '4'
    }
  ]

  if (selectedCount === 0) {
    return (
      <Box py="xs">
        <Text size="sm" c="dimmed">
          Ctrl/Cmd + Click tasks to select multiple, or drag individual tasks to categorize
        </Text>
      </Box>
    )
  }

  return (
    <Transition mounted={selectedCount > 0} transition="slide-up">
      {(styles) => (
        <Box style={styles}>
          <Box 
            p="md" 
            style={{
              backgroundColor: 'var(--mantine-color-blue-0)',
              borderRadius: 'var(--mantine-radius-md)',
              border: '1px solid var(--mantine-color-blue-2)'
            }}
          >
            <Stack gap="sm">
              {/* Selection Info */}
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <Badge color="blue" variant="filled" size="lg">
                    {selectedCount} selected
                  </Badge>
                  {selectedCount < totalTasks && (
                    <Button
                      variant="subtle"
                      size="xs"
                      onClick={onSelectAll}
                      disabled={isLoading || isProcessing}
                    >
                      Select All ({totalTasks})
                    </Button>
                  )}
                </Group>

                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={onClearSelection}
                  disabled={isLoading || isProcessing}
                >
                  <IconX size={16} />
                </ActionIcon>
              </Group>

              {/* Selected Tasks Preview */}
              {selectedCount > 0 && (
                <Box>
                  <Text size="xs" c="dimmed" mb="xs">
                    Selected tasks:
                  </Text>
                  <Group gap="xs">
                    {getSelectedTasksPreview().map((taskName, index) => (
                      <Badge key={index} variant="light" size="xs">
                        {taskName.length > 20 ? `${taskName.slice(0, 20)}...` : taskName}
                      </Badge>
                    ))}
                    {selectedCount > 3 && (
                      <Badge variant="light" size="xs" c="dimmed">
                        +{selectedCount - 3} more
                      </Badge>
                    )}
                  </Group>
                </Box>
              )}

              <Divider />

              {/* Bulk Actions */}
              <Group gap="sm">
                <Text size="sm" fw={500}>
                  Move to:
                </Text>
                
                {quadrantOptions.map(({ quadrant, info, shortcut }) => (
                  <Tooltip key={quadrant} label={`${info.description} (${shortcut})`}>
                    <Button
                      variant="light"
                      color={info.color}
                      size="sm"
                      leftSection={
                        quadrant === 'urgent-important' ? <IconAlertTriangle size={16} /> :
                        quadrant === 'urgent-not-important' ? <IconArrowRight size={16} /> :
                        quadrant === 'not-urgent-important' ? <IconCalendar size={16} /> :
                        <IconTrash size={16} />
                      }
                      onClick={() => handleBulkMove(quadrant)}
                      loading={isProcessing}
                      disabled={isLoading}
                    >
                      {info.actionType}
                    </Button>
                  </Tooltip>
                ))}
              </Group>

              {/* Quick Actions Menu */}
              <Group justify="space-between">
                <Menu shadow="md" width={280}>
                  <Menu.Target>
                    <Button 
                      variant="subtle" 
                      size="sm"
                      rightSection={<IconChevronDown size={14} />}
                      disabled={isLoading || isProcessing}
                    >
                      Quick Actions
                    </Button>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Label>Bulk Categorization</Menu.Label>
                    {quadrantOptions.map(({ quadrant, info, shortcut }) => (
                      <Menu.Item
                        key={quadrant}
                        leftSection={
                          quadrant === 'urgent-important' ? <IconAlertTriangle size={14} /> :
                          quadrant === 'urgent-not-important' ? <IconArrowRight size={14} /> :
                          quadrant === 'not-urgent-important' ? <IconCalendar size={14} /> :
                          <IconTrash size={14} />
                        }
                        rightSection={<Badge size="xs" variant="light">{shortcut}</Badge>}
                        onClick={() => handleBulkMove(quadrant)}
                        color={info.color}
                      >
                        <div>
                          <Text size="sm">{info.title}</Text>
                          <Text size="xs" c="dimmed">{info.subtitle}</Text>
                        </div>
                      </Menu.Item>
                    ))}

                    <Menu.Divider />

                    <Menu.Label>Selection</Menu.Label>
                    <Menu.Item
                      leftSection={<IconCheck size={14} />}
                      onClick={onSelectAll}
                      disabled={isAllSelected}
                    >
                      Select All Tasks ({totalTasks})
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconX size={14} />}
                      onClick={onClearSelection}
                    >
                      Clear Selection
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>

                <Text size="xs" c="dimmed">
                  Tip: Use keyboard shortcuts 1-4 for quick categorization
                </Text>
              </Group>
            </Stack>
          </Box>
        </Box>
      )}
    </Transition>
  )
}