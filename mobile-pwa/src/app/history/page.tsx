'use client'

import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/bottom-nav-mantine'
import { useEntriesStore } from '@/store/entries-store'
import { useUser } from '@/lib/user-context'
import { ArrowLeft, Clock, Search, Filter, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { 
  Container, 
  Title, 
  Paper, 
  Group, 
  Text, 
  Stack, 
  Card, 
  Button,
  TextInput,
  Select,
  ActionIcon,
  Box,
  Badge,
  SimpleGrid,
  Tabs,
  ThemeIcon,
  Center,
  Loader
} from '@mantine/core'
import { TaskList } from '@/components/task-list-mantine'

export default function HistoryPage() {
  const { entries, isLoading } = useEntriesStore()
  const { userId } = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('all')

  // Filter entries based on search and filters
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.task_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (entry.description && entry.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = categoryFilter === 'all' || entry.category === categoryFilter
    
    const now = new Date()
    const entryDate = new Date(entry.created_at)
    
    let matchesTime = true
    switch (timeFilter) {
      case 'today':
        matchesTime = entryDate.toDateString() === now.toDateString()
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        matchesTime = entryDate >= weekAgo
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        matchesTime = entryDate >= monthAgo
        break
      default:
        matchesTime = true
    }
    
    return matchesSearch && matchesCategory && matchesTime
  })

  // Group entries by date
  const groupedEntries = filteredEntries.reduce((groups, entry) => {
    const date = new Date(entry.created_at).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(entry)
    return groups
  }, {} as Record<string, typeof entries>)

  const totalTime = filteredEntries.reduce((sum, entry) => sum + entry.duration_minutes, 0)
  const avgTime = filteredEntries.length > 0 ? Math.round(totalTime / filteredEntries.length) : 0

  return (
    <Box bg="gray.0" mih="100vh" pb={80}>
      {/* Header */}
      <Paper
        radius={0}
        p="md"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Group>
          <ActionIcon
            component={Link}
            href="/"
            variant="subtle"
            color="white"
            size="lg"
          >
            <ArrowLeft size={20} />
          </ActionIcon>
          <Group gap="xs">
            <Clock size={24} color="white" />
            <Title order={3} c="white">History</Title>
          </Group>
        </Group>
      </Paper>

      <Container size="sm" px="md" py="lg">
        <Stack gap="lg">
          {/* Search and Filters */}
          <Card radius="xl" withBorder>
            <Stack gap="md">
              <TextInput
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                leftSection={<Search size={16} />}
                radius="xl"
              />
              
              <Group grow>
                <Select
                  placeholder="Category"
                  value={categoryFilter}
                  onChange={(value) => setCategoryFilter(value || 'all')}
                  data={[
                    { value: 'all', label: 'All Categories' },
                    { value: 'delegate', label: 'Delegate' },
                    { value: 'automate', label: 'Automate' },
                    { value: 'eliminate', label: 'Eliminate' },
                    { value: 'personal', label: 'Personal' }
                  ]}
                  radius="xl"
                />
                
                <Select
                  placeholder="Time Range"
                  value={timeFilter}
                  onChange={(value) => setTimeFilter(value || 'all')}
                  data={[
                    { value: 'all', label: 'All Time' },
                    { value: 'today', label: 'Today' },
                    { value: 'week', label: 'This Week' },
                    { value: 'month', label: 'This Month' }
                  ]}
                  radius="xl"
                />
              </Group>
            </Stack>
          </Card>

          {/* Summary Stats */}
          <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
            <Card radius="xl" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">Total Tasks</Text>
                <ThemeIcon variant="light" radius="xl" size="sm">
                  <Calendar size={16} />
                </ThemeIcon>
              </Group>
              <Text size="xl" fw={700}>{filteredEntries.length}</Text>
            </Card>

            <Card radius="xl" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">Total Time</Text>
                <ThemeIcon variant="light" radius="xl" size="sm" color="blue">
                  <Clock size={16} />
                </ThemeIcon>
              </Group>
              <Text size="xl" fw={700}>
                {Math.floor(totalTime / 60)}h {totalTime % 60}m
              </Text>
            </Card>

            <Card radius="xl" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">Avg. Task</Text>
                <ThemeIcon variant="light" radius="xl" size="sm" color="orange">
                  <TrendingUp size={16} />
                </ThemeIcon>
              </Group>
              <Text size="xl" fw={700}>{avgTime}m</Text>
            </Card>
          </SimpleGrid>

          {/* Content Tabs */}
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'all')} radius="xl">
            <Tabs.List grow>
              <Tabs.Tab value="all">All Tasks</Tabs.Tab>
              <Tabs.Tab value="timeline">Timeline</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="all" pt="lg">
              {isLoading ? (
                <Center py="xl">
                  <Stack align="center">
                    <Loader size="md" />
                    <Text c="dimmed">Loading history...</Text>
                  </Stack>
                </Center>
              ) : filteredEntries.length === 0 ? (
                <Center py="xl">
                  <Stack align="center">
                    <Clock size={48} color="var(--mantine-color-gray-4)" />
                    <Text c="dimmed" ta="center">
                      {searchQuery || categoryFilter !== 'all' || timeFilter !== 'all' 
                        ? 'No tasks match your filters' 
                        : 'No tasks found'}
                    </Text>
                    {(searchQuery || categoryFilter !== 'all' || timeFilter !== 'all') && (
                      <Button 
                        variant="light" 
                        onClick={() => {
                          setSearchQuery('')
                          setCategoryFilter('all')
                          setTimeFilter('all')
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </Stack>
                </Center>
              ) : (
                <Stack gap="lg">
                  {Object.entries(groupedEntries)
                    .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                    .map(([date, dayEntries]) => (
                    <Box key={date}>
                      <Group justify="space-between" mb="sm">
                        <Text fw={600} c="dimmed">
                          {new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </Text>
                        <Badge variant="light" size="sm">
                          {dayEntries.length} task{dayEntries.length !== 1 ? 's' : ''}
                        </Badge>
                      </Group>
                      
                      <Stack gap="sm">
                        {dayEntries.map((entry) => (
                          <Card key={entry.id} radius="lg" withBorder p="md">
                            <Group justify="space-between" align="flex-start">
                              <Box style={{ flex: 1 }}>
                                <Text fw={500} mb="xs">{entry.task_name}</Text>
                                {entry.description && (
                                  <Text size="sm" c="dimmed" mb="xs">{entry.description}</Text>
                                )}
                                <Group gap="xs">
                                  <Badge 
                                    color={
                                      entry.category === 'delegate' ? 'green' :
                                      entry.category === 'automate' ? 'orange' :
                                      entry.category === 'eliminate' ? 'red' : 'violet'
                                    }
                                    size="sm"
                                  >
                                    {entry.category}
                                  </Badge>
                                  <Text size="xs" c="dimmed">
                                    {entry.duration_minutes}m
                                  </Text>
                                  {entry.input_method === 'voice' && (
                                    <Badge size="xs" variant="dot">Voice</Badge>
                                  )}
                                </Group>
                              </Box>
                              
                              <Text size="sm" c="dimmed">
                                {new Date(entry.created_at).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </Text>
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Tabs.Panel>

            <Tabs.Panel value="timeline" pt="lg">
              <Card radius="xl" withBorder p="xl">
                <Stack align="center" py="xl">
                  <Calendar size={48} color="var(--mantine-color-gray-4)" />
                  <Text c="dimmed" ta="center">Timeline View</Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Coming soon - Visual timeline of your daily activities
                  </Text>
                </Stack>
              </Card>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>

      <BottomNav />
    </Box>
  )
}