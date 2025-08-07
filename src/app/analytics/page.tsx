'use client'

import { useEffect } from 'react'
import { AnalyticsChart } from '@/components/analytics-chart'
import { BottomNav } from '@/components/bottom-nav'
import { useEntriesStore } from '@/store/entries-store'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function AnalyticsPage() {
  const { userId, setUserId } = useEntriesStore()

  useEffect(() => {
    // For MVP, use a simple user ID from localStorage
    if (!userId) {
      let storedUserId = localStorage.getItem('find-five-user-id')
      if (!storedUserId) {
        storedUserId = `user-${Date.now()}`
        localStorage.setItem('find-five-user-id', storedUserId)
      }
      setUserId(storedUserId)
    }
  }, [userId, setUserId])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="gradient-primary text-white p-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-white/90" />
            <h1 className="text-xl font-semibold">Analytics</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        <AnalyticsChart />
        
        {/* Insights Section */}
        <div className="mt-6 rounded-3xl card-shadow-lg p-6" style={{ backgroundColor: 'var(--card-background)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Insights</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border-l-4" style={{ backgroundColor: '#34c759' + '20', borderLeftColor: '#34c759' }}>
              <h4 className="font-medium mb-1" style={{ color: '#34c759' }}>Delegation Opportunities</h4>
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                Look for tasks marked as "Delegate" - these can free up your time for higher-value work.
              </p>
            </div>
            
            <div className="p-4 rounded-2xl border-l-4" style={{ backgroundColor: '#ff9500' + '20', borderLeftColor: '#ff9500' }}>
              <h4 className="font-medium mb-1" style={{ color: '#ff9500' }}>Automation Potential</h4>
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                "Automate" tasks are repetitive and could benefit from tools, templates, or software solutions.
              </p>
            </div>
            
            <div className="p-4 rounded-2xl border-l-4" style={{ backgroundColor: '#ff3b30' + '20', borderLeftColor: '#ff3b30' }}>
              <h4 className="font-medium mb-1" style={{ color: '#ff3b30' }}>Time Wasters</h4>
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                "Eliminate" tasks provide little value - consider stopping or reducing these activities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}