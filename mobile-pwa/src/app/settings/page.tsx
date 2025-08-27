'use client'

import { useEffect, useState } from 'react'
import { useEntriesStore } from '@/store/entries-store'
import { useUser } from '@/lib/user-context'
import { BottomNav } from '@/components/bottom-nav-mantine'
import { LeaveDayManager } from '@/components/session/leave-day-manager'
import { SessionHistory } from '@/components/session/session-history'
import { NotificationSettings } from '@/components/notification/notification-settings'
import { ArrowLeft, User, Trash2, Download, Bell, Palette, Clock, Shield } from 'lucide-react'
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
  Switch,
  Select,
  ActionIcon,
  Box,
  Divider,
  Badge,
  Accordion,
  ThemeIcon,
  Slider
} from '@mantine/core'
import { TimeInput } from '@mantine/dates'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'

export default function SettingsPage() {
  const { entries } = useEntriesStore()
  const { userId } = useUser()
  const [localUserId, setLocalUserId] = useState('')
  const [settings, setSettings] = useState({
    notifications: true,
    notificationInterval: 60,
    workStartTime: '09:00',
    workEndTime: '17:00',
    theme: 'light',
    voiceEnabled: true,
    autoCategorize: true,
    workDays: [1, 2, 3, 4, 5] // Mon-Fri
  })

  useEffect(() => {
    const storedUserId = localStorage.getItem('find-five-user-id') || ''
    setLocalUserId(storedUserId)
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('find-five-settings')
    if (savedSettings) {
      setSettings({ ...settings, ...JSON.parse(savedSettings) })
    }
  }, [])

  const handleUserIdChange = (newId: string) => {
    setLocalUserId(newId)
    localStorage.setItem('find-five-user-id', newId)
    notifications.show({
      title: 'User ID Updated',
      message: 'Page will reload to apply changes',
      color: 'blue'
    })
    setTimeout(() => window.location.reload(), 1500)
  }

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem('find-five-settings', JSON.stringify(newSettings))
    
    notifications.show({
      title: 'Setting Updated',
      message: `${key} has been updated`,
      color: 'green'
    })
  }

  const exportData = () => {
    const data = {
      userId,
      entries,
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `find-five-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    notifications.show({
      title: 'Data Exported',
      message: 'Your data has been downloaded successfully',
      color: 'green'
    })
  }

  const clearAllData = () => {
    modals.openConfirmModal({
      title: 'Clear All Data',
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to clear all data? This will remove all tasks, settings, and preferences. 
          This action cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Clear All Data', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        localStorage.clear()
        notifications.show({
          title: 'Data Cleared',
          message: 'All data has been removed. Page will reload.',
          color: 'red'
        })
        setTimeout(() => window.location.reload(), 1500)
      },
    })
  }

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
            <User size={24} color="white" />
            <Title order={3} c="white">Settings</Title>
          </Group>
        </Group>
      </Paper>

      <Container size="sm" px="md" py="lg">
        <Stack gap="lg">
          {/* User Settings */}
          <Card radius="md" withBorder>
            <Group mb="md">
              <ThemeIcon variant="light" radius="md" color="blue">
                <User size={20} />
              </ThemeIcon>
              <Text size="lg" fw={600}>User Settings</Text>
            </Group>
            
            <Stack gap="md">
              <Box>
                <Text size="sm" fw={500} mb="xs">User ID (Development)</Text>
                <Group>
                  <TextInput
                    placeholder="Enter user ID"
                    value={localUserId}
                    onChange={(e) => setLocalUserId(e.currentTarget.value)}
                    style={{ flex: 1 }}
                    radius="md"
                  />
                  <Button
                    onClick={() => handleUserIdChange(localUserId)}
                    radius="md"
                    disabled={!localUserId || localUserId === userId}
                  >
                    Save
                  </Button>
                </Group>
                <Text size="xs" c="dimmed" mt={4}>
                  Current: {userId || 'Not set'}
                </Text>
              </Box>
            </Stack>
          </Card>

          {/* Notification Settings */}
          <NotificationSettings />

          {/* Session Management */}
          <LeaveDayManager />

          {/* Session History */}
          <SessionHistory limit={5} />

          {/* Features */}
          <Card radius="md" withBorder>
            <Group mb="md">
              <ThemeIcon variant="light" radius="md" color="violet">
                <Shield size={20} />
              </ThemeIcon>
              <Text size="lg" fw={600}>Features</Text>
            </Group>
            
            <Stack gap="md">
              <Group justify="space-between">
                <Box>
                  <Text size="sm" fw={500}>Voice Recording</Text>
                  <Text size="xs" c="dimmed">Enable voice capture for tasks</Text>
                </Box>
                <Switch
                  checked={settings.voiceEnabled}
                  onChange={(e) => updateSetting('voiceEnabled', e.currentTarget.checked)}
                  color="green"
                  size="md"
                />
              </Group>

              <Divider />

              <Group justify="space-between">
                <Box>
                  <Text size="sm" fw={500}>Auto-Categorization</Text>
                  <Text size="xs" c="dimmed">AI automatically categorizes tasks</Text>
                </Box>
                <Switch
                  checked={settings.autoCategorize}
                  onChange={(e) => updateSetting('autoCategorize', e.currentTarget.checked)}
                  color="orange"
                  size="md"
                />
              </Group>
            </Stack>
          </Card>

          {/* Data Management */}
          <Card radius="md" withBorder>
            <Group mb="md">
              <ThemeIcon variant="light" radius="md" color="teal">
                <Download size={20} />
              </ThemeIcon>
              <Text size="lg" fw={600}>Data Management</Text>
            </Group>
            
            <Stack gap="md">
              <Group justify="space-between" p="md" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-md)' }}>
                <Box>
                  <Text size="sm" fw={500}>Export Data</Text>
                  <Text size="xs" c="dimmed">Download your tasks and settings as JSON</Text>
                </Box>
                <Button
                  leftSection={<Download size={16} />}
                  onClick={exportData}
                  radius="xl"
                  variant="light"
                >
                  Export
                </Button>
              </Group>

              <Group justify="space-between" p="md" style={{ 
                border: '1px solid var(--mantine-color-red-3)', 
                borderRadius: 'var(--mantine-radius-md)',
                backgroundColor: 'var(--mantine-color-red-0)'
              }}>
                <Box>
                  <Text size="sm" fw={500} c="red">Clear All Data</Text>
                  <Text size="xs" c="dimmed">Remove all tasks and settings</Text>
                </Box>
                <Button
                  leftSection={<Trash2 size={16} />}
                  onClick={clearAllData}
                  color="red"
                  radius="xl"
                >
                  Clear
                </Button>
              </Group>
            </Stack>
          </Card>

          {/* App Info */}
          <Card radius="md" withBorder>
            <Text size="lg" fw={600} mb="md">App Information</Text>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Version</Text>
                <Badge variant="light" size="sm">1.0.0 MVP</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Tasks Stored</Text>
                <Text size="sm" fw={500}>{entries.length}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">PWA Support</Text>
                <Badge color="green" variant="light" size="sm">Enabled</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Offline Mode</Text>
                <Badge color="blue" variant="light" size="sm">Active</Badge>
              </Group>
            </Stack>
          </Card>

          {/* About */}
          <Card radius="md" withBorder>
            <Text size="lg" fw={600} mb="md">About Find Five</Text>
            <Text size="sm" c="dimmed" mb="md">
              Find Five helps you identify the five most important things to focus on by tracking 
              where your time goes and categorizing tasks for delegation, automation, or elimination.
            </Text>
            <Paper p="md" radius="md" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Text size="sm" c="white" fw={500}>
                🚀 MVP Version - Core time tracking and AI categorization features
              </Text>
            </Paper>
          </Card>
        </Stack>
      </Container>

      <BottomNav />
    </Box>
  )
}