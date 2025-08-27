'use client'

import { 
  Stack, 
  Text, 
  Button, 
  ThemeIcon, 
  Paper,
  Group,
  Box,
  Alert
} from '@mantine/core'
import { 
  IconPlus,
  IconCalendar,
  IconCheckbox,
  IconClockHour3,
  IconBell,
  IconSearch,
  IconMoodEmpty,
  IconWifi,
  IconDatabase,
  IconMicrophone,
  IconHistory,
  IconAnalyze
} from '@tabler/icons-react'

interface EmptyStateProps {
  title: string
  description: string
  icon: React.ReactNode
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  variant?: 'default' | 'subtle' | 'alert'
  size?: 'sm' | 'md' | 'lg'
}

function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
  size = 'md'
}: EmptyStateProps) {
  const sizeConfig = {
    sm: { iconSize: 48, spacing: 'sm', titleOrder: 4 as const },
    md: { iconSize: 64, spacing: 'md', titleOrder: 3 as const },
    lg: { iconSize: 80, spacing: 'lg', titleOrder: 2 as const }
  }

  const config = sizeConfig[size]

  const content = (
    <Stack align="center" gap={config.spacing} p="xl">
      <ThemeIcon 
        size={config.iconSize} 
        radius="xl" 
        variant={variant === 'alert' ? 'filled' : 'light'}
        color={variant === 'alert' ? 'orange' : 'blue'}
      >
        {icon}
      </ThemeIcon>
      
      <Stack align="center" gap="xs">
        <Text size={size === 'lg' ? 'xl' : 'lg'} fw={600} ta="center">
          {title}
        </Text>
        <Text size={size === 'sm' ? 'sm' : 'md'} c="dimmed" ta="center" maw={400}>
          {description}
        </Text>
      </Stack>

      {(actionLabel || secondaryActionLabel) && (
        <Group gap="sm">
          {actionLabel && onAction && (
            <Button onClick={onAction} size={size}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="light" onClick={onSecondaryAction} size={size}>
              {secondaryActionLabel}
            </Button>
          )}
        </Group>
      )}
    </Stack>
  )

  if (variant === 'subtle') {
    return content
  }

  return (
    <Paper radius="lg" withBorder>
      {content}
    </Paper>
  )
}

// Specific Empty States
export function NoTasksEmpty({ onCreateTask }: { onCreateTask?: () => void }) {
  return (
    <EmptyState
      icon={<IconCheckbox size={32} />}
      title="No tasks yet"
      description="Start tracking your time by creating your first task. Use voice recording or type manually."
      actionLabel="Add First Task"
      onAction={onCreateTask}
      secondaryActionLabel="Learn More"
      onSecondaryAction={() => {
        // Could open help modal or guide
        console.log('Show help for tasks')
      }}
    />
  )
}

export function NoSessionEmpty({ onCreateSession }: { onCreateSession?: () => void }) {
  return (
    <EmptyState
      icon={<IconCalendar size={32} />}
      title="No active session"
      description="Start a focused work session to track your progress and build consistency over time."
      actionLabel="Start Session"
      onAction={onCreateSession}
      variant="alert"
    />
  )
}

export function NoHistoryEmpty({ onStartTracking }: { onStartTracking?: () => void }) {
  return (
    <EmptyState
      icon={<IconHistory size={32} />}
      title="No history yet"
      description="Your task history will appear here once you start tracking your time and completing tasks."
      actionLabel="Start Tracking"
      onAction={onStartTracking}
      size="sm"
    />
  )
}

export function NoAnalyticsEmpty({ onTrackMoreTasks }: { onTrackMoreTasks?: () => void }) {
  return (
    <EmptyState
      icon={<IconAnalyze size={32} />}
      title="Not enough data for insights"
      description="Track more tasks throughout your day to see detailed analytics and productivity patterns."
      actionLabel="Track Tasks"
      onAction={onTrackMoreTasks}
    />
  )
}

export function NoNotificationsEmpty({ onEnableNotifications }: { onEnableNotifications?: () => void }) {
  return (
    <EmptyState
      icon={<IconBell size={32} />}
      title="Notifications disabled"
      description="Enable notifications to get gentle reminders to track your time and stay focused."
      actionLabel="Enable Notifications"
      onAction={onEnableNotifications}
      variant="alert"
      size="sm"
    />
  )
}

export function NoSearchResultsEmpty({ 
  searchQuery, 
  onClearSearch 
}: { 
  searchQuery?: string
  onClearSearch?: () => void 
}) {
  return (
    <EmptyState
      icon={<IconSearch size={32} />}
      title="No results found"
      description={
        searchQuery 
          ? `No tasks found matching "${searchQuery}". Try adjusting your search terms.`
          : "No tasks match your current filters. Try adjusting your criteria."
      }
      actionLabel="Clear Search"
      onAction={onClearSearch}
      variant="subtle"
      size="sm"
    />
  )
}


// Error-related empty states
export function OfflineEmpty({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<IconWifi size={32} />}
      title="You're offline"
      description="Some features may not work properly. Check your internet connection and try again."
      actionLabel="Retry"
      onAction={onRetry}
      variant="alert"
    />
  )
}

export function DatabaseErrorEmpty({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<IconDatabase size={32} />}
      title="Connection error"
      description="Unable to load data. This might be a temporary issue with our servers."
      actionLabel="Try Again"
      onAction={onRetry}
      secondaryActionLabel="Report Issue"
      onSecondaryAction={() => {
        // Could open feedback form
        console.log('Report database issue')
      }}
      variant="alert"
    />
  )
}

export function VoiceNotSupportedEmpty({ onUseTyping }: { onUseTyping?: () => void }) {
  return (
    <EmptyState
      icon={<IconMicrophone size={32} />}
      title="Voice recording not supported"
      description="Your browser doesn't support voice recording. You can still add tasks by typing them manually."
      actionLabel="Type Instead"
      onAction={onUseTyping}
      variant="alert"
      size="sm"
    />
  )
}

// Generic empty state
export function GenericEmpty({
  title = "No data available",
  description = "There's nothing to show here right now.",
  actionLabel,
  onAction,
  icon = <IconMoodEmpty size={32} />
}: {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
      variant="subtle"
    />
  )
}

// Specialized container for empty states in different contexts
export function EmptyStateContainer({ 
  children, 
  minHeight = 300 
}: { 
  children: React.ReactNode
  minHeight?: number 
}) {
  return (
    <Box
      style={{
        minHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      {children}
    </Box>
  )
}

// Quick empty state for lists
export function ListEmptyState({
  message = "No items to display",
  action
}: {
  message?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <Stack align="center" gap="sm" py="xl">
      <Text size="sm" c="dimmed">{message}</Text>
      {action && (
        <Button size="xs" variant="light" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Stack>
  )
}