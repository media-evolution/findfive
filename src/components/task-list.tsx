'use client'

import { useEffect } from 'react'
import { useEntriesStore } from '@/store/entries-store'
import { Clock, Trash2, Loader2 } from 'lucide-react'
import { TimeEntry } from '@/lib/supabase'

export function TaskList() {
  const { entries, isLoading, error, loadEntries, deleteEntry, userId } = useEntriesStore()

  useEffect(() => {
    if (userId) {
      loadEntries()
    }
  }, [userId, loadEntries])

  const categoryColors = {
    delegate: 'bg-green-100 text-green-800 border-green-200',
    automate: 'bg-orange-100 text-orange-800 border-orange-200', 
    eliminate: 'bg-red-100 text-red-800 border-red-200',
    personal: 'bg-purple-100 text-purple-800 border-purple-200'
  }

  const categoryLabels = {
    delegate: 'Delegate',
    automate: 'Automate', 
    eliminate: 'Eliminate',
    personal: 'Personal'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteEntry(id)
    }
  }

  if (!userId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please set a user ID to view tasks</p>
      </div>
    )
  }

  if (isLoading && entries.length === 0) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#FF6B6B]" />
        <p className="text-gray-500">Loading tasks...</p>
      </div>
    )
  }

  if (error && entries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-2">Error loading tasks</p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-2">No tasks yet</p>
        <p className="text-sm text-gray-400">Start by recording or adding your first task above</p>
      </div>
    )
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'delegate':
        return 'bg-green-500 text-white'
      case 'automate':
        return 'bg-orange-500 text-white'
      case 'eliminate':
        return 'bg-red-500 text-white'
      case 'personal':
        return 'bg-purple-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  return (
    <div>
      <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>Recent Tasks</h3>
      
      <div className="space-y-4">
        {entries.map((entry: TimeEntry) => (
          <div key={entry.id} className="bg-white rounded-2xl card-shadow p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                  {entry.task_name}
                </h4>
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getCategoryStyle(entry.category)}`}>
                  {categoryLabels[entry.category]}
                </span>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-medium" style={{ color: 'var(--secondary-text)' }}>
                  {formatTime(entry.created_at)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}