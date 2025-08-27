'use client'

import { useState, useEffect } from 'react'
import { useEntriesStore } from '@/store/entries-store'
import { useUser } from '@/lib/user-context'
import { Clock, Battery, Zap } from 'lucide-react'
import { 
  Modal, 
  TextInput, 
  Textarea, 
  Button, 
  Stack, 
  Grid, 
  Group, 
  Text, 
  SegmentedControl,
  Slider,
  Paper,
  Box,
  Select,
  Switch,
  ActionIcon,
  Divider,
  Badge,
  Title
} from '@mantine/core'
import { TimeInput } from '@mantine/dates'
import { IconThumbUp, IconThumbDown, IconMoodNeutral, IconBattery, IconBolt } from '@tabler/icons-react'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TaskModal({ isOpen, onClose }: TaskModalProps) {
  const [taskName, setTaskName] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  
  // V2 Fields
  const [energyLevel, setEnergyLevel] = useState(3)
  const [taskMode, setTaskMode] = useState<'proactive' | 'reactive'>('reactive')
  const [enjoyment, setEnjoyment] = useState<'like' | 'neutral' | 'dislike'>('neutral')
  const [taskType, setTaskType] = useState<'personal' | 'work' | 'both'>('work')
  const [frequency, setFrequency] = useState<'daily' | 'regular' | 'infrequent'>('regular')
  
  // Recording metadata
  const [recordedAt] = useState(new Date().toISOString())
  const [recordingStartTime] = useState(Date.now())
  
  const { addEntry, isLoading } = useEntriesStore()
  const { userId } = useUser()

  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60000)
      const hour = now.getHours()
      
      setStartTime(formatTimeForInput(thirtyMinutesAgo))
      setEndTime(formatTimeForInput(now))
      
      // Smart defaults based on time of day
      if (hour >= 6 && hour < 9) {
        // Morning: Fresh energy, personal tasks
        setEnergyLevel(4)
        setTaskType('personal')
        setTaskMode('proactive')
      } else if (hour >= 9 && hour < 12) {
        // Late morning: Peak energy, work tasks
        setEnergyLevel(5)
        setTaskType('work')
        setTaskMode('proactive')
      } else if (hour >= 12 && hour < 14) {
        // Lunch: Moderate energy, mixed tasks
        setEnergyLevel(3)
        setTaskType('both')
        setTaskMode('reactive')
      } else if (hour >= 14 && hour < 17) {
        // Afternoon: Good energy, work tasks
        setEnergyLevel(4)
        setTaskType('work')
        setTaskMode('proactive')
      } else if (hour >= 17 && hour < 20) {
        // Evening: Declining energy, mixed tasks
        setEnergyLevel(3)
        setTaskType('both')
        setTaskMode('reactive')
      } else {
        // Night: Low energy, personal tasks
        setEnergyLevel(2)
        setTaskType('personal')
        setTaskMode('reactive')
      }
    }
  }, [isOpen])

  const formatTimeForInput = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const calculateDuration = () => {
    if (!startTime || !endTime) return 15
    
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    
    const startTotalMinutes = startHours * 60 + startMinutes
    const endTotalMinutes = endHours * 60 + endMinutes
    
    const duration = endTotalMinutes - startTotalMinutes
    return duration > 0 ? duration : 15
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskName.trim()) return
    
    // Validate required fields
    if (energyLevel < 1 || energyLevel > 5) return

    const duration = calculateDuration()
    const recordingDelayMinutes = Math.floor((Date.now() - recordingStartTime) / (1000 * 60))

    await addEntry({
      task_name: taskName.trim(),
      description: description.trim() || undefined,
      category: 'personal', // Default category - will be categorized later
      confidence_score: 0, // No AI confidence for manual entries
      duration_minutes: duration,
      // V2 fields
      energy_level: energyLevel,
      task_mode: taskMode,
      enjoyment: enjoyment,
      task_type: taskType,
      frequency: frequency,
      recorded_at: recordedAt,
      recording_delay_minutes: recordingDelayMinutes,
      urgency: 'not_urgent', // Default for manual entry
      importance: 'important' // Default for manual entry
    }, userId)

    // Reset form
    setTaskName('')
    setDescription('')
    setEnergyLevel(3)
    setTaskMode('reactive')
    setEnjoyment('neutral')
    setTaskType('work')
    setFrequency('regular')
    onClose()
  }

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={<Text size="xl" fw={700}>Log Task</Text>}
      size="xl"
      radius="xl"
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      scrollAreaComponent={Paper}
      styles={{
        body: {
          maxHeight: '80vh',
          overflowY: 'auto'
        }
      }}
    >
      <Text c="dimmed" mb="lg">What are you working on?</Text>

      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <TextInput
            label="Task Name"
            placeholder="e.g., Email Campaign Review"
            value={taskName}
            onChange={(e) => setTaskName(e.currentTarget.value)}
            required
            radius="xl"
            size="md"
            styles={{
              label: { fontWeight: 600, marginBottom: 8 }
            }}
          />

          <Textarea
            label="Description (Optional)"
            placeholder="Add more details..."
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            radius="xl"
            minRows={3}
            styles={{
              label: { fontWeight: 600, marginBottom: 8 }
            }}
          />

          <Grid>
            <Grid.Col span={6}>
              <TimeInput
                label={
                  <Group gap={4}>
                    <Clock size={16} />
                    <Text>Start Time</Text>
                  </Group>
                }
                value={startTime}
                onChange={(e) => setStartTime(e.currentTarget.value)}
                radius="xl"
                styles={{
                  label: { fontWeight: 600, marginBottom: 8 }
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TimeInput
                label={
                  <Group gap={4}>
                    <Clock size={16} />
                    <Text>End Time</Text>
                  </Group>
                }
                value={endTime}
                onChange={(e) => setEndTime(e.currentTarget.value)}
                radius="xl"
                styles={{
                  label: { fontWeight: 600, marginBottom: 8 }
                }}
              />
            </Grid.Col>
          </Grid>
          
          <Paper p="md" radius="xl" bg="gray.0">
            <Text size="sm" c="dimmed" ta="center">
              Duration: <Text component="span" fw={600} c="dark">{calculateDuration()} minutes</Text>
            </Text>
          </Paper>

          <Divider label={
            <Group gap="xs">
              <IconBolt size={16} />
              <Text size="sm" fw={600}>Task Details</Text>
            </Group>
          } labelPosition="center" />

          {/* Energy Level */}
          <Box>
            <Group justify="space-between" mb="sm">
              <Group gap="xs">
                <IconBattery size={16} />
                <Text size="sm" fw={600}>Energy Level</Text>
              </Group>
              <Badge 
                variant="light" 
                color={energyLevel <= 2 ? 'red' : energyLevel >= 4 ? 'green' : 'yellow'}
              >
                {energyLevel === 1 ? 'Drained' : 
                 energyLevel === 2 ? 'Low' :
                 energyLevel === 3 ? 'Moderate' :
                 energyLevel === 4 ? 'High' : 'Energized'}
              </Badge>
            </Group>
            <Slider
              value={energyLevel}
              onChange={setEnergyLevel}
              min={1}
              max={5}
              step={1}
              marks={[
                { value: 1, label: '😴' },
                { value: 2, label: '😐' },
                { value: 3, label: '🙂' },
                { value: 4, label: '😊' },
                { value: 5, label: '⚡' },
              ]}
              color={energyLevel <= 2 ? 'red' : energyLevel >= 4 ? 'green' : 'yellow'}
            />
          </Box>

          <Grid>
            <Grid.Col span={6}>
              {/* Task Mode */}
              <Box>
                <Text size="sm" fw={600} mb="sm">Task Mode</Text>
                <SegmentedControl
                  value={taskMode}
                  onChange={(value) => setTaskMode(value as 'proactive' | 'reactive')}
                  data={[
                    { label: 'Proactive', value: 'proactive' },
                    { label: 'Reactive', value: 'reactive' }
                  ]}
                  fullWidth
                  color={taskMode === 'proactive' ? 'blue' : 'orange'}
                />
              </Box>
            </Grid.Col>
            
            <Grid.Col span={6}>
              {/* Enjoyment */}
              <Box>
                <Text size="sm" fw={600} mb="sm">Enjoyment</Text>
                <Group justify="center" gap="xs">
                  <ActionIcon
                    variant={enjoyment === 'like' ? 'filled' : 'light'}
                    color="green"
                    size="lg"
                    onClick={() => setEnjoyment('like')}
                  >
                    <IconThumbUp size={18} />
                  </ActionIcon>
                  <ActionIcon
                    variant={enjoyment === 'neutral' ? 'filled' : 'light'}
                    color="gray"
                    size="lg"
                    onClick={() => setEnjoyment('neutral')}
                  >
                    <IconMoodNeutral size={18} />
                  </ActionIcon>
                  <ActionIcon
                    variant={enjoyment === 'dislike' ? 'filled' : 'light'}
                    color="red"
                    size="lg"
                    onClick={() => setEnjoyment('dislike')}
                  >
                    <IconThumbDown size={18} />
                  </ActionIcon>
                </Group>
              </Box>
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={6}>
              {/* Task Type */}
              <Select
                label="Task Type"
                value={taskType}
                onChange={(value) => setTaskType(value as 'personal' | 'work' | 'both')}
                data={[
                  { value: 'personal', label: '🏠 Personal' },
                  { value: 'work', label: '💼 Work' },
                  { value: 'both', label: '🔄 Both' }
                ]}
                radius="xl"
                styles={{
                  label: { fontWeight: 600, marginBottom: 8 }
                }}
              />
            </Grid.Col>
            
            <Grid.Col span={6}>
              {/* Frequency */}
              <Box>
                <Text size="sm" fw={600} mb="sm">Frequency</Text>
                <SegmentedControl
                  value={frequency}
                  onChange={(value) => setFrequency(value as 'daily' | 'regular' | 'infrequent')}
                  data={[
                    { label: 'Daily', value: 'daily' },
                    { label: 'Regular', value: 'regular' },
                    { label: 'Rare', value: 'infrequent' }
                  ]}
                  fullWidth
                  size="sm"
                />
              </Box>
            </Grid.Col>
          </Grid>


          {/* Recording Metadata */}
          <Paper p="sm" radius="lg" bg="gray.0">
            <Group justify="space-between" gap="xs">
              <Text size="xs" c="dimmed">
                Recorded: {new Date(recordedAt).toLocaleTimeString()}
              </Text>
              <Text size="xs" c="dimmed">
                Delay: {Math.floor((Date.now() - recordingStartTime) / (1000 * 60))}min
              </Text>
            </Group>
          </Paper>

          <Stack gap="sm">
            <Button
              type="submit"
              size="lg"
              radius="xl"
              fullWidth
              loading={isLoading}
              disabled={!taskName.trim() || energyLevel < 1 || energyLevel > 5}
            >
              Save Task
            </Button>
            <Button
              variant="light"
              size="lg"
              radius="xl"
              fullWidth
              onClick={onClose}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </form>
    </Modal>
  )
}