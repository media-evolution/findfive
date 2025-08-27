'use client'

import { 
  Skeleton, 
  Stack, 
  Group, 
  Card, 
  Box, 
  Container,
  Paper,
  Grid
} from '@mantine/core'

// Task List Loading Skeleton
export function TaskListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Stack gap="md">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} radius="md" p="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <Skeleton height={16} width="60%" radius="sm" />
              <Skeleton height={24} width={60} radius="xl" />
            </Group>
            <Skeleton height={12} width="80%" radius="sm" />
            <Group gap="xs">
              <Skeleton height={20} width={80} radius="xl" />
              <Skeleton height={20} width={60} radius="xl" />
              <Skeleton height={20} width={40} radius="xl" />
            </Group>
          </Stack>
        </Card>
      ))}
    </Stack>
  )
}

// Session Card Loading Skeleton
export function SessionCardSkeleton() {
  return (
    <Card radius="xl" p="lg" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Skeleton height={20} width={150} radius="sm" />
          <Skeleton height={28} width={80} radius="xl" />
        </Group>
        
        <Stack gap="xs">
          <Group justify="space-between">
            <Skeleton height={14} width={100} radius="sm" />
            <Skeleton height={14} width={60} radius="sm" />
          </Group>
          <Skeleton height={8} width="100%" radius="xl" />
        </Stack>
        
        <Group gap="sm">
          <Skeleton height={20} width={70} radius="xl" />
          <Skeleton height={20} width={90} radius="xl" />
          <Skeleton height={20} width={80} radius="xl" />
        </Group>
        
        <Group justify="center" gap="sm">
          <Skeleton height={36} width={100} radius="xl" />
          <Skeleton height={36} width={120} radius="xl" />
        </Group>
      </Stack>
    </Card>
  )
}

// Analytics Chart Loading Skeleton
export function AnalyticsChartSkeleton() {
  return (
    <Card radius="md" p="lg" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Skeleton height={18} width={150} radius="sm" />
          <Skeleton height={32} width={100} radius="sm" />
        </Group>
        
        <Box style={{ height: 300, position: 'relative' }}>
          {/* Chart bars */}
          <Group align="flex-end" style={{ height: '100%' }} gap="xs">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton
                key={index}
                height={Math.random() * 200 + 50}
                width={30}
                radius="sm"
                style={{ flex: 1 }}
              />
            ))}
          </Group>
        </Box>
        
        <Group gap="sm" justify="center">
          <Skeleton height={16} width={80} radius="sm" />
          <Skeleton height={16} width={100} radius="sm" />
          <Skeleton height={16} width={90} radius="sm" />
        </Group>
      </Stack>
    </Card>
  )
}


// Settings Page Loading Skeleton
export function SettingsPageSkeleton() {
  return (
    <Container size="sm" px="md" py="lg">
      <Stack gap="lg">
        {Array.from({ length: 5 }).map((_, sectionIndex) => (
          <Card key={sectionIndex} radius="xl" withBorder>
            <Stack gap="md">
              <Group gap="xs">
                <Skeleton height={24} width={24} radius="xl" />
                <Skeleton height={20} width={150} radius="sm" />
              </Group>
              
              <Stack gap="sm">
                {Array.from({ length: Math.floor(Math.random() * 4) + 2 }).map((_, itemIndex) => (
                  <Group key={itemIndex} justify="space-between">
                    <Box>
                      <Skeleton height={14} width={120} radius="sm" mb="xs" />
                      <Skeleton height={10} width={200} radius="sm" />
                    </Box>
                    <Skeleton height={24} width={44} radius="xl" />
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Card>
        ))}
      </Stack>
    </Container>
  )
}

// Notification Settings Loading Skeleton
export function NotificationSettingsSkeleton() {
  return (
    <Card radius="md" p="lg">
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <Skeleton height={24} width={24} radius="xl" />
            <Skeleton height={18} width={150} radius="sm" />
          </Group>
          <Skeleton height={28} width={50} radius="xl" />
        </Group>
        
        <Skeleton height={1} width="100%" />
        
        <Stack gap="sm">
          <Group justify="space-between" mb="xs">
            <Skeleton height={14} width={120} radius="sm" />
            <Skeleton height={20} width={80} radius="xl" />
          </Group>
          <Skeleton height={32} width="100%" radius="xl" />
        </Stack>
        
        <Stack gap="sm">
          <Group justify="space-between" mb="xs">
            <Skeleton height={14} width={90} radius="sm" />
            <Skeleton height={20} width={40} radius="xl" />
          </Group>
          <Group grow>
            <Skeleton height={36} width="100%" radius="xl" />
            <Skeleton height={36} width="100%" radius="xl" />
          </Group>
        </Stack>
        
        <Stack gap="xs">
          {Array.from({ length: 6 }).map((_, index) => (
            <Group key={index} justify="space-between">
              <Group gap="xs">
                <Skeleton height={18} width={18} radius="sm" />
                <Skeleton height={14} width={100 + Math.random() * 50} radius="sm" />
              </Group>
              <Skeleton height={20} width={40} radius="xl" />
            </Group>
          ))}
        </Stack>
        
        <Group gap="sm" mt="md">
          <Skeleton height={32} width={120} radius="xl" />
          <Skeleton height={32} width={130} radius="xl" />
        </Group>
      </Stack>
    </Card>
  )
}

// History Page Loading Skeleton
export function HistoryPageSkeleton() {
  return (
    <Container size="sm" px="md" py="lg">
      <Stack gap="lg">
        {/* Header */}
        <Stack gap="xs">
          <Skeleton height={28} width={200} radius="sm" />
          <Skeleton height={16} width={300} radius="sm" />
        </Stack>
        
        {/* Filter/Search */}
        <Group gap="sm">
          <Skeleton height={36} width="100%" radius="sm" style={{ flex: 1 }} />
          <Skeleton height={36} width={100} radius="sm" />
        </Group>
        
        {/* History Items */}
        <Stack gap="md">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} radius="md" p="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Skeleton height={16} width="80%" radius="sm" />
                  <Skeleton height={12} width="60%" radius="sm" />
                </Stack>
                <Stack align="flex-end" gap="xs">
                  <Skeleton height={14} width={70} radius="sm" />
                  <Skeleton height={20} width={80} radius="xl" />
                </Stack>
              </Group>
              
              <Group gap="xs">
                <Skeleton height={18} width={60} radius="xl" />
                <Skeleton height={18} width={50} radius="xl" />
                <Skeleton height={18} width={70} radius="xl" />
              </Group>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Container>
  )
}

// Voice Button Loading Skeleton
export function VoiceButtonSkeleton() {
  return (
    <Box ta="center" py="md">
      <Skeleton
        height={96}
        width={96}
        radius="50%"
        mx="auto"
      />
      <Skeleton height={14} width={120} radius="sm" mt="md" mx="auto" />
    </Box>
  )
}

// Generic Loading State
export function LoadingState({ 
  message = "Loading...", 
  height = 200 
}: { 
  message?: string
  height?: number 
}) {
  return (
    <Box 
      style={{ 
        height, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 16
      }}
    >
      <Stack align="center" gap="md">
        <Skeleton height={40} width={40} radius="xl" />
        <Skeleton height={16} width={120} radius="sm" />
      </Stack>
    </Box>
  )
}