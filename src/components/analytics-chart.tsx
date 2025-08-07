'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { useEntriesStore } from '@/store/entries-store'
import { TimeEntry } from '@/lib/supabase'
import { Calendar, Clock, TrendingUp } from 'lucide-react'

interface CategoryData {
  name: string
  value: number
  count: number
  color: string
  label: string
}

export function AnalyticsChart() {
  const { entries } = useEntriesStore()
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week')

  const categoryColors = {
    delegate: '#34c759',    // Green
    automate: '#ff9500',    // Orange
    eliminate: '#ff3b30',   // Red
    personal: '#5856d6'     // Purple
  }

  const categoryLabels = {
    delegate: 'Delegate',
    automate: 'Automate',
    eliminate: 'Eliminate',
    personal: 'Personal'
  }

  const getFilteredEntries = (): TimeEntry[] => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    let cutoffDate: Date
    
    switch (dateRange) {
      case 'today':
        cutoffDate = startOfDay
        break
      case 'week':
        cutoffDate = new Date(startOfDay.getTime() - (7 * 24 * 60 * 60 * 1000))
        break
      case 'month':
        cutoffDate = new Date(startOfDay.getTime() - (30 * 24 * 60 * 60 * 1000))
        break
      default:
        cutoffDate = new Date(0)
    }

    return entries.filter(entry => new Date(entry.created_at) >= cutoffDate)
  }

  const getAnalyticsData = (): CategoryData[] => {
    const filteredEntries = getFilteredEntries()
    
    const categoryData: Record<string, { minutes: number; count: number }> = {
      delegate: { minutes: 0, count: 0 },
      automate: { minutes: 0, count: 0 },
      eliminate: { minutes: 0, count: 0 },
      personal: { minutes: 0, count: 0 }
    }

    filteredEntries.forEach(entry => {
      categoryData[entry.category].minutes += entry.duration_minutes
      categoryData[entry.category].count += 1
    })

    return Object.entries(categoryData)
      .filter(([_, data]) => data.minutes > 0)
      .map(([category, data]) => ({
        name: category,
        value: data.minutes,
        count: data.count,
        color: categoryColors[category as keyof typeof categoryColors],
        label: categoryLabels[category as keyof typeof categoryLabels]
      }))
      .sort((a, b) => b.value - a.value)
  }

  const data = getAnalyticsData()
  const filteredEntries = getFilteredEntries()
  const totalMinutes = data.reduce((sum, item) => sum + item.value, 0)
  const totalTasks = filteredEntries.length

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = totalMinutes > 0 ? ((data.value / totalMinutes) * 100).toFixed(1) : 0
      return (
        <div className="p-3 rounded-2xl card-shadow-lg" style={{ backgroundColor: 'var(--card-background)', border: '1px solid var(--border)' }}>
          <p className="font-medium" style={{ color: 'var(--foreground)' }}>{data.label}</p>
          <p className="text-sm" style={{ color: 'var(--secondary-text)' }}>
            {data.value} minutes ({percentage}%)
          </p>
          <p className="text-sm" style={{ color: 'var(--secondary-text)' }}>
            {data.count} task{data.count !== 1 ? 's' : ''}
          </p>
        </div>
      )
    }
    return null
  }

  if (totalTasks === 0) {
    return (
      <div className="rounded-3xl card-shadow-lg p-6" style={{ backgroundColor: 'var(--card-background)' }}>
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--secondary-text)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>No Data Yet</h3>
          <p style={{ color: 'var(--secondary-text)' }}>
            Start tracking tasks to see your time breakdown
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl card-shadow-lg p-6" style={{ backgroundColor: 'var(--card-background)' }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Time Breakdown</h3>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="text-sm rounded-2xl px-3 py-2 outline-none transition-all"
          style={{ 
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card-background)',
            color: 'var(--foreground)'
          }}
        >
          <option value="today">Today</option>
          <option value="week">Past Week</option>
          <option value="month">Past Month</option>
        </select>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--secondary-text)' }} />
          <p style={{ color: 'var(--secondary-text)' }}>No tasks in selected time period</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 rounded-2xl" style={{ backgroundColor: 'var(--background)' }}>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4" style={{ color: 'var(--gradient-start)' }} />
                <span className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--secondary-text)' }}>Total Time</p>
            </div>
            <div className="text-center p-4 rounded-2xl" style={{ backgroundColor: 'var(--background)' }}>
              <span className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{totalTasks}</span>
              <p className="text-sm" style={{ color: 'var(--secondary-text)' }}>Tasks Logged</p>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  formatter={(value, entry) => (
                    <span style={{ color: entry.color }}>{entry.payload.label}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-3">
            {data.map((category) => {
              const percentage = totalMinutes > 0 ? (category.value / totalMinutes) * 100 : 0
              return (
                <div key={category.name} className="flex items-center justify-between p-3 rounded-2xl" style={{ backgroundColor: 'var(--background)' }}>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium" style={{ color: 'var(--foreground)' }}>{category.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium" style={{ color: 'var(--foreground)' }}>
                      {category.value}m ({percentage.toFixed(0)}%)
                    </div>
                    <div className="text-xs" style={{ color: 'var(--secondary-text)' }}>
                      {category.count} task{category.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}