'use client'

import { useState } from 'react'
import { 
  ActionIcon, 
  Affix, 
  Transition, 
  Tooltip,
  Indicator
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconAlertTriangle, IconX } from '@tabler/icons-react'
import { InterruptionModal } from './interruption-modal'
import { useSession } from '@/contexts/session-context'
import { useInterruptionStore } from '@/store/interruption-store'

interface InterruptionFABProps {
  position?: { bottom: number, right: number }
  visible?: boolean
}

export function InterruptionFAB({ 
  position = { bottom: 160, right: 20 }, 
  visible = true 
}: InterruptionFABProps) {
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [isPressed, setIsPressed] = useState(false)
  const { currentSession } = useSession()
  const { offlineQueue } = useInterruptionStore()

  const hasActiveSession = currentSession?.status === 'active'
  const hasOfflineQueue = offlineQueue.length > 0

  const handlePress = () => {
    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 200)
    openModal()
  }

  // Don't show FAB if no active session and not in development
  if (!hasActiveSession && process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <>
      <Affix position={position} zIndex={100}>
        <Transition mounted={visible} transition="slide-up">
          {(transitionStyles) => (
            <div style={transitionStyles}>
              <Tooltip
                label={hasActiveSession ? "Log Interruption" : "No Active Session"}
                position="left"
                withArrow
              >
                <Indicator
                  color="orange"
                  size={8}
                  disabled={!hasOfflineQueue}
                  processing={hasOfflineQueue}
                  offset={4}
                >
                  <ActionIcon
                    size={56}
                    radius="50%"
                    variant="filled"
                    color="red"
                    onClick={handlePress}
                    disabled={!hasActiveSession}
                    style={{
                      transform: isPressed ? 'scale(0.95)' : 'scale(1)',
                      transition: 'transform 0.1s ease, box-shadow 0.2s ease',
                      boxShadow: isPressed 
                        ? '0 2px 8px rgba(255, 0, 0, 0.3)' 
                        : '0 4px 16px rgba(255, 0, 0, 0.4)',
                      border: hasActiveSession 
                        ? '2px solid white' 
                        : '2px solid var(--mantine-color-gray-4)'
                    }}
                    onMouseDown={() => setIsPressed(true)}
                    onMouseUp={() => setIsPressed(false)}
                    onMouseLeave={() => setIsPressed(false)}
                  >
                    <IconAlertTriangle size={28} color="white" />
                  </ActionIcon>
                </Indicator>
              </Tooltip>
            </div>
          )}
        </Transition>
      </Affix>

      <InterruptionModal 
        opened={modalOpened} 
        onClose={closeModal} 
      />
    </>
  )
}

// Quick interruption button for urgent cases
export function QuickInterruptionButtons() {
  const { currentSession } = useSession()
  const { quickInterruption, isLoading } = useInterruptionStore()

  const handleQuickInterruption = async (
    source: 'phone' | 'email' | 'team',
    impact: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    if (!currentSession) return

    try {
      await quickInterruption(currentSession.id, source, impact, 5)
    } catch (error) {
      console.error('Quick interruption failed:', error)
    }
  }

  if (!currentSession) return null

  return (
    <Affix position={{ bottom: 230, right: 20 }} zIndex={99}>
      <Transition mounted={true} transition="slide-right">
        {(transitionStyles) => (
          <div style={{ ...transitionStyles, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Tooltip label="Quick: Phone Call" position="left">
              <ActionIcon
                size={40}
                radius="50%"
                variant="filled"
                color="green"
                onClick={() => handleQuickInterruption('phone', 'medium')}
                loading={isLoading}
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  opacity: 0.8
                }}
              >
                📞
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Quick: Email" position="left">
              <ActionIcon
                size={40}
                radius="50%"
                variant="filled"
                color="orange"
                onClick={() => handleQuickInterruption('email', 'low')}
                loading={isLoading}
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  opacity: 0.8
                }}
              >
                📧
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Quick: Team" position="left">
              <ActionIcon
                size={40}
                radius="50%"
                variant="filled"
                color="violet"
                onClick={() => handleQuickInterruption('team', 'medium')}
                loading={isLoading}
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  opacity: 0.8
                }}
              >
                👥
              </ActionIcon>
            </Tooltip>
          </div>
        )}
      </Transition>
    </Affix>
  )
}