'use client'

import { useEffect, useState } from 'react'
import { 
  Badge, 
  Group, 
  Text, 
  ThemeIcon, 
  Tooltip, 
  Transition,
  Alert,
  ActionIcon,
  Box,
  Paper
} from '@mantine/core'
import { 
  IconWifi, 
  IconWifiOff, 
  IconCheck, 
  IconClock, 
  IconAlertTriangle,
  IconRefresh,
  IconDatabase
} from '@tabler/icons-react'
import { useConnectivityStore } from '@/lib/connectivity'
import { useEntriesStore } from '@/store/entries-store'

export function ConnectivityIndicator() {
  const { isOnline, isBackOnline, connectionType, effectiveType } = useConnectivityStore()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Badge variant="light" color="blue" size="sm" leftSection={<IconWifi size={14} />}>
        Online
      </Badge>
    )
  }
  
  const getConnectionIcon = () => {
    if (!isOnline) return <IconWifiOff size={14} />
    return <IconWifi size={14} />
  }
  
  const getConnectionColor = () => {
    if (!isOnline) return 'red'
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'yellow'
    return 'green'
  }
  
  const getConnectionLabel = () => {
    if (!isOnline) return 'Offline'
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'Slow'
    if (effectiveType === '3g') return 'Good'
    if (effectiveType === '4g') return 'Fast'
    return 'Online'
  }
  
  return (
    <>
      <Tooltip label={`Connection: ${getConnectionLabel()}${connectionType ? ` (${connectionType})` : ''}`}>
        <Badge
          variant="light"
          color={getConnectionColor()}
          size="sm"
          leftSection={getConnectionIcon()}
        >
          {getConnectionLabel()}
        </Badge>
      </Tooltip>
      
      <Transition mounted={isBackOnline} transition="slide-down" duration={300}>
        {(styles) => (
          <Alert
            style={styles}
            color="green"
            title="Back online!"
            icon={<IconCheck size={16} />}
            pos="fixed"
            top={20}
            right={20}
            w="auto"
            maw={300}
            styles={{ root: { zIndex: 1000 } }}
          >
            Your connection has been restored.
          </Alert>
        )}
      </Transition>
    </>
  )
}

interface SyncStatusIndicatorProps {
  isPending?: number
  isError?: boolean
  lastSync?: Date
  onRetry?: () => void
  onDismissError?: () => void
}

export function SyncStatusIndicator({ 
  isPending = 0, 
  isError = false, 
  lastSync, 
  onRetry,
  onDismissError
}: SyncStatusIndicatorProps) {
  const { isOnline } = useConnectivityStore()
  const [showDetails, setShowDetails] = useState(false)
  
  const getSyncIcon = () => {
    if (isError) return <IconAlertTriangle size={14} />
    if (isPending > 0) return <IconClock size={14} />
    return <IconCheck size={14} />
  }
  
  const getSyncColor = () => {
    if (isError) return 'red'
    if (isPending > 0) return 'yellow'
    return 'green'
  }
  
  const getSyncLabel = () => {
    if (isError) return 'Sync failed'
    if (isPending > 0) return `${isPending} pending`
    if (lastSync) {
      const now = new Date()
      const diff = now.getTime() - lastSync.getTime()
      const minutes = Math.floor(diff / 60000)
      if (minutes < 1) return 'Just synced'
      if (minutes < 60) return `Synced ${minutes}m ago`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `Synced ${hours}h ago`
      return 'Synced'
    }
    return 'Never synced'
  }
  
  const handleClick = () => {
    if (isError && onRetry) {
      onRetry()
    } else {
      setShowDetails(!showDetails)
    }
  }
  
  return (
    <Box>
      <Group gap="xs">
        <Tooltip label={isError ? 'Click to retry' : 'Sync status'}>
          <Badge
            variant="light"
            color={getSyncColor()}
            size="sm"
            leftSection={getSyncIcon()}
            style={{ cursor: isError ? 'pointer' : 'default' }}
            onClick={handleClick}
          >
            {getSyncLabel()}
          </Badge>
        </Tooltip>
        
        {!isOnline && (
          <Tooltip label="Working offline">
            <ThemeIcon size="sm" variant="light" color="orange">
              <IconWifiOff size={12} />
            </ThemeIcon>
          </Tooltip>
        )}
      </Group>
      
      {isError && (
        <Transition mounted={isError} transition="slide-down" duration={300}>
          {(styles) => (
            <Alert
              style={styles}
              color="red"
              title="Sync Error"
              icon={<IconAlertTriangle size={16} />}
              mt="xs"
              withCloseButton
              onClose={onDismissError}
            >
              <Group justify="space-between" align="flex-start">
                <Text size="sm">
                  {!isOnline 
                    ? 'Unable to sync while offline. Changes will sync when connection is restored.'
                    : 'Failed to sync your changes. Your data is safe locally.'}
                </Text>
                {onRetry && isOnline && (
                  <ActionIcon
                    variant="light"
                    color="red"
                    size="sm"
                    onClick={onRetry}
                  >
                    <IconRefresh size={12} />
                  </ActionIcon>
                )}
              </Group>
            </Alert>
          )}
        </Transition>
      )}
      
      {showDetails && lastSync && (
        <Transition mounted={showDetails} transition="slide-down" duration={200}>
          {(styles) => (
            <Alert
              style={styles}
              color="blue"
              title="Sync Details"
              icon={<IconCheck size={16} />}
              mt="xs"
              withCloseButton
              onClose={() => setShowDetails(false)}
            >
              <Group gap="xs">
                <Text size="sm">Last successful sync:</Text>
                <Text size="sm" c="dimmed">{lastSync.toLocaleString()}</Text>
              </Group>
            </Alert>
          )}
        </Transition>
      )}
    </Box>
  )
}

