'use client'

import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/bottom-nav-mantine'
import { useEntriesStore } from '@/store/entries-store'
import { useUser } from '@/lib/user-context'
import { ArrowLeft, BarChart3, TrendingUp, Clock, Target, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { 
  Container, 
  Title, 
  Paper, 
  Group, 
  Text, 
  Stack, 
  Card, 
  SimpleGrid,
  RingProgress,
  Badge,
  Button,
  Select,
  Box,
  Progress,
  ActionIcon,
  Tabs,
  ThemeIcon
} from '@mantine/core'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts'

export default function AnalyticsPage() {
  const { entries } = useEntriesStore()
  const { userId } = useUser()
  const [dateRange, setDateRange] = useState('week')
  const [activeTab, setActiveTab] = useState('overview')

  // Calculate analytics data using V2 fields
  const taskTypeData = entries.reduce((acc, entry) => {
    const taskType = entry.task_type || 'work'
    if (!acc[taskType]) {
      acc[taskType] = { count: 0, minutes: 0 }
    }
    acc[taskType].count++
    acc[taskType].minutes += entry.duration_minutes
    return acc
  }, {} as Record<string, { count: number; minutes: number }>)

  const enjoymentData = entries.reduce((acc, entry) => {
    const enjoyment = entry.enjoyment || 'neutral'
    if (!acc[enjoyment]) {
      acc[enjoyment] = { count: 0, minutes: 0 }
    }
    acc[enjoyment].count++
    acc[enjoyment].minutes += entry.duration_minutes
    return acc
  }, {} as Record<string, { count: number; minutes: number }>)

  const energyData = entries.reduce((acc, entry) => {
    const energyLevel = entry.energy_level || 3
    const energyLabel = energyLevel <= 2 ? 'Low' : energyLevel >= 4 ? 'High' : 'Medium'
    if (!acc[energyLabel]) {
      acc[energyLabel] = { count: 0, minutes: 0 }
    }
    acc[energyLabel].count++
    acc[energyLabel].minutes += entry.duration_minutes
    return acc
  }, {} as Record<string, { count: number; minutes: number }>)

  const pieData = Object.entries(taskTypeData).map(([taskType, data]) => ({
    name: taskType.charAt(0).toUpperCase() + taskType.slice(1),
    value: data.minutes,
    count: data.count
  }))

  const categoryColors = {
    Work: '#339af0',
    Personal: '#7950f2',
    Both: '#51cf66'
  }

  // Calculate average energy level
  const avgEnergyLevel = entries.length > 0 
    ? entries.reduce((sum, entry) => sum + (entry.energy_level || 3), 0) / entries.length
    : 0

  const totalMinutes = entries.reduce((sum, entry) => sum + entry.duration_minutes, 0)

  // Daily trend data by task type
  const dailyData = entries.reduce((acc, entry) => {
    const date = new Date(entry.created_at).toLocaleDateString()
    if (!acc[date]) {
      acc[date] = { date, work: 0, personal: 0, both: 0 }
    }
    const taskType = entry.task_type || 'work'
    acc[date][taskType] += entry.duration_minutes
    return acc
  }, {} as Record<string, any>)

  const trendData = Object.values(dailyData).slice(-7)

  // Top tasks with V2 data
  const taskFrequency = entries.reduce((acc, entry) => {
    if (!acc[entry.task_name]) {
      acc[entry.task_name] = { 
        name: entry.task_name, 
        count: 0, 
        taskType: entry.task_type || 'work',
        enjoyment: entry.enjoyment || 'neutral',
        avgEnergy: entry.energy_level || 3,
        minutes: 0 
      }
    }
    acc[entry.task_name].count++
    acc[entry.task_name].minutes += entry.duration_minutes
    // Update average energy
    acc[entry.task_name].avgEnergy = (acc[entry.task_name].avgEnergy + (entry.energy_level || 3)) / 2
    return acc
  }, {} as Record<string, any>)

  const topTasks = Object.values(taskFrequency)
    .sort((a: any, b: any) => b.minutes - a.minutes)
    .slice(0, 5)

  return (
    <Box bg="gray.0" mih="100vh" pb={80}>
      {/* Header */}
      <Paper
        radius={0}
        p="md"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Group>
          <ActionIcon
            component={Link}
            href="/"
            variant="subtle"
            color="white"
            size="lg"
          >
            <ArrowLeft size={20} />
          </ActionIcon>
          <Group gap="xs">
            <BarChart3 size={24} color="white" />
            <Title order={3} c="white">Analytics</Title>
          </Group>
        </Group>
      </Paper>

      <Container size="sm" px="md" py="lg">
        <Stack gap="lg">
          {/* Date Range Selector */}
          <Group justify="space-between">
            <Select
              value={dateRange}
              onChange={(value) => setDateRange(value || 'week')}
              data={[
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
                { value: 'all', label: 'All Time' }
              ]}
              radius="xl"
              w={150}
            />
            <Badge size="lg" radius="xl" variant="dot">
              {entries.length} tasks tracked
            </Badge>
          </Group>

          {/* Tabs */}
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'overview')} radius="xl">
            <Tabs.List grow>
              <Tabs.Tab value="overview">Overview</Tabs.Tab>
              <Tabs.Tab value="trends">Trends</Tabs.Tab>
              <Tabs.Tab value="insights">Insights</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="overview" pt="lg">
              {/* Summary Cards */}
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="lg">
                <Card radius="lg" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" c="dimmed">Total Time Tracked</Text>
                    <ThemeIcon variant="light" radius="xl" size="sm">
                      <Clock size={16} />
                    </ThemeIcon>
                  </Group>
                  <Text size="xl" fw={700}>{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</Text>
                  <Text size="xs" c="dimmed" mt={4}>
                    Across {entries.length} tasks
                  </Text>
                </Card>

                <Card radius="lg" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" c="dimmed">Average Energy Level</Text>
                    <ThemeIcon variant="light" radius="xl" size="sm" color="orange">
                      <Target size={16} />
                    </ThemeIcon>
                  </Group>
                  <Text size="xl" fw={700} c="orange">
                    {avgEnergyLevel.toFixed(1)}/5
                  </Text>
                  <Text size="xs" c="dimmed" mt={4}>
                    {avgEnergyLevel >= 4 ? 'High energy tasks' : avgEnergyLevel >= 3 ? 'Moderate energy' : 'Low energy tasks'}
                  </Text>
                </Card>
              </SimpleGrid>

              {/* Task Type Distribution */}
              <Card radius="xl" withBorder mb="lg">
                <Text size="lg" fw={600} mb="md">Task Type Distribution</Text>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}m`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={categoryColors[entry.name as keyof typeof categoryColors]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Text ta="center" c="dimmed" py="xl">No data yet</Text>
                )}
              </Card>

              {/* Top Tasks */}
              <Card radius="lg" withBorder>
                <Text size="lg" fw={600} mb="md">Top Tasks by Time</Text>
                <Stack gap="sm">
                  {topTasks.length > 0 ? topTasks.map((task: any, index: number) => (
                    <Box key={index}>
                      <Group justify="space-between" mb={4}>
                        <Text size="sm" lineClamp={1}>{task.name}</Text>
                        <Group gap={4}>
                          <Badge 
                            color={
                              task.taskType === 'work' ? 'blue' :
                              task.taskType === 'personal' ? 'violet' : 'green'
                            }
                            size="xs"
                          >
                            {task.taskType}
                          </Badge>
                          <Badge 
                            color="gray"
                            size="xs"
                          >
                            {task.minutes}m
                          </Badge>
                          <Badge 
                            color={task.avgEnergy >= 4 ? 'green' : task.avgEnergy >= 3 ? 'yellow' : 'red'}
                            size="xs"
                          >
                            ⚡{Math.round(task.avgEnergy)}
                          </Badge>
                        </Group>
                      </Group>
                      <Progress 
                        value={(task.minutes / totalMinutes) * 100} 
                        size="sm" 
                        radius="xl"
                        color={
                          task.taskType === 'work' ? 'blue' :
                          task.taskType === 'personal' ? 'violet' : 'green'
                        }
                      />
                    </Box>
                  )) : (
                    <Text ta="center" c="dimmed" py="lg">No tasks tracked yet</Text>
                  )}
                </Stack>
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="trends" pt="lg">
              <Card radius="lg" withBorder>
                <Text size="lg" fw={600} mb="md">Daily Activity Trend</Text>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="work" stackId="1" stroke="#339af0" fill="#339af0" />
                      <Area type="monotone" dataKey="personal" stackId="1" stroke="#7950f2" fill="#7950f2" />
                      <Area type="monotone" dataKey="both" stackId="1" stroke="#51cf66" fill="#51cf66" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Text ta="center" c="dimmed" py="xl">Not enough data for trends yet</Text>
                )}
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="insights" pt="lg">
              <Stack gap="md">
                <Card radius="lg" withBorder>
                  <Group mb="md">
                    <ThemeIcon variant="light" radius="xl" color="blue" size="lg">
                      <Target size={20} />
                    </ThemeIcon>
                    <Text size="lg" fw={600}>Work vs Personal Balance</Text>
                  </Group>
                  <Text size="sm" c="dimmed" mb="sm">
                    Work: {Math.round((taskTypeData.work?.minutes || 0) / 60)}h {(taskTypeData.work?.minutes || 0) % 60}m • 
                    Personal: {Math.round((taskTypeData.personal?.minutes || 0) / 60)}h {(taskTypeData.personal?.minutes || 0) % 60}m
                  </Text>
                  <Text size="sm">
                    {(taskTypeData.work?.minutes || 0) > (taskTypeData.personal?.minutes || 0) 
                      ? 'You\'re spending more time on work tasks. Consider balancing with personal activities.'
                      : 'Good balance between work and personal tasks.'}
                  </Text>
                </Card>

                <Card radius="lg" withBorder>
                  <Group mb="md">
                    <ThemeIcon variant="light" radius="xl" color="green" size="lg">
                      <Lightbulb size={20} />
                    </ThemeIcon>
                    <Text size="lg" fw={600}>Task Enjoyment Analysis</Text>
                  </Group>
                  <Text size="sm" c="dimmed" mb="sm">
                    Liked: {enjoymentData.like?.count || 0} tasks • 
                    Neutral: {enjoymentData.neutral?.count || 0} tasks • 
                    Disliked: {enjoymentData.dislike?.count || 0} tasks
                  </Text>
                  <Text size="sm">
                    {(enjoymentData.dislike?.count || 0) > (enjoymentData.like?.count || 0)
                      ? 'You\'re spending significant time on tasks you dislike. Consider delegating or restructuring these.'
                      : 'You seem to enjoy most of your tasks - that\'s great for productivity!'}
                  </Text>
                </Card>

                <Card radius="lg" withBorder>
                  <Group mb="md">
                    <ThemeIcon variant="light" radius="xl" color="orange" size="lg">
                      <TrendingUp size={20} />
                    </ThemeIcon>
                    <Text size="lg" fw={600}>Energy Level Insights</Text>
                  </Group>
                  <Text size="sm" c="dimmed" mb="sm">
                    High Energy: {energyData.High?.minutes || 0}m • 
                    Medium: {energyData.Medium?.minutes || 0}m • 
                    Low Energy: {energyData.Low?.minutes || 0}m
                  </Text>
                  <Text size="sm">
                    {avgEnergyLevel >= 4 
                      ? 'You maintain high energy levels across tasks. Great job!'
                      : avgEnergyLevel >= 3
                      ? 'Your energy levels are moderate. Consider scheduling demanding tasks when you\'re most energized.'
                      : 'Many tasks are done at low energy. Try to schedule important work during your peak hours.'}
                  </Text>
                </Card>

                {entries.length > 0 && (
                  <Card radius="lg" withBorder bg="blue.0">
                    <Group>
                      <RingProgress
                        size={80}
                        thickness={8}
                        sections={[
                          { value: (avgEnergyLevel / 5) * 100, color: avgEnergyLevel >= 4 ? 'green' : avgEnergyLevel >= 3 ? 'orange' : 'red' },
                        ]}
                        label={
                          <Text size="sm" ta="center" fw={700}>
                            {avgEnergyLevel.toFixed(1)}
                          </Text>
                        }
                      />
                      <Box style={{ flex: 1 }}>
                        <Text size="lg" fw={600} c="blue.9">Overall Energy Score</Text>
                        <Text size="sm" c="blue.7">
                          Your average energy level across all tasks is {avgEnergyLevel.toFixed(1)}/5. 
                          {avgEnergyLevel >= 4 ? ' Excellent energy management!' : ' Consider optimizing your schedule around peak energy times.'}
                        </Text>
                      </Box>
                    </Group>
                  </Card>
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>

      <BottomNav />
    </Box>
  )
}