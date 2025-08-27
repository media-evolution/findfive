'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart3, Settings } from 'lucide-react'
import { Group, UnstyledButton, Text, Paper } from '@mantine/core'

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { 
      href: '/', 
      icon: Home, 
      label: 'Home',
      active: pathname === '/'
    },
    { 
      href: '/analytics', 
      icon: BarChart3, 
      label: 'Analytics',
      active: pathname === '/analytics'
    },
    { 
      href: '/settings', 
      icon: Settings, 
      label: 'Settings',
      active: pathname === '/settings'
    },
  ]

  return (
    <Paper
      radius={0}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: '1px solid var(--mantine-color-gray-2)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        backgroundColor: 'white',
        zIndex: 100,
      }}
    >
      <Group justify="space-around" p="xs">
        {navItems.map(({ href, icon: Icon, label, active }) => (
          <UnstyledButton
            key={href}
            component={Link}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '8px 12px',
              color: active ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-6)',
              transition: 'color 0.2s ease',
              textDecoration: 'none',
            }}
          >
            <Icon size={24} />
            <Text size="xs" fw={500}>{label}</Text>
          </UnstyledButton>
        ))}
      </Group>
    </Paper>
  )
}