export function OfflineBanner() {
  const { isOnline, lastOfflineTime } = useConnectivityStore()
  const [offlineDuration, setOfflineDuration] = useState<number>(0)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (!mounted) return
    
    let interval: NodeJS.Timeout
    
    if (!isOnline && lastOfflineTime) {
      interval = setInterval(() => {
        const duration = Date.now() - lastOfflineTime.getTime()
        setOfflineDuration(duration)
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [mounted, isOnline, lastOfflineTime])
  
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }
  
  if (!mounted || isOnline) return null
  
  return (
    <Transition mounted={!isOnline} transition="slide-down" duration={300}>
      {(styles) => (
        <Alert
          style={styles}
          color="orange"
          title="You're offline"
          icon={<IconWifiOff size={16} />}
          pos="fixed"
          top={0}
          left={0}
          right={0}
          radius={0}
          styles={{ root: { zIndex: 1000 } }}
        >
          <Group justify="space-between">
            <Text size="sm">
              You can still use the app. Changes will sync when you reconnect.
              {offlineDuration > 0 && ` (${formatDuration(offlineDuration)} offline)`}
            </Text>
          </Group>
        </Alert>
      )}
    </Transition>
  )
}

export function SyncStatus() {
  const { entries } = useEntriesStore()
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    // Update last saved time when entries change
    if (entries.length > 0) {
      setLastSaved(new Date())
    }
  }, [entries])

  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'No data'
    
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <Paper p="xs" radius="xl" bg="gray.0" withBorder>
      <Group gap="sm">
        <ConnectivityIndicator />
        
        {/* Storage Status */}
        <Tooltip label="Local Storage">
          <Badge
            variant="light"
            color="blue"
            leftSection={<IconDatabase size={12} />}
            size="sm"
          >
            Local Storage
          </Badge>
        </Tooltip>

        {/* Data Status */}
        <Tooltip label={`${entries.length} tasks stored locally`}>
          <Group gap="xs">
            <IconCheck size={12} color="var(--mantine-color-green-6)" />
            <Text size="xs" c="green">{entries.length} tasks</Text>
          </Group>
        </Tooltip>

        {/* Last Saved Time */}
        <Tooltip label={lastSaved ? `Last saved: ${lastSaved.toLocaleString()}` : 'No data saved yet'}>
          <Text size="xs" c="dimmed">{formatLastSaved(lastSaved)}</Text>
        </Tooltip>
      </Group>
    </Paper>
  )
}