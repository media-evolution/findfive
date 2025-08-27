'use client'

import { useEffect } from 'react'
import { useEntriesStore } from '@/store/entries-store'
import { useUser } from '@/lib/user-context'
import { Clock, Trash2 } from 'lucide-react'
import { TimeEntry } from '@/lib/supabase'
import { 
  Stack, 
  Text, 
  Card, 
  Group, 
  Badge, 
  Button, 
  Loader,
  Center,
  Alert,
  Box
} from '@mantine/core'
import { modals } from '@mantine/modals'

export function TaskList() {
  const { entries, isLoading, error, deleteEntry } = useEntriesStore()
  const { userId } = useUser()


  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const handleDelete = async (id: string, taskName: string) => {
    modals.openConfirmModal({
      title: 'Delete Task',
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete "{taskName}"? This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onCancel: () => {},
      onConfirm: () => deleteEntry(id),
    })
  }

  if (!userId) {
    return (
      <Center py="xl">
        <Text c="dimmed">Please set a user ID to view tasks</Text>
      </Center>
    )
  }

  if (isLoading && entries.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center">
          <Loader size="md" color="brand.5" />
          <Text c="dimmed">Loading tasks...</Text>
        </Stack>
      </Center>
    )
  }

  if (error && entries.length === 0) {
    return (
      <Center py="xl">
        <Alert color="red" radius="lg">
          <Text fw={500}>Error loading tasks</Text>
          <Text size="sm" c="dimmed">{error}</Text>
        </Alert>
      </Center>
    )
  }

  if (entries.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center">
          <Text c="dimmed" size="lg">No tasks yet</Text>
          <Text size="sm" c="dimmed">Start by recording or adding your first task above</Text>
        </Stack>
      </Center>
    )
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Box>
          <Text size="xl" fw={700}>Recent Tasks</Text>
          <Text size="xs" c="dimmed">Tasks will be categorized later for delegation analysis</Text>
        </Box>
      </Group>
      
      <Stack gap="md">
        {entries.map((entry: TimeEntry) => (
          <Card 
            key={entry.id} 
            radius="xl" 
            padding="lg"
            withBorder
            shadow="sm"
          >
            <Group justify="space-between" align="flex-start">
              <Box style={{ flex: 1 }}>
                <Text size="lg" fw={600} mb="xs">
                  {entry.task_name}
                </Text>
                <Badge 
                  color="gray" 
                  size="lg"
                  radius="xl"
                  variant="light"
                >
                  Uncategorized
                </Badge>
                {entry.description && (
                  <Text size="sm" c="dimmed" mt="xs">
                    {entry.description}
                  </Text>
                )}
                <Group gap="xs" mt="sm">
                  <Clock size={14} color="var(--mantine-color-gray-6)" />
                  <Text size="sm" c="dimmed">
                    {entry.duration_minutes} min • {formatDate(entry.created_at)}
                  </Text>
                </Group>
              </Box>
              
              <Box>
                <Text size="lg" fw={500} c="dimmed">
                  {formatTime(entry.created_at)}
                </Text>
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  leftSection={<Trash2 size={14} />}
                  onClick={() => handleDelete(entry.id, entry.task_name)}
                  mt="sm"
                >
                  Delete
                </Button>
              </Box>
            </Group>
          </Card>
        ))}
      </Stack>
    </Stack>
  )
}