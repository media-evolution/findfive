'use client'

import { useEffect, useState } from 'react'
import { Text, Card, Stack, Badge, Code } from '@mantine/core'

export function FontDebug() {
  const [fontLoaded, setFontLoaded] = useState(false)
  const [computedFont, setComputedFont] = useState('')

  useEffect(() => {
    // Check if Geist font is loaded
    const checkFont = () => {
      if (document.fonts) {
        document.fonts.ready.then(() => {
          const isGeistLoaded = document.fonts.check('16px Geist')
          setFontLoaded(isGeistLoaded)
          
          // Get computed font family
          const element = document.createElement('div')
          element.style.fontFamily = 'Geist, var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          document.body.appendChild(element)
          const computed = window.getComputedStyle(element).fontFamily
          setComputedFont(computed)
          document.body.removeChild(element)
        })
      }
    }

    checkFont()
    
    // Also check after a delay
    setTimeout(checkFont, 2000)
  }, [])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Card radius="md" withBorder bg="yellow.0" style={{ position: 'fixed', top: 10, right: 10, zIndex: 1000, maxWidth: 300 }}>
      <Stack gap="xs">
        <Text size="sm" fw={600}>Font Debug</Text>
        <Badge color={fontLoaded ? 'green' : 'red'} size="sm">
          Geist: {fontLoaded ? 'Loaded' : 'Not Loaded'}
        </Badge>
        <Text size="xs">Computed font:</Text>
        <Code block>{computedFont}</Code>
        <Text size="xs" style={{ fontFamily: 'Geist, sans-serif' }}>
          Sample text in Geist
        </Text>
        <Text size="xs" style={{ fontFamily: 'serif' }}>
          Sample text in serif (fallback)
        </Text>
      </Stack>
    </Card>
  )
}