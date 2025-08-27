'use client'

import { useState, useEffect } from 'react'
import { 
  Card, 
  Text, 
  Group, 
  Stack, 
  Badge,
  ScrollArea,
  ActionIcon,
  Menu,
  Progress,
  Divider,
  Button,
  Center,
  LoadingOverlay,
  Pagination,
  Select,
  TextInput
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { 
  IconCalendar, 
  IconTrendingUp, 
  IconClock,
  IconDotsVertical,
  IconEye,
  IconTrash,
  IconSearch,
  IconFilter,
  IconHistory,
  IconCircleCheck,
  IconPlayerPause,
  IconPlayerPlay
} from '@tabler/icons-react'
import { useSession } from '@/contexts/session-context'
import { useUser } from '@/lib/user-context'
import { SessionWithProgress, getSessionTypeLabel } from '@/types/session'

interface SessionHistoryProps {
  className?: string
  showAll?: boolean
  limit?: number
}

export function SessionHistory({ className, showAll = false, limit = 10 }: SessionHistoryProps) {
  const { sessions, getUserSessions, isLoading } = useSession()
  const { userId } = useUser()
  
  const [filteredSessions, setFilteredSessions] = useState<SessionWithProgress[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300)

  const itemsPerPage = showAll ? limit : 5

  useEffect(() => {
    if (userId) {
      loadSessions()
    }
  }, [userId, statusFilter, currentPage])

  useEffect(() => {
    filterSessions()
  }, [sessions, debouncedSearch, statusFilter])

  const loadSessions = async () => {
    if (!userId) return

    try {
      await getUserSessions(userId, {
        status: statusFilter || undefined,
        limit: showAll ? limit : undefined,
        offset: showAll ? (currentPage - 1) * itemsPerPage : undefined
      })
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  const filterSessions = () => {
    let filtered = [...sessions]

    // Apply search filter
    if (debouncedSearch) {
      filtered = filtered.filter(session => 
        getSessionTypeLabel(session.type).toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        session.status.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    }

    // Apply status filter if not already applied in API call
    if (statusFilter && !showAll) {
      filtered = filtered.filter(session => session.status === statusFilter)
    }

    setFilteredSessions(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'completed': return 'blue'
      case 'paused': return 'yellow'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <IconPlayerPlay size={14} />
      case 'completed': return <IconCircleCheck size={14} />
      case 'paused': return <IconPlayerPause size={14} />
      default: return <IconClock size={14} />
    }
  }

  const formatDateRange = (startDate: string, endDate: string, actualEndDate?: string) => {
    const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const end = new Date(actualEndDate || endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${start} - ${end}`
  }

  if (!userId) {
    return (
      <Card withBorder p="lg" radius="md" className={className}>
        <Center py="xl">
          <Text c="dimmed">Please log in to view session history</Text>
        </Center>
      </Card>
    )
  }

  return (
    <Card withBorder p="lg" radius="md" className={className}>
      <LoadingOverlay visible={isLoading} />
      
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Stack gap={2}>
            <Text fw={600} size="lg">
              Session History
            </Text>
            <Text size="sm" c="dimmed">
              {filteredSessions.length} {filteredSessions.length === 1 ? 'session' : 'sessions'}
            </Text>
          </Stack>
          
          <Group gap="xs">
            {showAll && (
              <>
                <TextInput
                  placeholder="Search sessions..."
                  leftSection={<IconSearch size={16} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="sm"
                  w={200}
                />
                
                <Select
                  placeholder="Filter by status"
                  leftSection={<IconFilter size={16} />}
                  data={[
                    { value: '', label: 'All Statuses' },
                    { value: 'active', label: 'Active' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'paused', label: 'Paused' }
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  size="sm"
                  w={150}
                  clearable
                />
              </>
            )}
          </Group>
        </Group>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <Card withBorder p="xl" radius="md">
            <Center>
              <Stack align="center" gap="md">
                <IconHistory size={48} color="var(--mantine-color-gray-5)" />
                <Stack align="center" gap="xs">
                  <Text fw={500} c="dimmed">
                    No sessions found
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    {searchQuery || statusFilter 
                      ? 'Try adjusting your search or filters' 
                      : 'Start your first tracking session to see it here'
                    }
                  </Text>
                </Stack>
              </Stack>
            </Center>
          </Card>
        ) : (
          <ScrollArea.Autosize mah={showAll ? 600 : 400}>
            <Stack gap="sm">
              {filteredSessions.map((session) => (
                <Card key={session.id} withBorder p="md" radius="md">
                  <Group justify="space-between" align="flex-start">
                    <Stack gap="xs" flex={1}>
                      {/* Session Title & Status */}
                      <Group gap="sm" align="center">
                        {getStatusIcon(session.status)}
                        <Text fw={500}>
                          {getSessionTypeLabel(session.type)}
                        </Text>
                        <Badge 
                          color={getStatusColor(session.status)} 
                          variant="light"
                          size="sm"
                        >
                          {session.status}
                        </Badge>
                      </Group>

                      {/* Date Range */}
                      <Group gap="sm" align="center">
                        <IconCalendar size={14} color="var(--mantine-color-gray-6)" />
                        <Text size="sm" c="dimmed">
                          {formatDateRange(
                            session.start_date, 
                            session.planned_end_date, 
                            session.actual_end_date
                          )}
                        </Text>
                      </Group>

                      {/* Progress Bar */}
                      {session.progress && (
                        <Stack gap={4}>
                          <Progress
                            value={session.progress.progress_percentage}
                            color={getStatusColor(session.status)}
                            size="sm"
                            radius="md"
                          />
                          <Group justify="space-between">
                            <Text size="xs" c="dimmed">
                              {session.progress.working_days} of {session.progress.days_total} days
                            </Text>
                            <Text size="xs" fw={500} c={getStatusColor(session.status)}>
                              {Math.round(session.progress.progress_percentage)}% complete
                            </Text>
                          </Group>
                        </Stack>
                      )}

                      {/* Stats */}
                      <Group gap="lg" mt="xs">
                        {session.progress && (
                          <>
                            <Group gap={4}>
                              <IconTrendingUp size={12} color="var(--mantine-color-green-6)" />
                              <Text size="xs" c="dimmed">
                                {session.progress.working_days} working
                              </Text>
                            </Group>

                            {session.progress.leave_days > 0 && (
                              <Group gap={4}>
                                <IconClock size={12} color="var(--mantine-color-yellow-6)" />
                                <Text size="xs" c="dimmed">
                                  {session.progress.leave_days} leave
                                </Text>
                              </Group>
                            )}
                          </>
                        )}

                        {(session.interruption_count ?? 0) > 0 && (
                          <Group gap={4}>
                            <Text size="xs" c="dimmed">
                              {session.interruption_count} interruptions
                            </Text>
                          </Group>
                        )}
                      </Group>
                    </Stack>

                    {/* Actions Menu */}
                    <Menu shadow="md" width={160}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" size="sm">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item leftSection={<IconEye size={14} />}>
                          View Details
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item 
                          leftSection={<IconTrash size={14} />}
                          color="red"
                        >
                          Delete Session
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Card>
              ))}
            </Stack>
          </ScrollArea.Autosize>
        )}

        {/* Pagination for showAll mode */}
        {showAll && filteredSessions.length > itemsPerPage && (
          <>
            <Divider />
            <Center>
              <Pagination
                total={Math.ceil(filteredSessions.length / itemsPerPage)}
                value={currentPage}
                onChange={setCurrentPage}
                size="sm"
              />
            </Center>
          </>
        )}

        {/* View All Button for compact mode */}
        {!showAll && sessions.length > itemsPerPage && (
          <>
            <Divider />
            <Center>
              <Button variant="light" size="sm">
                View All Sessions ({sessions.length})
              </Button>
            </Center>
          </>
        )}
      </Stack>
    </Card>
  )
}