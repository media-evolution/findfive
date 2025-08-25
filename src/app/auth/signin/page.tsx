'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Container, Title, Text, Center } from '@mantine/core'
import { AuthForms } from '@/components/auth/auth-forms'
import { useAuth } from '@/lib/auth-client'

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  
  const redirectTo = searchParams.get('redirect') || '/'

  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, router, redirectTo])

  if (isAuthenticated) {
    return (
      <Center h="100vh">
        <Text>Redirecting...</Text>
      </Center>
    )
  }

  return (
    <Container size="sm" py="xl">
      <AuthForms 
        onSuccess={() => {
          router.push(redirectTo)
        }}
        redirectTo={redirectTo}
      />
    </Container>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <Center h="100vh">
        <Text>Loading...</Text>
      </Center>
    }>
      <SignInContent />
    </Suspense>
  )
}