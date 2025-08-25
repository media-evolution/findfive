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

  // Calculate analytics data
  const categoryData = entries.reduce((acc, entry) => {
    const category = entry.category
    if (!acc[category]) {
      acc[category] = { count: 0, minutes: 0 }
    }
    acc[category].count++
    acc[category].minutes += entry.duration_minutes
    return acc
  }, {} as Record<string, { count: number; minutes: number }>)

  const pieData = Object.entries(categoryData).map(([category, data]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: data.minutes,
    count: data.count
  }))

  const categoryColors = {
    Delegate: '#40c057',
    Automate: '#fd7e14',
    Eliminate: '#fa5252',
    Personal: '#7950f2'
  }

  // Calculate time saved potential
  const potentialTimeSaved = 
    (categoryData.delegate?.minutes || 0) + 
    (categoryData.automate?.minutes || 0) * 0.8 + 
    (categoryData.eliminate?.minutes || 0)

  const totalMinutes = entries.reduce((sum, entry) => sum + entry.duration_minutes, 0)

  // Daily trend data
  const dailyData = entries.reduce((acc, entry) => {
    const date = new Date(entry.created_at).toLocaleDateString()
    if (!acc[date]) {
      acc[date] = { date, delegate: 0, automate: 0, eliminate: 0, personal: 0 }
    }
    acc[date][entry.category] += entry.duration_minutes
    return acc
  }, {} as Record<string, any>)

  const trendData = Object.values(dailyData).slice(-7)

  // Top tasks
  const taskFrequency = entries.reduce((acc, entry) => {
    if (!acc[entry.task_name]) {
      acc[entry.task_name] = { name: entry.task_name, count: 0, category: entry.category, minutes: 0 }
    }
    acc[entry.task_name].count++
    acc[entry.task_name].minutes += entry.duration_minutes
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
                <Card radius="xl" withBorder>
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

                <Card radius="xl" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" c="dimmed">Time Save Potential</Text>
                    <ThemeIcon variant="light" radius="xl" size="sm" color="green">
                      <Target size={16} />
                    </ThemeIcon>
                  </Group>
                  <Text size="xl" fw={700} c="green">
                    {Math.floor(potentialTimeSaved / 60)}h {Math.round(potentialTimeSaved % 60)}m
                  </Text>
                  <Text size="xs" c="dimmed" mt={4}>
                    {totalMinutes > 0 ? Math.round((potentialTimeSaved / totalMinutes) * 100) : 0}% of total time
                  </Text>
                </Card>
              </SimpleGrid>

              {/* Category Distribution */}
              <Card radius="xl" withBorder mb="lg">
                <Text size="lg" fw={600} mb="md">Category Distribution</Text>
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
              <Card radius="xl" withBorder>
                <Text size="lg" fw={600} mb="md">Top Tasks by Time</Text>
                <Stack gap="sm">
                  {topTasks.length > 0 ? topTasks.map((task: any, index: number) => (
                    <Box key={index}>
                      <Group justify="space-between" mb={4}>
                        <Text size="sm" lineClamp={1}>{task.name}</Text>
                        <Badge 
                          color={
                            task.category === 'delegate' ? 'green' :
                            task.category === 'automate' ? 'orange' :
                            task.category === 'eliminate' ? 'red' : 'violet'
                          }
                          size="sm"
                        >
                          {task.minutes}m
                        </Badge>
                      </Group>
                      <Progress 
                        value={(task.minutes / totalMinutes) * 100} 
                        size="sm" 
                        radius="xl"
                        color={
                          task.category === 'delegate' ? 'green' :
                          task.category === 'automate' ? 'orange' :
                          task.category === 'eliminate' ? 'red' : 'violet'
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
              <Card radius="xl" withBorder>
                <Text size="lg" fw={600} mb="md">Daily Activity Trend</Text>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="delegate" stackId="1" stroke="#40c057" fill="#40c057" />
                      <Area type="monotone" dataKey="automate" stackId="1" stroke="#fd7e14" fill="#fd7e14" />
                      <Area type="monotone" dataKey="eliminate" stackId="1" stroke="#fa5252" fill="#fa5252" />
                      <Area type="monotone" dataKey="personal" stackId="1" stroke="#7950f2" fill="#7950f2" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Text ta="center" c="dimmed" py="xl">Not enough data for trends yet</Text>
                )}
              </Card>
            </Tabs.Panel>

            <Tabs.Panel value="insights" pt="lg">
              <Stack gap="md">
                <Card radius="xl" withBorder>
                  <Group mb="md">
                    <ThemeIcon variant="light" radius="xl" color="green" size="lg">
                      <Target size={20} />
                    </ThemeIcon>
                    <Text size="lg" fw={600}>Delegation Opportunities</Text>
                  </Group>
                  <Text size="sm" c="dimmed" mb="sm">
                    Tasks you can delegate to free up {Math.round((categoryData.delegate?.minutes || 0) / 60)}h {(categoryData.delegate?.minutes || 0) % 60}m
                  </Text>
                  <Text size="sm">
                    Focus on delegating repetitive tasks that don't require your unique expertise. 
                    {categoryData.delegate?.count ? ` You have ${categoryData.delegate.count} tasks marked for delegation.` : ''}
                  </Text>
                </Card>

                <Card radius="xl" withBorder>
                  <Group mb="md">
                    <ThemeIcon variant="light" radius="xl" color="orange" size="lg">
                      <Lightbulb size={20} />
                    </ThemeIcon>
                    <Text size="lg" fw={600}>Automation Potential</Text>
                  </Group>
                  <Text size="sm" c="dimmed" mb="sm">
                    Tasks that could be automated, saving ~{Math.round((categoryData.automate?.minutes || 0) * 0.8 / 60)}h {Math.round((categoryData.automate?.minutes || 0) * 0.8 % 60)}m
                  </Text>
                  <Text size="sm">
                    Look for tools, templates, or software that can handle these repetitive tasks.
                    {categoryData.automate?.count ? ` You have ${categoryData.automate.count} automation candidates.` : ''}
                  </Text>
                </Card>

                <Card radius="xl" withBorder>
                  <Group mb="md">
                    <ThemeIcon variant="light" radius="xl" color="red" size="lg">
                      <TrendingUp size={20} />
                    </ThemeIcon>
                    <Text size="lg" fw={600}>Time Wasters</Text>
                  </Group>
                  <Text size="sm" c="dimmed" mb="sm">
                    Low-value tasks consuming {Math.round((categoryData.eliminate?.minutes || 0) / 60)}h {(categoryData.eliminate?.minutes || 0) % 60}m
                  </Text>
                  <Text size="sm">
                    Consider eliminating or significantly reducing these activities.
                    {categoryData.eliminate?.count ? ` You've identified ${categoryData.eliminate.count} tasks to eliminate.` : ''}
                  </Text>
                </Card>

                {potentialTimeSaved > 0 && (
                  <Card radius="xl" withBorder bg="green.0">
                    <Group>
                      <RingProgress
                        size={80}
                        thickness={8}
                        sections={[
                          { value: (potentialTimeSaved / totalMinutes) * 100, color: 'green' },
                        ]}
                        label={
                          <Text size="sm" ta="center" fw={700}>
                            {Math.round((potentialTimeSaved / totalMinutes) * 100)}%
                          </Text>
                        }
                      />
                      <Box style={{ flex: 1 }}>
                        <Text size="lg" fw={600} c="green.9">Optimization Opportunity</Text>
                        <Text size="sm" c="green.7">
                          You could save up to {Math.floor(potentialTimeSaved / 60)}h {Math.round(potentialTimeSaved % 60)}m 
                          by delegating, automating, or eliminating identified tasks.
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