'use client'

import { useState } from 'react'
import {
  Group,
  Button,
  Select,
  TextInput,
  Badge,
  ActionIcon,
  Tooltip,
  Box,
  Stack,
  Collapse,
  MultiSelect,
  Text
} from '@mantine/core'
// import { DatePickerInput } from '@mantine/dates'
import {
  IconFilter,
  IconX,
  IconCalendar,
  IconSearch,
  IconChevronDown,
  IconChevronUp,
  IconRefresh
} from '@tabler/icons-react'
import { EisenhowerFilters, EisenhowerStats } from '@/lib/eisenhower-service'

interface FilterControlsProps {
  filters: EisenhowerFilters
  onFiltersChange: (filters: Partial<EisenhowerFilters>) => void
  onClearFilters: () => void
  stats?: EisenhowerStats
  sessions?: Array<{ id: string; name: string; date: string }>
  isLoading?: boolean
}

export function FilterControls({
  filters,
  onFiltersChange,
  onClearFilters,
  stats,
  sessions = [],
  isLoading = false
}: FilterControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const hasActiveFilters = !!(
    filters.dateRange ||
    filters.sessionId ||
    (filters.category && filters.category.length > 0) ||
    searchQuery
  )

  const activeFilterCount = [
    filters.dateRange,
    filters.sessionId,
    filters.category?.length,
    searchQuery
  ].filter(Boolean).length

  const categoryOptions = [
    { value: 'delegate', label: 'Delegate', color: 'blue' },
    { value: 'automate', label: 'Automate', color: 'green' },
    { value: 'eliminate', label: 'Eliminate', color: 'red' },
    { value: 'personal', label: 'Personal', color: 'violet' }
  ]

  const sessionOptions = sessions.map(session => ({
    value: session.id,
    label: `${session.name} - ${new Date(session.date).toLocaleDateString()}`
  }))

  const handleDateRangeChange = (dates: [Date | null, Date | null] | null) => {
    if (!dates) {
      onFiltersChange({
        dateRange: undefined
      })
      return
    }
    
    const [start, end] = dates
    if (start && end) {
      onFiltersChange({
        dateRange: { start, end }
      })
    } else if (!start && !end) {
      onFiltersChange({
        dateRange: undefined
      })
    }
  }

  const handleCategoryChange = (categories: string[]) => {
    onFiltersChange({
      category: categories.length > 0 ? categories : undefined
    })
  }

  const handleSessionChange = (sessionId: string | null) => {
    onFiltersChange({
      sessionId: sessionId || undefined
    })
  }

  const handleClearAll = () => {
    setSearchQuery('')
    onClearFilters()
  }

  return (
    <Box>
      {/* Main Filter Bar */}
      <Group justify="space-between" mb="sm">
        <Group gap="sm">
          <Button
            variant="light"
            leftSection={<IconFilter size={16} />}
            rightSection={
              isExpanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />
            }
            onClick={() => setIsExpanded(!isExpanded)}
          >
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>

          {hasActiveFilters && (
            <Tooltip label="Clear all filters">
              <ActionIcon
                variant="subtle"
                color="red"
                onClick={handleClearAll}
                disabled={isLoading}
              >
                <IconX size={16} />
              </ActionIcon>
            </Tooltip>
          )}

          {/* Quick Stats */}
          {stats && (
            <Group gap="xs">
              <Badge variant="light" size="sm">
                {stats.total} total
              </Badge>
              <Badge 
                variant="light" 
                color={stats.uncategorized > 0 ? 'orange' : 'green'}
                size="sm"
              >
                {stats.uncategorized} uncategorized
              </Badge>
            </Group>
          )}
        </Group>

        <Group gap="sm">
          {/* Search */}
          <TextInput
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftSection={<IconSearch size={16} />}
            style={{ width: 200 }}
            disabled={isLoading}
          />

          <Tooltip label="Refresh data">
            <ActionIcon
              variant="subtle"
              onClick={() => window.location.reload()}
              disabled={isLoading}
              loading={isLoading}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <Group gap="xs" mb="sm">
          <Badge size="xs" variant="light" color="gray">Active filters:</Badge>
          
          {filters.dateRange && (
            <Badge
              variant="light"
              color="blue"
              rightSection={
                <ActionIcon 
                  size={12} 
                  variant="transparent"
                  onClick={() => onFiltersChange({ dateRange: undefined })}
                >
                  <IconX size={8} />
                </ActionIcon>
              }
            >
              Date Range
            </Badge>
          )}

          {filters.sessionId && (
            <Badge
              variant="light"
              color="purple"
              rightSection={
                <ActionIcon 
                  size={12} 
                  variant="transparent"
                  onClick={() => onFiltersChange({ sessionId: undefined })}
                >
                  <IconX size={8} />
                </ActionIcon>
              }
            >
              Session
            </Badge>
          )}

          {filters.category && filters.category.length > 0 && (
            <Badge
              variant="light"
              color="green"
              rightSection={
                <ActionIcon 
                  size={12} 
                  variant="transparent"
                  onClick={() => onFiltersChange({ category: undefined })}
                >
                  <IconX size={8} />
                </ActionIcon>
              }
            >
              {filters.category.length} Categories
            </Badge>
          )}

          {searchQuery && (
            <Badge
              variant="light"
              color="yellow"
              rightSection={
                <ActionIcon 
                  size={12} 
                  variant="transparent"
                  onClick={() => setSearchQuery('')}
                >
                  <IconX size={8} />
                </ActionIcon>
              }
            >
              Search: "{searchQuery.slice(0, 10)}..."
            </Badge>
          )}
        </Group>
      )}

      {/* Expanded Filter Controls */}
      <Collapse in={isExpanded}>
        <Box 
          p="md" 
          style={{
            backgroundColor: 'var(--mantine-color-gray-0)',
            borderRadius: 'var(--mantine-radius-md)',
            border: '1px solid var(--mantine-color-gray-3)'
          }}
        >
          <Stack gap="md">
            <Group grow>
              {/* Date Range - Simplified for now */}
              <Box>
                <Text size="sm" fw={500} mb="xs">Date Range</Text>
                <Text size="xs" c="dimmed">Use quick filters below for date ranges</Text>
              </Box>

              {/* Session Filter */}
              <Select
                label="Session"
                placeholder="All sessions"
                value={filters.sessionId || null}
                onChange={handleSessionChange}
                data={sessionOptions}
                clearable
                searchable
                disabled={isLoading}
                comboboxProps={{ withinPortal: false }}
              />
            </Group>

            <Group grow>
              {/* Category Filter */}
              <MultiSelect
                label="AI Categories"
                placeholder="All categories"
                value={filters.category || []}
                onChange={handleCategoryChange}
                data={categoryOptions}
                clearable
                disabled={isLoading}
                comboboxProps={{ withinPortal: false }}
              />

              {/* Quick Date Presets */}
              <Box>
                <Box mb="xs">
                  <Badge size="xs" variant="light">Quick Filters</Badge>
                </Box>
                <Group gap="xs">
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => {
                      const today = new Date()
                      onFiltersChange({
                        dateRange: {
                          start: new Date(today.setHours(0, 0, 0, 0)),
                          end: new Date(today.setHours(23, 59, 59, 999))
                        }
                      })
                    }}
                    disabled={isLoading}
                  >
                    Today
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => {
                      const end = new Date()
                      const start = new Date()
                      start.setDate(start.getDate() - 7)
                      onFiltersChange({
                        dateRange: { start, end }
                      })
                    }}
                    disabled={isLoading}
                  >
                    Last 7 Days
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => {
                      const end = new Date()
                      const start = new Date()
                      start.setDate(start.getDate() - 30)
                      onFiltersChange({
                        dateRange: { start, end }
                      })
                    }}
                    disabled={isLoading}
                  >
                    Last 30 Days
                  </Button>
                </Group>
              </Box>
            </Group>

            {/* Stats Summary */}
            {stats && (
              <Box>
                <Group gap="xs" mb="xs">
                  <Badge size="xs" variant="light">Current Results</Badge>
                </Group>
                <Group gap="sm">
                  <Badge variant="light" color="blue" size="sm">
                    Total: {stats.total}
                  </Badge>
                  <Badge variant="light" color="green" size="sm">
                    Categorized: {stats.categorized}
                  </Badge>
                  <Badge variant="light" color="orange" size="sm">
                    Pending: {stats.uncategorized}
                  </Badge>
                </Group>
              </Box>
            )}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  )
}