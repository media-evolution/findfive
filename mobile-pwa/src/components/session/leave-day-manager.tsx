'use client'

import { useState, useEffect } from 'react'
import { 
  Card, 
  Text, 
  Group, 
  Stack, 
  Button,
  ActionIcon,
  Alert,
  Badge,
  Textarea,
  LoadingOverlay,
  ScrollArea,
  Box,
  Divider,
  Center,
} from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { 
  IconCalendarOff, 
  IconPlus, 
  IconTrash, 
  IconCalendar, 
  IconAlertTriangle,
  IconBeach
} from '@tabler/icons-react'
import { useSession } from '@/contexts/session-context'
import { LeaveRecord } from '@/types/session'

interface LeaveDayManagerProps {
  className?: string
}

export function LeaveDayManager({ className }: LeaveDayManagerProps) {
  const { 
    currentSession, 
    addLeaveDay, 
    removeLeaveDay,
    isLoading 
  } = useSession()
  
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [addFormVisible, { toggle: toggleAddForm }] = useDisclosure(false)

  // Load leave records when current session changes
  useEffect(() => {
    if (currentSession) {
      loadLeaveRecords()
    }
  }, [currentSession])

  const loadLeaveRecords = async () => {
    if (!currentSession) return

    setLoadingRecords(true)
    try {
      // Note: This would normally fetch from the store or API
      // For now, we'll use empty array as placeholder
      setLeaveRecords([]) // Placeholder - would come from store/API
    } catch (error) {
      console.error('Failed to load leave records:', error)
    } finally {
      setLoadingRecords(false)
    }
  }

  const handleAddLeaveDay = async () => {
    if (!selectedDate || !currentSession) return

    const dateStr = selectedDate
    
    try {
      await addLeaveDay(currentSession.id, dateStr, reason.trim() || undefined)
      
      notifications.show({
        title: 'Leave Day Added',
        message: `${new Date(selectedDate).toLocaleDateString()} marked as leave day`,
        color: 'green'
      })

      // Reset form
      setSelectedDate(null)
      setReason('')
      toggleAddForm()
      
      // Reload records
      loadLeaveRecords()
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to add leave day. Please try again.',
        color: 'red'
      })
    }
  }

  const handleRemoveLeaveDay = async (leaveRecord: LeaveRecord) => {
    try {
      await removeLeaveDay(leaveRecord.id)
      
      notifications.show({
        title: 'Leave Day Removed',
        message: `${new Date(leaveRecord.leave_date).toLocaleDateString()} removed from leave days`,
        color: 'blue'
      })

      // Reload records
      loadLeaveRecords()
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to remove leave day. Please try again.',
        color: 'red'
      })
    }
  }

  const getMinDate = () => {
    if (!currentSession) return new Date()
    return new Date(currentSession.start_date)
  }

  const getMaxDate = () => {
    if (!currentSession) return new Date()
    const endDate = currentSession.actual_end_date || currentSession.planned_end_date
    return new Date(endDate)
  }

  const isDateAlreadyLeave = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return leaveRecords.some(record => record.leave_date === dateStr)
  }

  if (!currentSession) {
    return (
      <Card withBorder p="lg" radius="md" className={className}>
        <Center py="xl">
          <Stack align="center" gap="md">
            <IconCalendarOff size={48} color="var(--mantine-color-gray-5)" />
            <Stack align="center" gap="xs">
              <Text fw={500} c="dimmed">
                No Active Session
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                Start a session to manage leave days
              </Text>
            </Stack>
          </Stack>
        </Center>
      </Card>
    )
  }

  return (
    <Card withBorder p="lg" radius="md" className={className}>
      <LoadingOverlay visible={loadingRecords || isLoading} />
      
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Stack gap={2}>
            <Text fw={600} size="lg">
              Leave Day Manager
            </Text>
            <Text size="sm" c="dimmed">
              Mark days you won't be tracking
            </Text>
          </Stack>
          
          <Badge color="blue" variant="light">
            {leaveRecords.length} leave days
          </Badge>
        </Group>

        {/* Info Alert */}
        <Alert color="blue" variant="light" icon={<IconCalendar size={16} />}>
          Leave days don't count against your session progress. Use them for weekends, 
          vacations, or planned breaks from tracking.
        </Alert>

        {/* Add Leave Day Form */}
        <Card withBorder p="md" radius="md" bg="gray.0">
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Text fw={500}>Add Leave Day</Text>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconPlus size={14} />}
                onClick={toggleAddForm}
              >
                {addFormVisible ? 'Cancel' : 'Add Leave Day'}
              </Button>
            </Group>

            {addFormVisible && (
              <Stack gap="sm">
                <DatePicker
                  value={selectedDate}
                  onChange={(value) => setSelectedDate(value)}
                  minDate={getMinDate()}
                  maxDate={getMaxDate()}
                  excludeDate={(date) => {
                    if (!date) return false
                    return leaveRecords.some(record => record.leave_date === date)
                  }}
                />
                
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (optional)"
                  rows={2}
                  maxLength={200}
                />

                <Group justify="end" gap="sm">
                  <Button 
                    variant="light" 
                    size="sm"
                    onClick={toggleAddForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddLeaveDay}
                    disabled={!selectedDate}
                    loading={isLoading}
                  >
                    Add Leave Day
                  </Button>
                </Group>
              </Stack>
            )}
          </Stack>
        </Card>

        {/* Leave Days List */}
        <Stack gap="sm">
          <Text fw={500} size="sm">
            Current Leave Days
          </Text>

          {leaveRecords.length === 0 ? (
            <Card withBorder p="md" radius="md">
              <Center py="md">
                <Stack align="center" gap="sm">
                  <IconBeach size={32} color="var(--mantine-color-gray-5)" />
                  <Text c="dimmed" ta="center">
                    No leave days scheduled
                  </Text>
                </Stack>
              </Center>
            </Card>
          ) : (
            <ScrollArea.Autosize mah={300}>
              <Stack gap="xs">
                {leaveRecords
                  .sort((a, b) => new Date(a.leave_date).getTime() - new Date(b.leave_date).getTime())
                  .map((record) => (
                    <Card key={record.id} withBorder p="md" radius="md">
                      <Group justify="space-between" align="flex-start">
                        <Stack gap={4} flex={1}>
                          <Group gap="sm" align="center">
                            <IconCalendarOff size={16} color="var(--mantine-color-blue-6)" />
                            <Text fw={500}>
                              {new Date(record.leave_date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </Text>
                          </Group>
                          {record.reason && (
                            <Text size="sm" c="dimmed" ml={24}>
                              {record.reason}
                            </Text>
                          )}
                        </Stack>

                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => handleRemoveLeaveDay(record)}
                          size="sm"
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Card>
                  ))}
              </Stack>
            </ScrollArea.Autosize>
          )}
        </Stack>

        {/* Summary */}
        {currentSession.progress && (
          <>
            <Divider />
            <Group justify="center" gap="xl">
              <Stack align="center" gap={2}>
                <Text size="sm" fw={500} c="blue">
                  {currentSession.progress.leave_days}
                </Text>
                <Text size="xs" c="dimmed">
                  Leave Days
                </Text>
              </Stack>
              <Stack align="center" gap={2}>
                <Text size="sm" fw={500} c="green">
                  {currentSession.progress.working_days}
                </Text>
                <Text size="xs" c="dimmed">
                  Working Days
                </Text>
              </Stack>
              <Stack align="center" gap={2}>
                <Text size="sm" fw={500}>
                  {currentSession.progress.days_total}
                </Text>
                <Text size="xs" c="dimmed">
                  Total Days
                </Text>
              </Stack>
            </Group>
          </>
        )}
      </Stack>
    </Card>
  )
}