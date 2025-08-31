import { Container, Title, Text, Paper, Stack } from '@mantine/core';

export default function HomePage() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Paper p="xl" withBorder radius="md">
          <Stack gap="md" align="center">
            <Title order={1}>Find Five Desktop</Title>
            <Text size="lg" ta="center" c="dimmed">
              Task Categorization & Management Interface
            </Text>
            <Text ta="center">
              This is the desktop version of Find Five focused on categorizing 
              and managing tasks recorded from the mobile app using the Eisenhower Matrix.
            </Text>
          </Stack>
        </Paper>
        
        <Paper p="xl" withBorder radius="md">
          <Stack gap="md">
            <Title order={2}>Coming Soon</Title>
            <Text>
              • View all recorded tasks from mobile sessions
            </Text>
            <Text>
              • Eisenhower Matrix categorization interface
            </Text>
            <Text>
              • Bulk task management and actions
            </Text>
            <Text>
              • Advanced filtering and search
            </Text>
            <Text>
              • Analytics and reporting dashboard
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}