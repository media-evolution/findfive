'use client'

import { 
  Paper, 
  Group, 
  Text,
  Box
} from '@mantine/core'
import { SessionProgress } from './session-progress'
import { useSession } from '@/contexts/session-context'

interface SessionProgressHeaderProps {
  className?: string
}

export function SessionProgressHeader({ className }: SessionProgressHeaderProps) {
  const { currentSession } = useSession()

  if (!currentSession) {
    return null
  }

  return (
    <Paper
      radius={0}
      p="sm"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderBottom: '1px solid var(--mantine-color-gray-2)'
      }}
      className={className}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Box flex={1}>
          <Text size="sm" c="white" fw={500} mb={2}>
            Current Session
          </Text>
          <SessionProgress variant="compact" showRefresh={false} />
        </Box>
        
        <SessionProgress variant="ring" showRefresh={false} />
      </Group>
    </Paper>
  )
}