'use client'

import { useState } from 'react'
import { 
  Table, 
  Text, 
  Badge, 
  Group, 
  ActionIcon, 
  Select, 
  Button,
  Card,
  Checkbox,
  Stack,
  Box,
  Paper,
  Tooltip
} from '@mantine/core'
import { IconCheck, IconX, IconArrowUp, IconArrowDown } from '@tabler/icons-react'
import { EisenhowerTask, EisenhowerQuadrant, EisenhowerService } from '@/lib/eisenhower-service'

interface TasksTableProps {
  tasks: EisenhowerTask[]
  selectedTasks: Set<string>
  onTaskSelect: (taskId: string, selected: boolean) => void
  onTaskMove: (taskId: string, quadrant: EisenhowerQuadrant) => void
  onBulkMove: (taskIds: string[], quadrant: EisenhowerQuadrant) => void
  isLoading: boolean
}

export function TasksTable({
  tasks,
  selectedTasks,
  onTaskSelect,
  onTaskMove,
  onBulkMove,
  isLoading
}: TasksTableProps) {
  const [editingTask, setEditingTask] = useState<string | null>(null)

  const getQuadrantBadge = (task: EisenhowerTask) => {
    if (!task.urgency || !task.importance) {
      return <Badge color="gray" size="sm">Uncategorized</Badge>
    }

    const quadrant = EisenhowerService.getQuadrantFromUrgencyImportance(task.urgency, task.importance)
    if (!quadrant) return <Badge color="gray" size="sm">Uncategorized</Badge>

    const info = EisenhowerService.getQuadrantInfo(quadrant)
    return (
      <Badge color={info.color} size="sm" variant="light">
        {info.title}
      </Badge>
    )
  }

  const getUrgencyImportanceDisplay = (task: EisenhowerTask) => {
    const urgency = task.urgency || 'not_urgent'
    const importance = task.importance || 'not_important'
    
    return (
      <Group gap="xs">
        <Badge 
          color={urgency === 'urgent' ? 'red' : 'blue'} 
          size="xs" 
          variant="filled"
          leftSection={urgency === 'urgent' ? <IconArrowUp size={10} /> : <IconArrowDown size={10} />}
        >
          {urgency === 'urgent' ? 'Urgent' : 'Not Urgent'}
        </Badge>
        <Badge 
          color={importance === 'important' ? 'green' : 'orange'} 
          size="xs" 
          variant="filled"
          leftSection={importance === 'important' ? <IconArrowUp size={10} /> : <IconArrowDown size={10} />}
        >
          {importance === 'important' ? 'Important' : 'Not Important'}
        </Badge>
      </Group>
    )
  }

  const handleQuadrantChange = (taskId: string, quadrant: string) => {
    if (quadrant && quadrant !== 'uncategorized') {
      onTaskMove(taskId, quadrant as EisenhowerQuadrant)
    }
    setEditingTask(null)
  }

  const quadrantOptions = [
    { value: 'uncategorized', label: 'Uncategorized' },
    { value: 'urgent-important', label: '🔥 Do First (Urgent + Important)' },
    { value: 'not-urgent-important', label: '📅 Schedule (Not Urgent + Important)' },
    { value: 'urgent-not-important', label: '👥 Delegate (Urgent + Not Important)' },
    { value: 'not-urgent-not-important', label: '🗑️ Eliminate (Not Urgent + Not Important)' },
  ]

  const QuickClassifyButtons = ({ task }: { task: EisenhowerTask }) => (
    <Group gap="xs">
      <Tooltip label="Do First - Urgent & Important">
        <ActionIcon
          size="sm"
          variant="light"
          color="red"
          onClick={() => handleQuadrantChange(task.id, 'urgent-important')}
        >
          🔥
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Schedule - Not Urgent & Important">
        <ActionIcon
          size="sm"
          variant="light"
          color="green"
          onClick={() => handleQuadrantChange(task.id, 'not-urgent-important')}
        >
          📅
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Delegate - Urgent & Not Important">
        <ActionIcon
          size="sm"
          variant="light"
          color="yellow"
          onClick={() => handleQuadrantChange(task.id, 'urgent-not-important')}
        >
          👥
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Eliminate - Not Urgent & Not Important">
        <ActionIcon
          size="sm"
          variant="light"
          color="gray"
          onClick={() => handleQuadrantChange(task.id, 'not-urgent-not-important')}
        >
          🗑️
        </ActionIcon>
      </Tooltip>
    </Group>
  )

  if (tasks.length === 0) {
    return (
      <Card radius="lg" withBorder>
        <Text ta="center" c="dimmed" py="xl">
          No tasks to categorize
        </Text>
      </Card>
    )
  }

  return (
    <Card radius="lg" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={600}>Task Classification</Text>
          <Text size="sm" c="dimmed">
            {tasks.length} tasks • {tasks.filter(t => t.quadrant).length} categorized
          </Text>
        </Group>

        <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
          <Table stickyHeader highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: '40px' }}>
                  <Checkbox
                    checked={selectedTasks.size === tasks.length && tasks.length > 0}
                    indeterminate={selectedTasks.size > 0 && selectedTasks.size < tasks.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        tasks.forEach(task => onTaskSelect(task.id, true))
                      } else {
                        tasks.forEach(task => onTaskSelect(task.id, false))
                      }
                    }}
                  />
                </Table.Th>
                <Table.Th>Task</Table.Th>
                <Table.Th>Details</Table.Th>
                <Table.Th>Current Status</Table.Th>
                <Table.Th>Quick Classify</Table.Th>
                <Table.Th>Advanced</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tasks.map((task) => (
                <Table.Tr key={task.id}>
                  <Table.Td>
                    <Checkbox
                      checked={selectedTasks.has(task.id)}
                      onChange={(e) => onTaskSelect(task.id, e.target.checked)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Box style={{ maxWidth: 200 }}>
                      <Text fw={500} size="sm" lineClamp={2}>
                        {task.taskName}
                      </Text>
                      {task.description && (
                        <Text size="xs" c="dimmed" lineClamp={1} mt={2}>
                          {task.description}
                        </Text>
                      )}
                    </Box>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={4}>
                      <Group gap="xs">
                        <Badge size="xs" color="blue">{task.durationMinutes}m</Badge>
                        <Badge size="xs" color="orange">⚡{task.energyLevel}/5</Badge>
                        <Badge 
                          size="xs" 
                          color={task.taskType === 'work' ? 'violet' : task.taskType === 'personal' ? 'teal' : 'cyan'}
                        >
                          {task.taskType}
                        </Badge>
                      </Group>
                      <Group gap="xs">
                        <Badge size="xs" color="gray" variant="light">
                          {task.taskMode}
                        </Badge>
                        <Badge 
                          size="xs" 
                          color={task.enjoyment === 'like' ? 'green' : task.enjoyment === 'dislike' ? 'red' : 'gray'} 
                          variant="light"
                        >
                          {task.enjoyment === 'like' ? '😊' : task.enjoyment === 'dislike' ? '😞' : '😐'}
                        </Badge>
                      </Group>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap="xs">
                      {getQuadrantBadge(task)}
                      <Box style={{ fontSize: '11px' }}>
                        {getUrgencyImportanceDisplay(task)}
                      </Box>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <QuickClassifyButtons task={task} />
                  </Table.Td>
                  <Table.Td>
                    {editingTask === task.id ? (
                      <Group gap="xs">
                        <Select
                          size="xs"
                          data={quadrantOptions}
                          value={task.quadrant || 'uncategorized'}
                          onChange={(value) => handleQuadrantChange(task.id, value || 'uncategorized')}
                          style={{ width: 200 }}
                        />
                        <ActionIcon 
                          size="sm" 
                          variant="light" 
                          color="red"
                          onClick={() => setEditingTask(null)}
                        >
                          <IconX size={12} />
                        </ActionIcon>
                      </Group>
                    ) : (
                      <Button 
                        size="xs" 
                        variant="light"
                        onClick={() => setEditingTask(task.id)}
                      >
                        Edit
                      </Button>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>

        {selectedTasks.size > 0 && (
          <Paper p="md" withBorder radius="md" bg="blue.0">
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                {selectedTasks.size} task{selectedTasks.size > 1 ? 's' : ''} selected
              </Text>
              <Group gap="xs">
                <Button
                  size="xs"
                  color="red"
                  onClick={() => onBulkMove(Array.from(selectedTasks), 'urgent-important')}
                >
                  🔥 Do First
                </Button>
                <Button
                  size="xs"
                  color="green"
                  onClick={() => onBulkMove(Array.from(selectedTasks), 'not-urgent-important')}
                >
                  📅 Schedule
                </Button>
                <Button
                  size="xs"
                  color="yellow"
                  onClick={() => onBulkMove(Array.from(selectedTasks), 'urgent-not-important')}
                >
                  👥 Delegate
                </Button>
                <Button
                  size="xs"
                  color="gray"
                  onClick={() => onBulkMove(Array.from(selectedTasks), 'not-urgent-not-important')}
                >
                  🗑️ Eliminate
                </Button>
              </Group>
            </Group>
          </Paper>
        )}
      </Stack>
    </Card>
  )
}