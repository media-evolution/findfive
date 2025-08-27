'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Stack,
  Group,
  Text,
  Switch,
  Select,
  SegmentedControl,
  Button,
  Badge,
  Alert,
  ActionIcon,
  Tooltip,
  Box,
  Divider,
  Progress,
  NumberInput,
  MultiSelect,
  TextInput,
  Menu
} from '@mantine/core'
import {
  IconBell,
  IconBellOff,
  IconClock,
  IconCalendar,
  IconVolume,
  IconDeviceMobile,
  IconBellRinging,
  IconCheck,
  IconX,
  IconInfoCircle,
  IconTestPipe
} from '@tabler/icons-react'
import { useNotificationStore } from '@/store/notification-store'
import { showNotification } from '@mantine/notifications'

export function NotificationSettings() {
  const {
    preferences,
    permissionStatus,
    isSupported,
    isMuted,
    mutedUntil,
    requestPermission,
    updatePreferences,
    muteFor,
    unmute,
    testNotification
  } = useNotificationStore()

  const [localPreferences, setLocalPreferences] = useState(preferences)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    setLocalPreferences(preferences)
  }, [preferences])

  const handlePermissionRequest = async () => {
    const granted = await requestPermission()
    if (granted) {
      showNotification({
        title: 'Success',
        message: 'Notification permissions granted!',
        color: 'green'
      })
    } else {
      showNotification({
        title: 'Permission Denied',
        message: 'Please enable notifications in your browser settings',
        color: 'red'
      })
    }
  }

  const handleTestNotification = async () => {
    setIsTesting(true)
    try {
      await testNotification()
      showNotification({
        title: 'Test Sent',
        message: 'Check for the test notification!',
        color: 'blue'
      })
    } catch (error) {
      showNotification({
        title: 'Error',
        message: 'Failed to send test notification',
        color: 'red'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handlePreferenceChange = (key: string, value: any) => {
    const newPreferences = { ...localPreferences, [key]: value }
    setLocalPreferences(newPreferences)
    updatePreferences({ [key]: value })
  }

  const workDayOptions = [
    { value: '0', label: 'Sun' },
    { value: '1', label: 'Mon' },
    { value: '2', label: 'Tue' },
    { value: '3', label: 'Wed' },
    { value: '4', label: 'Thu' },
    { value: '5', label: 'Fri' },
    { value: '6', label: 'Sat' }
  ]

  const muteOptions = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
    { label: '4 hours', value: 240 }
  ]

  if (!isSupported) {
    return (
      <Alert 
        icon={<IconInfoCircle size={16} />} 
        color="yellow"
        title="Notifications Not Supported"
      >
        <Text size="sm">
          Your browser doesn't support notifications. Please use a modern browser like Chrome, Firefox, or Safari.
        </Text>
      </Alert>
    )
  }

  return (
    <Stack gap="md">
      {/* Permission Status */}
      {permissionStatus !== 'granted' && (
        <Alert 
          icon={<IconBell size={16} />} 
          color="blue"
          title="Enable Notifications"
        >
          <Group justify="space-between" align="center">
            <Text size="sm">
              Allow Find Five to send you reminders to track your time
            </Text>
            <Button 
              size="sm" 
              onClick={handlePermissionRequest}
              leftSection={<IconBell size={14} />}
            >
              Enable
            </Button>
          </Group>
        </Alert>
      )}

      {/* Mute Status */}
      {isMuted && mutedUntil && (
        <Alert 
          icon={<IconBellOff size={16} />} 
          color="orange"
          title="Notifications Muted"
          withCloseButton
          onClose={unmute}
        >
          <Text size="sm">
            Muted until {new Date(mutedUntil).toLocaleTimeString()}
          </Text>
        </Alert>
      )}

      {/* Main Settings */}
      <Card radius="md" p="lg">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconBell size={24} color="var(--mantine-color-blue-6)" />
              <Text size="lg" fw={600}>Notification Settings</Text>
            </Group>
            <Switch
              checked={localPreferences.enabled}
              onChange={(e) => handlePreferenceChange('enabled', e.currentTarget.checked)}
              size="lg"
              color="blue"
              disabled={permissionStatus !== 'granted'}
            />
          </Group>

          <Divider />

          {/* Reminder Interval */}
          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>Reminder Interval</Text>
              <Badge variant="light" size="sm">
                Every {localPreferences.interval} minutes
              </Badge>
            </Group>
            <SegmentedControl
              value={String(localPreferences.interval)}
              onChange={(value) => handlePreferenceChange('interval', Number(value))}
              data={[
                { label: '15 min', value: '15' },
                { label: '30 min', value: '30' },
                { label: '60 min', value: '60' }
              ]}
              fullWidth
              disabled={!localPreferences.enabled}
            />
          </Box>

          {/* Work Hours */}
          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>Work Hours Only</Text>
              <Switch
                checked={localPreferences.workHoursOnly}
                onChange={(e) => handlePreferenceChange('workHoursOnly', e.currentTarget.checked)}
                disabled={!localPreferences.enabled}
              />
            </Group>
            
            {localPreferences.workHoursOnly && (
              <Stack gap="xs" mt="sm">
                <Group grow>
                  <TextInput
                    label="Start Time"
                    value={localPreferences.workStartTime}
                    onChange={(e) => handlePreferenceChange('workStartTime', e.target.value)}
                    placeholder="09:00"
                    leftSection={<IconClock size={14} />}
                    disabled={!localPreferences.enabled}
                  />
                  <TextInput
                    label="End Time"
                    value={localPreferences.workEndTime}
                    onChange={(e) => handlePreferenceChange('workEndTime', e.target.value)}
                    placeholder="17:00"
                    leftSection={<IconClock size={14} />}
                    disabled={!localPreferences.enabled}
                  />
                </Group>
                
                <MultiSelect
                  label="Work Days"
                  value={localPreferences.workDays.map(String)}
                  onChange={(values) => handlePreferenceChange('workDays', values.map(Number))}
                  data={workDayOptions}
                  placeholder="Select work days"
                  disabled={!localPreferences.enabled}
                />
              </Stack>
            )}
          </Box>

          <Divider />

          {/* Advanced Settings */}
          <Text size="sm" fw={600} c="dimmed">Advanced Settings</Text>

          <Stack gap="sm">
            <Group justify="space-between">
              <Group gap="xs">
                <IconBellRinging size={18} />
                <Text size="sm">Progressive Intervals</Text>
              </Group>
              <Tooltip label="Start with gentle reminders, then increase frequency">
                <Switch
                  checked={localPreferences.progressiveIntervals}
                  onChange={(e) => handlePreferenceChange('progressiveIntervals', e.currentTarget.checked)}
                  disabled={!localPreferences.enabled}
                />
              </Tooltip>
            </Group>

            <Group justify="space-between">
              <Group gap="xs">
                <IconClock size={18} />
                <Text size="sm">Smart Muting</Text>
              </Group>
              <Tooltip label="Auto-pause when you're actively logging">
                <Switch
                  checked={localPreferences.smartMuting}
                  onChange={(e) => handlePreferenceChange('smartMuting', e.currentTarget.checked)}
                  disabled={!localPreferences.enabled}
                />
              </Tooltip>
            </Group>

            <Group justify="space-between">
              <Group gap="xs">
                <IconCalendar size={18} />
                <Text size="sm">Session Reminders</Text>
              </Group>
              <Switch
                checked={localPreferences.sessionReminders}
                onChange={(e) => handlePreferenceChange('sessionReminders', e.currentTarget.checked)}
                disabled={!localPreferences.enabled}
              />
            </Group>

            <Group justify="space-between">
              <Group gap="xs">
                <IconVolume size={18} />
                <Text size="sm">Sound</Text>
              </Group>
              <Switch
                checked={localPreferences.soundEnabled}
                onChange={(e) => handlePreferenceChange('soundEnabled', e.currentTarget.checked)}
                disabled={!localPreferences.enabled}
              />
            </Group>

            <Group justify="space-between">
              <Group gap="xs">
                <IconDeviceMobile size={18} />
                <Text size="sm">Vibration</Text>
              </Group>
              <Switch
                checked={localPreferences.vibrationEnabled}
                onChange={(e) => handlePreferenceChange('vibrationEnabled', e.currentTarget.checked)}
                disabled={!localPreferences.enabled}
              />
            </Group>
          </Stack>

          <Divider />

          {/* Quick Actions */}
          <Stack gap="sm">
            <Text size="sm" fw={600} c="dimmed">Quick Actions</Text>
            
            <Group gap="sm">
              {/* Temporary Mute */}
              <Menu>
                <Menu.Target>
                  <Button
                    variant="light"
                    leftSection={<IconBellOff size={16} />}
                    disabled={isMuted || !localPreferences.enabled}
                  >
                    Mute Temporarily
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Mute Duration</Menu.Label>
                  {muteOptions.map(option => (
                    <Menu.Item
                      key={option.value}
                      onClick={() => muteFor(option.value)}
                    >
                      {option.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>

              {/* Test Notification */}
              <Button
                variant="light"
                color="blue"
                leftSection={<IconTestPipe size={16} />}
                onClick={handleTestNotification}
                loading={isTesting}
                disabled={permissionStatus !== 'granted' || !localPreferences.enabled}
              >
                Test Notification
              </Button>
            </Group>
          </Stack>
        </Stack>
      </Card>

      {/* Info Card */}
      <Card radius="md" p="md" bg="blue.0">
        <Group gap="xs" mb="xs">
          <IconInfoCircle size={16} color="var(--mantine-color-blue-6)" />
          <Text size="sm" fw={600} c="blue.7">How it works</Text>
        </Group>
        <Stack gap="xs">
          <Text size="xs" c="dimmed">
            • Notifications remind you to log your time at regular intervals
          </Text>
          <Text size="xs" c="dimmed">
            • Smart features detect your activity and adjust accordingly
          </Text>
          <Text size="xs" c="dimmed">
            • Notifications respect your work hours and leave days
          </Text>
          <Text size="xs" c="dimmed">
            • Progressive intervals start gentle and increase frequency
          </Text>
        </Stack>
      </Card>
    </Stack>
  )
}