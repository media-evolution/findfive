'use client'

import { useState } from 'react'
import {
  Menu,
  Button,
  Avatar,
  Text,
  UnstyledButton,
  Group,
  rem,
  ActionIcon,
} from '@mantine/core'
import {
  IconUser,
  IconSettings,
  IconLogout,
  IconChevronDown,
  IconUserCircle,
} from '@tabler/icons-react'
import { useAuth, authActions } from '@/lib/auth-client'
import { notifications } from '@mantine/notifications'

interface UserMenuProps {
  variant?: 'button' | 'avatar' | 'compact'
}

export function UserMenu({ variant = 'button' }: UserMenuProps) {
  const { user, isAuthenticated } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await authActions.signOutUser()
      notifications.show({
        title: 'Signed Out',
        message: 'You have been signed out successfully.',
        color: 'green',
      })
    } catch (error) {
      notifications.show({
        title: 'Sign Out Failed',
        message: error instanceof Error ? error.message : 'An error occurred',
        color: 'red',
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  if (!isAuthenticated || !user) {
    return null
  }

  const displayName = user.name || user.email?.split('@')[0] || 'User'
  const userInitials = displayName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (variant === 'compact') {
    return (
      <Menu shadow="md" width={200} position="bottom-end">
        <Menu.Target>
          <ActionIcon variant="subtle" size="lg">
            <IconUserCircle size={20} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>
            <Text size="sm" fw={500}>
              {displayName}
            </Text>
            <Text size="xs" c="dimmed">
              {user.email}
            </Text>
          </Menu.Label>

          <Menu.Divider />

          <Menu.Item leftSection={<IconUser style={{ width: rem(14), height: rem(14) }} />}>
            Profile
          </Menu.Item>

          <Menu.Item leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}>
            Settings
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            color="red"
            leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    )
  }

  if (variant === 'avatar') {
    return (
      <Menu shadow="md" width={200} position="bottom-end">
        <Menu.Target>
          <UnstyledButton>
            <Avatar
              src={user.image}
              alt={displayName}
              radius="xl"
              size="sm"
            >
              {userInitials}
            </Avatar>
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>
            <Text size="sm" fw={500}>
              {displayName}
            </Text>
            <Text size="xs" c="dimmed">
              {user.email}
            </Text>
          </Menu.Label>

          <Menu.Divider />

          <Menu.Item leftSection={<IconUser style={{ width: rem(14), height: rem(14) }} />}>
            Profile
          </Menu.Item>

          <Menu.Item leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}>
            Settings
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            color="red"
            leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    )
  }

  // Default button variant
  return (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <UnstyledButton>
          <Group gap="xs">
            <Avatar
              src={user.image}
              alt={displayName}
              radius="xl"
              size="sm"
            >
              {userInitials}
            </Avatar>
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={500}>
                {displayName}
              </Text>
              <Text c="dimmed" size="xs">
                {user.email}
              </Text>
            </div>
            <IconChevronDown size={16} />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Account</Menu.Label>

        <Menu.Item leftSection={<IconUser style={{ width: rem(14), height: rem(14) }} />}>
          Profile
        </Menu.Item>

        <Menu.Item leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}>
          Settings
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          color="red"
          leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}