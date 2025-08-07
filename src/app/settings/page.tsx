'use client'

import { useEffect, useState } from 'react'
import { useEntriesStore } from '@/store/entries-store'
import { BottomNav } from '@/components/bottom-nav'
import { ArrowLeft, User, Trash2, Download, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const { userId, entries, clearError } = useEntriesStore()
  const [localUserId, setLocalUserId] = useState('')

  useEffect(() => {
    const storedUserId = localStorage.getItem('find-five-user-id') || ''
    setLocalUserId(storedUserId)
  }, [])

  const handleUserIdChange = (newId: string) => {
    setLocalUserId(newId)
    localStorage.setItem('find-five-user-id', newId)
    // Force page reload to apply new user ID
    window.location.reload()
  }

  const exportData = () => {
    const data = {
      userId,
      entries,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `find-five-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="gradient-primary text-white p-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-white/90" />
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* User ID Section */}
        <div className="rounded-3xl card-shadow-lg p-6" style={{ backgroundColor: 'var(--card-background)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>User Settings</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="userId" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                User ID (for development)
              </label>
              <div className="flex gap-2">
                <input
                  id="userId"
                  type="text"
                  value={localUserId}
                  onChange={(e) => setLocalUserId(e.target.value)}
                  placeholder="Enter user ID"
                  className="flex-1 px-4 py-3 rounded-2xl outline-none transition-all"
                  style={{ 
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card-background)',
                    color: 'var(--foreground)'
                  }}
                />
                <button
                  onClick={() => handleUserIdChange(localUserId)}
                  className="px-6 py-3 gradient-primary text-white rounded-2xl card-shadow transition-all"
                >
                  Save
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--secondary-text)' }}>
                Current: {userId || 'Not set'}
              </p>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="rounded-3xl card-shadow-lg p-6" style={{ backgroundColor: 'var(--card-background)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Data Management</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl" style={{ border: '1px solid var(--border)' }}>
              <div>
                <h4 className="font-medium" style={{ color: 'var(--foreground)' }}>Export Data</h4>
                <p className="text-sm" style={{ color: 'var(--secondary-text)' }}>Download your tasks as JSON</p>
              </div>
              <button
                onClick={exportData}
                className="flex items-center gap-2 px-4 py-3 text-white rounded-2xl card-shadow transition-all"
                style={{ backgroundColor: 'var(--ios-active)' }}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl" style={{ border: '1px solid #ff3b30', backgroundColor: '#ff3b30' + '10' }}>
              <div>
                <h4 className="font-medium" style={{ color: '#ff3b30' }}>Clear All Data</h4>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>Remove all tasks and settings</p>
              </div>
              <button
                onClick={clearAllData}
                className="flex items-center gap-2 px-4 py-3 text-white rounded-2xl card-shadow transition-all"
                style={{ backgroundColor: '#ff3b30' }}
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div className="rounded-3xl card-shadow-lg p-6" style={{ backgroundColor: 'var(--card-background)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>App Information</h3>
          <div className="space-y-2 text-sm" style={{ color: 'var(--secondary-text)' }}>
            <div className="flex justify-between">
              <span>Version:</span>
              <span style={{ color: 'var(--foreground)' }}>1.0.0 MVP</span>
            </div>
            <div className="flex justify-between">
              <span>Tasks Stored:</span>
              <span style={{ color: 'var(--foreground)' }}>{entries.length}</span>
            </div>
            <div className="flex justify-between">
              <span>PWA Support:</span>
              <span style={{ color: '#34c759' }}>Enabled</span>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="rounded-3xl card-shadow-lg p-6" style={{ backgroundColor: 'var(--card-background)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>About Find Five</h3>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--secondary-text)' }}>
            Find Five helps you identify the five most important things to focus on by tracking 
            where your time goes and categorizing tasks for delegation, automation, or elimination.
          </p>
          <div className="p-4 rounded-2xl gradient-primary">
            <p className="text-sm text-white font-medium">
              MVP Version - Basic functionality for time tracking and AI categorization
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}