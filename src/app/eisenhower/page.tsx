'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Container,
  Title,
  Text,
  Stack,
  Box,
  Alert,
  LoadingOverlay,
  Progress,
  Group,
  Badge,
  Button
} from '@mantine/core'
import { IconInfoCircle, IconArrowLeft, IconBulb } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { MatrixGrid } from '@/components/eisenhower/matrix-grid'
import { BulkActions } from '@/components/eisenhower/bulk-actions'
import { FilterControls } from '@/components/eisenhower/filter-controls'
import { 
  EisenhowerService, 
  EisenhowerTask, 
  EisenhowerQuadrant, 
  EisenhowerFilters,
  EisenhowerStats 
} from '@/lib/eisenhower-service'
import { useUser } from '@/lib/user-context'
import { useEntriesStore } from '@/store/entries-store'
import { showNotification } from '@mantine/notifications'

export default function EisenhowerPage() {
  const router = useRouter()
  const { userId, isAuthenticated, isLoading: authLoading } = useUser()
  const { entries } = useEntriesStore()
  
  const [tasks, setTasks] = useState<EisenhowerTask[]>([])
  const [filteredTasks, setFilteredTasks] = useState<EisenhowerTask[]>([])
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [hoveredTask, setHoveredTask] = useState<EisenhowerTask | null>(null)
  const [stats, setStats] = useState<EisenhowerStats | null>(null)
  const [filters, setFilters] = useState<EisenhowerFilters>({
    userId: userId || ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin?redirect=/eisenhower')
    }
  }, [isAuthenticated, authLoading, router])

  // Update filters when userId changes
  useEffect(() => {
    if (userId) {
      setFilters(prev => ({ ...prev, userId }))
    }
  }, [userId])

  // Convert entries to Eisenhower tasks
  const convertEntriesToTasks = useCallback((entries: any[]): EisenhowerTask[] => {
    return entries.map(entry => ({
      id: entry.id,
      taskName: entry.task_name,
      description: entry.description,
      category: entry.category as 'delegate' | 'automate' | 'eliminate' | 'personal',
      confidenceScore: entry.confidence_score || 0,
      durationMinutes: entry.duration_minutes,
      energyLevel: entry.energy_level || 3,
      taskMode: entry.task_mode as 'proactive' | 'reactive' || 'reactive',
      enjoyment: entry.enjoyment as 'like' | 'neutral' | 'dislike' || 'neutral',
      taskType: entry.task_type as 'personal' | 'work' | 'both' || 'work',
      frequency: entry.frequency as 'daily' | 'regular' | 'infrequent' || 'regular',
      urgency: entry.urgency as 'urgent' | 'not_urgent',
      importance: entry.importance as 'important' | 'not_important',
      quadrant: EisenhowerService.getQuadrantFromUrgencyImportance(entry.urgency, entry.importance),
      createdAt: entry.created_at,
      sessionId: entry.session_id,
      userId: entry.user_id || userId || ''
    }))
  }, [userId])

  // Load tasks from local store
  const loadData = useCallback(() => {
    if (!userId) return

    setIsLoading(true)
    setError(null)
    
    try {
      const tasksData = convertEntriesToTasks(entries)
      setTasks(tasksData)
      setFilteredTasks(tasksData)
      
      // Calculate stats locally
      const total = tasksData.length
      const categorized = tasksData.filter(t => t.quadrant).length
      const uncategorized = total - categorized

      const byQuadrant: Record<EisenhowerQuadrant, number> = {
        'urgent-important': 0,
        'urgent-not-important': 0,
        'not-urgent-important': 0,
        'not-urgent-not-important': 0
      }

      const byCategory: Record<string, number> = {}

      tasksData.forEach(task => {
        if (task.quadrant) {
          byQuadrant[task.quadrant]++
        }
        byCategory[task.category] = (byCategory[task.category] || 0) + 1
      })

      setStats({
        total,
        categorized,
        uncategorized,
        byQuadrant,
        byCategory
      })
    } catch (err) {
      console.error('Failed to load Eisenhower data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [entries, userId, convertEntriesToTasks])

  // Load data on mount and filter changes
  useEffect(() => {
    if (userId) {
      loadData()
    }
  }, [loadData, userId])

  // Handle task movement
  const handleTaskMove = async (taskId: string, quadrant: EisenhowerQuadrant) => {
    try {
      const { urgency, importance } = EisenhowerService.quadrantToUrgencyImportance(quadrant)
      
      // Update in entries store
      const { updateEntry } = useEntriesStore.getState()
      updateEntry(taskId, { urgency, importance })
      
      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, quadrant, urgency, importance }
          : task
      ))
      
      setFilteredTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, quadrant, urgency, importance }
          : task
      ))

      showNotification({
        title: 'Task Updated',
        message: `Task moved to ${EisenhowerService.getQuadrantInfo(quadrant).title}`,
        color: 'green'
      })

      // Recalculate stats
      loadData()
    } catch (err) {
      console.error('Failed to update task:', err)
      showNotification({
        title: 'Error',
        message: 'Failed to update task. Please try again.',
        color: 'red'
      })
    }
  }

  // Handle bulk task movement
  const handleBulkMove = async (taskIds: string[], quadrant: EisenhowerQuadrant) => {
    try {
      const { urgency, importance } = EisenhowerService.quadrantToUrgencyImportance(quadrant)
      const { updateEntry } = useEntriesStore.getState()
      
      // Update all tasks in entries store
      taskIds.forEach(taskId => {
        updateEntry(taskId, { urgency, importance })
      })
      
      // Update local state
      const updateTask = (task: EisenhowerTask) => 
        taskIds.includes(task.id) 
          ? { ...task, quadrant, urgency, importance }
          : task

      setTasks(prev => prev.map(updateTask))
      setFilteredTasks(prev => prev.map(updateTask))

      showNotification({
        title: 'Tasks Updated',
        message: `${taskIds.length} tasks moved to ${EisenhowerService.getQuadrantInfo(quadrant).title}`,
        color: 'green'
      })

      // Recalculate stats
      loadData()
    } catch (err) {
      console.error('Failed to bulk update tasks:', err)
      showNotification({
        title: 'Error',
        message: 'Failed to update tasks. Please try again.',
        color: 'red'
      })
    }
  }

  // Handle task selection
  const handleTaskSelect = (taskId: string, selected: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(taskId)
      } else {
        newSet.delete(taskId)
      }
      return newSet
    })
  }

  // Handle filter changes
  const handleFiltersChange = (newFilters: Partial<EisenhowerFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleClearFilters = () => {
    setFilters({ userId: userId || '' })
  }

  const handleSelectAll = () => {
    setSelectedTasks(new Set(filteredTasks.map(task => task.id)))
  }

  const handleClearSelection = () => {
    setSelectedTasks(new Set())
  }

  // Show loading while checking auth
  if (authLoading) {
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

  const completionPercentage = stats ? Math.round((stats.categorized / stats.total) * 100) || 0 : 0

  return (
    <Box style={{ position: 'relative' }}>
      <LoadingOverlay visible={isLoading} />
      
      <Container size="xl" px="md" py="xl">
        <Stack gap="xl">
          {/* Header */}
          <Box>
            <Group mb="md">
              <Button
                variant="subtle"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => router.back()}
              >
                Back
              </Button>
            </Group>
            
            <Title order={1} size="h1" fw={800} mb="xs">
              Eisenhower Matrix
            </Title>
            <Text size="lg" c="dimmed" mb="md">
              Categorize your tasks by urgency and importance to prioritize effectively
            </Text>

            {/* Progress Indicator */}
            {stats && stats.total > 0 && (
              <Box>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500}>Categorization Progress</Text>
                  <Text size="sm" c="dimmed">
                    {stats.categorized} of {stats.total} tasks categorized
                  </Text>
                </Group>
                <Progress 
                  value={completionPercentage} 
                  color={completionPercentage === 100 ? 'green' : 'blue'}
                  size="lg"
                  radius="xl"
                />
                <Text size="xs" c="dimmed" mt="xs">
                  {completionPercentage}% complete
                </Text>
              </Box>
            )}
          </Box>

          {/* Instructions */}
          <Alert 
            icon={<IconInfoCircle size={16} />} 
            title="How to use the Eisenhower Matrix"
            variant="light"
          >
            <Text size="sm">
              • <strong>Drag and drop</strong> tasks between quadrants to categorize them
              • <strong>Ctrl/Cmd + Click</strong> to select multiple tasks for bulk actions
              • Use filters to focus on specific time periods or categories
              • Tasks are automatically saved when moved
            </Text>
          </Alert>

          {/* Error Display */}
          {error && (
            <Alert color="red" title="Error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* No Tasks State */}
          {!isLoading && tasks.length === 0 && (
            <Alert 
              icon={<IconBulb size={16} />}
              title="No tasks found"
              variant="light"
              color="blue"
            >
              <Text size="sm">
                Complete some time tracking sessions first, then return here to categorize your tasks using the Eisenhower Matrix.
              </Text>
              <Button 
                variant="light" 
                size="sm" 
                mt="sm"
                onClick={() => router.push('/')}
              >
                Start Tracking Tasks
              </Button>
            </Alert>
          )}

          {/* Main Interface */}
          {tasks.length > 0 && (
            <>
              {/* Filter Controls */}
              <FilterControls
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                stats={stats || undefined}
                isLoading={isLoading}
              />

              {/* Bulk Actions */}
              <BulkActions
                selectedTasks={selectedTasks}
                tasks={filteredTasks}
                onBulkMove={handleBulkMove}
                onClearSelection={handleClearSelection}
                onSelectAll={handleSelectAll}
                isLoading={isLoading}
              />

              {/* Matrix Grid */}
              <MatrixGrid
                tasks={filteredTasks}
                selectedTasks={selectedTasks}
                onTaskSelect={handleTaskSelect}
                onTaskMove={handleTaskMove}
                onBulkMove={handleBulkMove}
                hoveredTask={hoveredTask}
                onTaskHover={setHoveredTask}
              />

              {/* Task Details Hover */}
              {hoveredTask && (
                <Box
                  style={{
                    position: 'fixed',
                    bottom: 20,
                    right: 20,
                    maxWidth: 300,
                    zIndex: 1000,
                    backgroundColor: 'var(--mantine-color-dark-7)',
                    color: 'white',
                    padding: 'var(--mantine-spacing-sm)',
                    borderRadius: 'var(--mantine-radius-md)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                  }}
                >
                  <Text size="sm" fw={600}>{hoveredTask.taskName}</Text>
                  {hoveredTask.description && (
                    <Text size="xs" c="dimmed" mt="xs">{hoveredTask.description}</Text>
                  )}
                  <Group gap="xs" mt="xs">
                    <Badge size="xs" color="blue">{hoveredTask.durationMinutes}m</Badge>
                    <Badge size="xs" color="green">Energy: {hoveredTask.energyLevel}/5</Badge>
                  </Group>
                </Box>
              )}
            </>
          )}
        </Stack>
      </Container>
    </Box>
  )
}