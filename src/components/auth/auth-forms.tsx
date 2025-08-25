'use client'

import { useState } from 'react'
import {
  TextInput,
  Button,
  Paper,
  Title,
  Text,
  Anchor,
  Stack,
  Alert,
  Tabs,
  PasswordInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { authActions } from '@/lib/auth-client'

interface AuthFormsProps {
  onSuccess?: () => void
  redirectTo?: string
}

export function AuthForms({ onSuccess, redirectTo }: AuthFormsProps) {
  const [activeTab, setActiveTab] = useState<string | null>('signin')
  const [isLoading, setIsLoading] = useState(false)

  // Sign In Form
  const signInForm = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
      password: (val) => (val.length < 6 ? 'Password should include at least 6 characters' : null),
    },
  })

  // Sign Up Form
  const signUpForm = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
    },
    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
      password: (val) => (val.length < 6 ? 'Password should include at least 6 characters' : null),
      confirmPassword: (val, values) =>
        val !== values.password ? 'Passwords did not match' : null,
      name: (val) => (val.length < 2 ? 'Name should include at least 2 characters' : null),
    },
  })


  const handleSignIn = async (values: { email: string; password: string }) => {
    setIsLoading(true)
    try {
      await authActions.signInWithEmailPassword(values.email, values.password)
      notifications.show({
        title: 'Success',
        message: 'Signed in successfully!',
        color: 'green',
      })
      onSuccess?.()
    } catch (error) {
      notifications.show({
        title: 'Sign In Failed',
        message: error instanceof Error ? error.message : 'An error occurred',
        color: 'red',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (values: { email: string; password: string; name: string }) => {
    setIsLoading(true)
    try {
      await authActions.signUpWithEmailPassword(values.email, values.password, values.name)
      notifications.show({
        title: 'Success',
        message: 'Account created! Please check your email to verify your account.',
        color: 'green',
      })
      onSuccess?.()
    } catch (error) {
      notifications.show({
        title: 'Sign Up Failed',
        message: error instanceof Error ? error.message : 'An error occurred',
        color: 'red',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Magic link functionality temporarily disabled

  return (
    <Paper radius="md" p="xl" withBorder>
      <Title order={2} ta="center" mt="md" mb="md">
        Welcome to Find Five
      </Title>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List grow>
          <Tabs.Tab value="signin">Sign In</Tabs.Tab>
          <Tabs.Tab value="signup">Sign Up</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="signin" pt="md">
          <form onSubmit={signInForm.onSubmit(handleSignIn)}>
            <Stack>
              <TextInput
                required
                label="Email"
                placeholder="your@email.com"
                {...signInForm.getInputProps('email')}
              />
              <PasswordInput
                required
                label="Password"
                placeholder="Your password"
                {...signInForm.getInputProps('password')}
              />
              <Button type="submit" loading={isLoading} fullWidth>
                Sign In
              </Button>
            </Stack>
          </form>
          
          <Text ta="center" mt="md">
            Don&apos;t have an account?{' '}
            <Anchor onClick={() => setActiveTab('signup')}>
              Sign up
            </Anchor>
          </Text>
        </Tabs.Panel>

        <Tabs.Panel value="signup" pt="md">
          <form onSubmit={signUpForm.onSubmit(handleSignUp)}>
            <Stack>
              <TextInput
                required
                label="Name"
                placeholder="Your full name"
                {...signUpForm.getInputProps('name')}
              />
              <TextInput
                required
                label="Email"
                placeholder="your@email.com"
                {...signUpForm.getInputProps('email')}
              />
              <PasswordInput
                required
                label="Password"
                placeholder="Create a password"
                {...signUpForm.getInputProps('password')}
              />
              <PasswordInput
                required
                label="Confirm Password"
                placeholder="Confirm your password"
                {...signUpForm.getInputProps('confirmPassword')}
              />
              <Button type="submit" loading={isLoading} fullWidth>
                Sign Up
              </Button>
            </Stack>
          </form>
          
          <Text ta="center" mt="md">
            Already have an account?{' '}
            <Anchor onClick={() => setActiveTab('signin')}>
              Sign in
            </Anchor>
          </Text>
        </Tabs.Panel>

      </Tabs>
    </Paper>
  )
}