'use client'

import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'
import { UserProvider } from '@/lib/user-context'
import { SessionProvider } from '@/contexts/session-context'
import { ConnectivityProvider } from '@/lib/connectivity-provider'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'

const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    brand: [
      '#FFF5F5',
      '#FFE3E3',
      '#FFC9C9',
      '#FFA8A8',
      '#FF8787',
      '#FF6B6B',
      '#FA5252',
      '#F03E3E',
      '#E03131',
      '#C92A2A'
    ]
  },
  fontFamily: 'var(--font-geist-sans, -apple-system), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontFamilyMonospace: 'var(--font-geist-mono, "SF Mono"), "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace',
  headings: {
    fontFamily: 'var(--font-geist-sans, -apple-system), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  defaultRadius: 'lg',
  components: {
    Button: {
      defaultProps: {
        radius: 'xl',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'xl',
        centered: true,
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'xl',
      },
    },
    Textarea: {
      defaultProps: {
        radius: 'xl',
      },
    },
    Card: {
      defaultProps: {
        radius: 'xl',
        withBorder: true,
      },
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-center" />
      <ModalsProvider>
        <ConnectivityProvider>
          <UserProvider>
            <SessionProvider>
              {children}
            </SessionProvider>
          </UserProvider>
        </ConnectivityProvider>
      </ModalsProvider>
    </MantineProvider>
  )
}