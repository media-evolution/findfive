'use client'

import { useState, useCallback } from 'react'
import { Box, Grid, Text, Badge, Stack, Group, Paper, Center, Transition } from '@mantine/core'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { IconArrowUp, IconArrowDown, IconArrowRight, IconArrowLeft } from '@tabler/icons-react'
import { TaskCard } from './task-card'
import { EisenhowerTask, EisenhowerQuadrant, EisenhowerService } from '@/lib/eisenhower-service'

interface MatrixGridProps {
  tasks: EisenhowerTask[]
  selectedTasks: Set<string>
  onTaskSelect: (taskId: string, selected: boolean) => void
  onTaskMove: (taskId: string, quadrant: EisenhowerQuadrant) => void
  onBulkMove: (taskIds: string[], quadrant: EisenhowerQuadrant) => void
  hoveredTask?: EisenhowerTask | null
  onTaskHover: (task: EisenhowerTask | null) => void
}

export function MatrixGrid({
  tasks,
  selectedTasks,
  onTaskSelect,
  onTaskMove,
  onBulkMove,
  hoveredTask,
  onTaskHover
}: MatrixGridProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null)

  // Group tasks by quadrant
  const tasksByQuadrant = tasks.reduce((acc, task) => {
    const quadrant = task.quadrant || 'not-urgent-not-important'
    if (!acc[quadrant]) {
      acc[quadrant] = []
    }
    acc[quadrant].push(task)
    return acc
  }, {} as Record<EisenhowerQuadrant, EisenhowerTask[]>)

  // Ensure all quadrants exist
  const quadrants: EisenhowerQuadrant[] = [
    'urgent-important',
    'urgent-not-important', 
    'not-urgent-important',
    'not-urgent-not-important'
  ]

  quadrants.forEach(quadrant => {
    if (!tasksByQuadrant[quadrant]) {
      tasksByQuadrant[quadrant] = []
    }
  })

  const handleDragStart = useCallback((start: any) => {
    setDraggedTask(start.draggableId)
    onTaskHover(null)
  }, [onTaskHover])

  const handleDragEnd = useCallback((result: DropResult) => {
    setDraggedTask(null)

    if (!result.destination) return

    const taskId = result.draggableId
    const newQuadrant = result.destination.droppableId as EisenhowerQuadrant

    // If moving selected tasks and the dragged task is selected
    if (selectedTasks.has(taskId) && selectedTasks.size > 1) {
      onBulkMove(Array.from(selectedTasks), newQuadrant)
    } else {
      onTaskMove(taskId, newQuadrant)
    }
  }, [selectedTasks, onTaskMove, onBulkMove])

  const QuadrantDropZone = ({ quadrant, children }: { 
    quadrant: EisenhowerQuadrant
    children: React.ReactNode 
  }) => {
    const info = EisenhowerService.getQuadrantInfo(quadrant)
    const tasksCount = tasksByQuadrant[quadrant]?.length || 0

    return (
      <Droppable droppableId={quadrant}>
        {(provided, snapshot) => (
          <Paper
            ref={provided.innerRef}
            {...provided.droppableProps}
            radius="lg"
            p="md"
            style={{
              minHeight: 400,
              backgroundColor: snapshot.isDraggingOver 
                ? `var(--mantine-color-${info.color}-0)` 
                : 'var(--mantine-color-gray-0)',
              borderColor: snapshot.isDraggingOver 
                ? `var(--mantine-color-${info.color}-3)` 
                : 'var(--mantine-color-gray-3)',
              border: `2px solid`,
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            {/* Quadrant Header */}
            <Stack gap="xs" mb="md">
              <Group justify="space-between" align="center">
                <Text size="lg" fw={700} c={`${info.color}.7`}>
                  {info.title}
                </Text>
                <Badge 
                  color={info.color} 
                  variant="filled"
                  size="sm"
                >
                  {tasksCount}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed" fw={600}>
                {info.subtitle}
              </Text>
              <Text size="xs" c="dimmed">
                {info.description}
              </Text>
            </Stack>

            {/* Tasks */}
            <Stack gap="sm">
              {children}
              {provided.placeholder}
            </Stack>

            {/* Empty state */}
            {tasksCount === 0 && !snapshot.isDraggingOver && (
              <Center style={{ minHeight: 200 }}>
                <Stack align="center" gap="xs">
                  <Text size="sm" c="dimmed">
                    No tasks in this quadrant
                  </Text>
                  <Text size="xs" c="dimmed">
                    Drag tasks here to categorize
                  </Text>
                </Stack>
              </Center>
            )}

            {/* Drop indicator */}
            <Transition mounted={snapshot.isDraggingOver} transition="fade">
              {(styles) => (
                <Box
                  style={{
                    ...styles,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: `var(--mantine-color-${info.color}-1)`,
                    border: `2px dashed var(--mantine-color-${info.color}-4)`,
                    borderRadius: 'var(--mantine-radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <Text size="lg" fw={600} c={`${info.color}.6`}>
                    Drop to {info.actionType}
                  </Text>
                </Box>
              )}
            </Transition>
          </Paper>
        )}
      </Droppable>
    )
  }

  return (
    <Box>
      {/* Matrix Labels */}
      <Grid mb="md">
        <Grid.Col span={6}>
          <Center>
            <Group gap="xs">
              <IconArrowUp size={16} color="var(--mantine-color-red-6)" />
              <Text fw={600} c="red.6">URGENT</Text>
            </Group>
          </Center>
        </Grid.Col>
        <Grid.Col span={6}>
          <Center>
            <Group gap="xs">
              <IconArrowDown size={16} color="var(--mantine-color-blue-6)" />
              <Text fw={600} c="blue.6">NOT URGENT</Text>
            </Group>
          </Center>
        </Grid.Col>
      </Grid>

      {/* Matrix Grid */}
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Grid>
          {/* Row 1: Important */}
          <Grid.Col span={1}>
            <Box style={{ height: 400, display: 'flex', alignItems: 'center' }}>
              <Box style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>
                <Group gap="xs">
                  <IconArrowLeft size={16} color="var(--mantine-color-green-6)" />
                  <Text fw={600} c="green.6">IMPORTANT</Text>
                </Group>
              </Box>
            </Box>
          </Grid.Col>
          <Grid.Col span={5}>
            <QuadrantDropZone quadrant="urgent-important">
              {tasksByQuadrant['urgent-important'].map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <TaskCard
                        task={task}
                        isDragging={snapshot.isDragging}
                        isSelected={selectedTasks.has(task.id)}
                        onSelect={onTaskSelect}
                        onHover={onTaskHover}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
            </QuadrantDropZone>
          </Grid.Col>
          <Grid.Col span={5}>
            <QuadrantDropZone quadrant="not-urgent-important">
              {tasksByQuadrant['not-urgent-important'].map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <TaskCard
                        task={task}
                        isDragging={snapshot.isDragging}
                        isSelected={selectedTasks.has(task.id)}
                        onSelect={onTaskSelect}
                        onHover={onTaskHover}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
            </QuadrantDropZone>
          </Grid.Col>

          {/* Row 2: Not Important */}
          <Grid.Col span={1}>
            <Box style={{ height: 400, display: 'flex', alignItems: 'center' }}>
              <Box style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>
                <Group gap="xs">
                  <IconArrowRight size={16} color="var(--mantine-color-orange-6)" />
                  <Text fw={600} c="orange.6">NOT IMPORTANT</Text>
                </Group>
              </Box>
            </Box>
          </Grid.Col>
          <Grid.Col span={5}>
            <QuadrantDropZone quadrant="urgent-not-important">
              {tasksByQuadrant['urgent-not-important'].map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <TaskCard
                        task={task}
                        isDragging={snapshot.isDragging}
                        isSelected={selectedTasks.has(task.id)}
                        onSelect={onTaskSelect}
                        onHover={onTaskHover}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
            </QuadrantDropZone>
          </Grid.Col>
          <Grid.Col span={5}>
            <QuadrantDropZone quadrant="not-urgent-not-important">
              {tasksByQuadrant['not-urgent-not-important'].map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <TaskCard
                        task={task}
                        isDragging={snapshot.isDragging}
                        isSelected={selectedTasks.has(task.id)}
                        onSelect={onTaskSelect}
                        onHover={onTaskHover}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
            </QuadrantDropZone>
          </Grid.Col>
        </Grid>
      </DragDropContext>
    </Box>
  )
}